import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
for _p in (_backend_root, _backend_root / "services"):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))
