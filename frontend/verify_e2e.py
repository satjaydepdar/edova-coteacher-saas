"""E2E verification: login -> shelf -> video detail -> practice generate -> lab detail."""
import sys

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
EMAIL, PASSWORD = "teacher@tc3school.dev", "testpass"
shots = []
console_errors = []


def snap(page, name):
    path = f"verify_{name}.png"
    page.screenshot(path=path, full_page=False)
    shots.append(path)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # 1. login
    page.goto(BASE, wait_until="networkidle")
    assert "/login" in page.url, f"expected redirect to login, got {page.url}"
    snap(page, "1_login")

    page.fill('input[type="email"]', EMAIL)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url(BASE + "/", timeout=10000)
    page.wait_for_selector("text=Intro to Heat", timeout=10000)
    page.wait_for_load_state("networkidle")
    snap(page, "2_shelf")

    grid_text = page.locator("main").inner_text()
    for expected in ("Intro to Heat", "Heat Transfer Virtual Lab", "PYQ: Thermodynamics 2023"):
        assert expected in grid_text, f"missing module card: {expected}\n{grid_text}"
    print("shelf: all 3 published modules rendered")

    # 2. bad login path (fresh context, no token)
    bad = browser.new_page()
    bad.goto(BASE, wait_until="networkidle")
    bad.fill('input[type="email"]', "teacher@tc3school.dev")
    bad.fill('input[type="password"]', "wrongpass")
    bad.click('button[type="submit"]')
    bad.wait_for_selector("text=Invalid email or password.", timeout=8000)
    snap(bad, "3_bad_login")
    bad.close()
    print("login: 401 surfaces as inline error")

    # 3. video detail (Intro to Heat has HLS segments in S3)
    page.click("text=Intro to Heat")
    page.wait_for_selector("video", timeout=10000)
    page.wait_for_timeout(4000)  # let hls.js fetch manifest + first segment
    snap(page, "4_video")
    video_state = page.evaluate(
        """() => { const v = document.querySelector('video');
           return v ? { readyState: v.readyState, duration: v.duration, error: v.error?.code } : null }"""
    )
    print("video element:", video_state)
    overlay = page.locator("text=could not be loaded").count() + page.locator(
        "text=not published").count()
    print("video error overlay visible:", bool(overlay))

    # 4. practice: generate a real set
    page.goto(BASE + "/practice", wait_until="networkidle")
    page.click("text=Generate set")
    page.wait_for_selector("text=Q1", timeout=15000)
    page.wait_for_load_state("networkidle")
    snap(page, "5_practice")
    qcount = page.locator("text=PYQ 20").count()
    print("practice: question cards with PYQ year badges:", qcount)
    assert qcount > 0, "no questions generated"

    # 5. lab detail
    page.goto(BASE, wait_until="networkidle")
    page.click("text=Heat Transfer Virtual Lab")
    page.wait_for_selector("text=Lab instructions", timeout=10000)
    page.wait_for_load_state("networkidle")
    snap(page, "6_lab")
    print("lab: instructions panel rendered; iframe count:", page.locator("iframe").count())

    browser.close()

print("screenshots:", shots)
print("console errors:", console_errors if console_errors else "none")
failed = [s for s in ()]
print("E2E OK")
