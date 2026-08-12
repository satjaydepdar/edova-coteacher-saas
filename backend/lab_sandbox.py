"""Subprocess code execution for POST /api/v1/engine/lab/execute.

Contract prototype: migration/index.html "Lab Sandbox Engine"
(request: code/language/timeout_seconds/memory_limit_mb/stdin;
 response: execution{exit_code,stdout,stderr,cpu_time_ms,peak_memory_mb,timed_out}).

Safety model — deliberately honest, unlike the prototype's "seccomp+cgroup_v2" label:
- Hard env gate EDOVA_LAB_EXEC_ENABLED (checked in main.py). Enable only where the
  host is disposable: dedicated container, no host mounts, restricted egress.
- POSIX: setrlimit RLIMIT_CPU / RLIMIT_AS (memory) / RLIMIT_NOFILE / RLIMIT_FSIZE /
  RLIMIT_NPROC via preexec_fn, scrubbed env, fresh temp cwd, `python -I` isolation,
  process-group kill on timeout (start_new_session + killpg).
- Windows (dev only): wall-clock timeout + process kill; rlimits unsupported and
  reported as "wall-timeout-only" in the sandbox block.

This is NOT a security boundary against hostile code on a shared host. Production
hardening path: move execution into a per-request locked-down container/VM
(no network, read-only fs, non-root). Keep the endpoint contract stable so the
swap is invisible to clients.
"""
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import time

IS_POSIX = os.name == "posix"
if IS_POSIX:
    import resource
    import signal

MAX_CODE_BYTES = 64 * 1024
MAX_STDIN_BYTES = 8 * 1024
MAX_OUTPUT_BYTES = 256 * 1024
MIN_AS_MB = 64          # CPython won't start below ~48MB address space; clamp request up
COMPILE_TIMEOUT_S = 20  # g++/javac get their own wall budget, separate from run timeout
KILL_EXIT_CODE = 137    # 128 + SIGKILL; matches the prototype UI convention


class SandboxError(Exception):
    """Unavailable language/runtime on this host. Maps to HTTP 422."""


def available_languages() -> dict:
    """language -> runtime present on this host."""
    return {
        "python": True,  # sys.executable always exists
        "javascript": shutil.which("node") is not None,
        "cpp": shutil.which("g++") is not None,
        "java": shutil.which("javac") is not None and shutil.which("java") is not None,
    }


def _language_plan(language: str, workdir: str):
    """Return (src_path, run_argv, compile_argv|None) or raise SandboxError."""
    if language == "python":
        src = os.path.join(workdir, "main.py")
        return src, [sys.executable, "-I", "-u", src], None
    if language == "javascript":
        node = shutil.which("node")
        if not node:
            raise SandboxError("javascript runtime (node) is not installed on this server")
        src = os.path.join(workdir, "main.js")
        return src, [node, src], None
    if language == "cpp":
        gpp = shutil.which("g++")
        if not gpp:
            raise SandboxError("cpp toolchain (g++) is not installed on this server")
        src = os.path.join(workdir, "main.cpp")
        exe = os.path.join(workdir, "main")
        return src, [exe], [gpp, "-O1", "-o", exe, src]
    if language == "java":
        javac, java = shutil.which("javac"), shutil.which("java")
        if not (javac and java):
            raise SandboxError("java toolchain (javac/java) is not installed on this server")
        src = os.path.join(workdir, "Main.java")
        return src, [java, "-cp", workdir, "Main"], [javac, src]
    raise SandboxError(f"unsupported language: {language!r} "
                       f"(supported: {', '.join(available_languages())})")


def _run_limits_preexec(timeout_s: int, mem_mb: int):
    """POSIX rlimits for the RUN step. Compilers need far more AS than students'
    programs, so the compile step runs without an AS cap."""
    def apply():
        resource.setrlimit(resource.RLIMIT_CPU, (timeout_s + 1, timeout_s + 1))
        as_bytes = max(mem_mb, MIN_AS_MB) * 2 ** 20
        resource.setrlimit(resource.RLIMIT_AS, (as_bytes, as_bytes))
        resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
        resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))
        try:
            resource.setrlimit(resource.RLIMIT_NPROC, (64, 64))
        except (ValueError, OSError):
            pass  # not enforceable for root; container hardening covers this
    return apply


def _decode(data: bytes) -> tuple:
    """(text, truncated) — utf-8 with replacement, capped at MAX_OUTPUT_BYTES."""
    truncated = len(data) > MAX_OUTPUT_BYTES
    if truncated:
        data = data[:MAX_OUTPUT_BYTES]
    return data.decode("utf-8", errors="replace"), truncated


def _spawn(argv, workdir, stdin_bytes, timeout_s, mem_mb, with_rlimits):
    """Run one process; return dict with exit_code/stdout/stderr/cpu_ms/peak_mb/timed_out."""
    env = {"PATH": os.environ.get("PATH", ""), "HOME": workdir}
    if IS_POSIX:
        env["TMPDIR"] = workdir
    kwargs = dict(cwd=workdir, env=env,
                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if IS_POSIX:
        kwargs["start_new_session"] = True
        if with_rlimits:
            kwargs["preexec_fn"] = _run_limits_preexec(timeout_s, mem_mb)

    usage_before = resource.getrusage(resource.RUSAGE_CHILDREN) if IS_POSIX else None
    proc = subprocess.Popen(argv, **kwargs)
    timed_out = False
    try:
        out_raw, err_raw = proc.communicate(stdin_bytes, timeout=timeout_s)
    except subprocess.TimeoutExpired:
        timed_out = True
        if IS_POSIX:
            try:
                os.killpg(proc.pid, signal.SIGKILL)  # whole group: catches forked children
            except ProcessLookupError:
                pass
        else:
            proc.kill()
        out_raw, err_raw = proc.communicate()

    exit_code = proc.returncode if proc.returncode is not None else KILL_EXIT_CODE
    if exit_code < 0:  # POSIX signal -> shell convention 128 + signo
        exit_code = 128 + (-exit_code)
    if timed_out:
        exit_code = KILL_EXIT_CODE

    cpu_ms, peak_mb = None, None
    if usage_before is not None:
        usage_after = resource.getrusage(resource.RUSAGE_CHILDREN)
        # RUSAGE_CHILDREN ru_utime/ru_stime are cumulative sums -> delta is this child.
        cpu_ms = round(((usage_after.ru_utime - usage_before.ru_utime)
                        + (usage_after.ru_stime - usage_before.ru_stime)) * 1000)
        # ru_maxrss is a lifetime MAX (KB on Linux), attributable only if it moved.
        if usage_after.ru_maxrss > usage_before.ru_maxrss:
            peak_mb = usage_after.ru_maxrss // 1024

    stdout, out_trunc = _decode(out_raw)
    stderr, err_trunc = _decode(err_raw)
    if out_trunc:
        stdout += f"\n[stdout truncated at {MAX_OUTPUT_BYTES} bytes]"
    if err_trunc:
        stderr += f"\n[stderr truncated at {MAX_OUTPUT_BYTES} bytes]"
    if timed_out:
        stderr += f"\nTimeoutError: execution exceeded {timeout_s}s limit"

    return {"exit_code": exit_code, "stdout": stdout, "stderr": stderr,
            "cpu_time_ms": cpu_ms, "peak_memory_mb": peak_mb, "timed_out": timed_out}


def execute(code: str, language: str, timeout_seconds: int,
            memory_limit_mb: int, stdin: str | None) -> dict:
    """Execute student code under limits. Returns the prototype's response shape."""
    workdir = tempfile.mkdtemp(prefix="edova_lab_")
    try:
        src, run_argv, compile_argv = _language_plan(language, workdir)
        with open(src, "w", encoding="utf-8") as f:
            f.write(code)
        stdin_bytes = (stdin or "").encode("utf-8")[:MAX_STDIN_BYTES]

        if compile_argv is not None:
            comp = _spawn(compile_argv, workdir, b"", COMPILE_TIMEOUT_S, memory_limit_mb,
                          with_rlimits=False)
            if comp["exit_code"] != 0:
                return {"execution": {**comp, "stdout": comp["stdout"],
                                      "stderr": comp["stderr"] or "compilation failed"},
                        "sandbox": _sandbox_block(language), "content_hash": _hash(code)}

        result = _spawn(run_argv, workdir, stdin_bytes, timeout_seconds,
                        memory_limit_mb, with_rlimits=True)
        return {"execution": result, "sandbox": _sandbox_block(language),
                "content_hash": _hash(code)}
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def _sandbox_block(language: str) -> dict:
    return {"type": "subprocess",
            "isolation": "rlimits+env-scrub+killpg" if IS_POSIX else "wall-timeout-only",
            "language": language}


def _hash(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()
