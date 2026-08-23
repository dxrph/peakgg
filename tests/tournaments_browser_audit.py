import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "tests" / "artifacts" / "tournaments"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
VIEWPORTS = [(1920, 1080), (1440, 1000), (1024, 768), (430, 932), (390, 844)]
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

report = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=EDGE)
    for width, height in VIEWPORTS:
        context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="no-preference")
        page = context.new_page()
        console_errors = []
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.goto("http://127.0.0.1:3000/tournaments", wait_until="networkidle")
        page.screenshot(path=str(ARTIFACTS / f"tournaments-{width}.png"), full_page=True)
        dimensions = page.evaluate("() => ({client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth})")
        image_errors = page.locator("img").evaluate_all("imgs => imgs.filter(img => !img.complete || !img.naturalWidth).map(img => img.src)")
        h1_count = page.locator("h1").count()

        page.get_by_role("button", name="OPEN", exact=True).click()
        open_cards = page.locator(".t-card").count()
        open_statuses = page.locator(".t-card .t-status").all_inner_texts()
        page.locator("select").first.select_option(label="NORTH AMERICA") if width >= 600 else None
        if width >= 600:
            empty_visible = page.get_by_text("NO TOURNAMENTS", exact=False).is_visible()
            page.get_by_role("button", name="RESET FILTERS").click()
        else:
            filter_button = page.get_by_role("button", name="FILTERS", exact=False)
            filter_button.click()
            sheet_visible = page.get_by_role("dialog", name="FILTER EVENTS").is_visible()
            page.keyboard.press("Escape")
            empty_visible = False
            assert sheet_visible and filter_button.is_focused()

        page.emulate_media(reduced_motion="reduce")
        reduced_transition = page.locator(".t-card").first.evaluate("el => getComputedStyle(el).transitionDuration")
        report.append({
            "viewport": [width, height], "horizontal_overflow": dimensions["scroll"] > dimensions["client"],
            "h1_count": h1_count, "image_errors": image_errors, "console_errors": console_errors,
            "open_cards": open_cards, "open_statuses": open_statuses, "empty_state": empty_visible,
            "reduced_transition": reduced_transition,
        })
        context.close()
    browser.close()

(ARTIFACTS / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
