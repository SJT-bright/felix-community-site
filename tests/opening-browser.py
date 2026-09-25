import os
from playwright.sync_api import sync_playwright

base = os.environ.get('BASE_URL', 'http://127.0.0.1:52128')
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(base)
    page.wait_for_function('document.querySelector(".career-intro video")?.currentTime > .5')
    page.wait_for_function('document.querySelector("felix-opening")?.dataset.scene === "ready"')
    # Let the real media finish naturally, including the fade into the new page.
    page.locator('.career-intro').wait_for(state='detached', timeout=60000)
    assert page.evaluate('scrollY') < 10
    page.screenshot(path='/tmp/felix-new-opening-desktop.png')
    page.locator('felix-opening .explore').click()
    page.wait_for_function('Number(document.querySelector("felix-opening").dataset.progress) > .7')
    page.locator('felix-opening .explore').click()
    page.wait_for_function('Math.abs(document.querySelector("#top").getBoundingClientRect().top) < 5')
    page.screenshot(path='/tmp/felix-new-opening-handoff.png')
    page.reload()
    assert page.locator('.career-intro').count() == 0
    page.goto(base + '/portfolio/index.html')
    page.wait_for_function('window.__app?.tiles.length === 34')
    page.locator('.portfolio-exit').click()
    page.wait_for_url('**/#portfolio-gallery')
    assert page.locator('.career-intro').count() == 0
    assert not errors, errors
    mobile = browser.new_page(viewport={'width': 390, 'height': 844})
    mobile.goto(base + '/?intro=skip')
    mobile.wait_for_function('document.querySelector("felix-opening")?.dataset.scene === "ready"')
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    mobile.screenshot(path='/tmp/felix-new-opening-mobile.png')
    failure = browser.new_page()
    failure.route('**/intro/*.mp4', lambda route: route.abort())
    failure.goto(base + '/?intro=play')
    failure.get_by_role('button', name='跳过开场 →').click()
    failure.locator('.career-intro').wait_for(state='detached')
    print('PASS: natural video end, new first page, scroll handoff, reload/return skip, 34 images, mobile width, failed-media escape')
    browser.close()
