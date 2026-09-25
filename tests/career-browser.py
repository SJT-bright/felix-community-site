import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    try:
        for width in [1440, 390]:
            context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce', permissions=['clipboard-read', 'clipboard-write'])
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(os.environ.get('BASE_URL', 'http://127.0.0.1:52128') + '/?intro=skip')
            page.wait_for_load_state('networkidle')
            assert page.get_by_role('heading', name='司钧霆 Felix。').is_visible()
            assert page.locator('#site-loader, #wormhole-video').count() == 0
            text = page.locator('body').inner_text()
            assert all(word not in text for word in ['社群','入群','群主','代订阅','交流群'])
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
            if width == 1440:
                page.screenshot(path='/tmp/felix-career-home.png')
            page.locator('.career-nav a[href="#project-showcase"]').click()
            page.locator('#project-showcase').wait_for(state='visible')
            assert page.locator('a.project-card__link').count() == 8
            assert page.get_by_role('heading', name='我的视觉审美选集').count() == 1
            assert page.get_by_role('heading', name='实用工具与生活效率').count() == 1
            assert all('审美参考' in text for text in page.locator('.project-card__number').all_text_contents())
            assert '不作为个人开发成果' in page.locator('.project-showcase__intro').inner_text()
            page.locator('#career-contact').scroll_into_view_if_needed()
            page.get_by_role('button', name='复制微信号').click()
            assert page.evaluate('navigator.clipboard.readText()') == 'SJTbright-future'
            page.locator('.portfolio-entry').scroll_into_view_if_needed()
            page.locator('.portfolio-entry').click()
            page.wait_for_url('**/portfolio/index.html')
            page.wait_for_function('window.__app?.tiles.length===34 && __app.tiles.every(t=>t.item.imageStatus==="loaded")')
            before = page.evaluate('__app.view.yaw')
            page.mouse.move(width*.3,400)
            page.mouse.down()
            page.mouse.move(width*.65,400,steps=10)
            page.mouse.up()
            assert abs(page.evaluate('__app.view.yaw')-before) > .05
            for number in range(29, 35):
                page.evaluate('number => __app.open(__app.tiles.findIndex(t => t.item.id === `a-${String(number).padStart(3,"0")}`))', number)
                page.wait_for_function('getComputedStyle(document.querySelector("#viewer")).visibility==="visible"')
                page.wait_for_function('number => [...document.querySelectorAll("#viewer-box img")].some(img => img.src.endsWith(`visual-${String(number).padStart(3,"0")}.png`) && img.complete && img.naturalWidth > 0)', arg=number)
                assert f'A-{number:03}' in page.locator('#cap-no').inner_text()
                page.keyboard.press('Escape')
                page.wait_for_function('getComputedStyle(document.querySelector("#viewer")).visibility==="hidden"')
            page.evaluate('__app.open(0)')
            first_caption = page.locator('#cap-no').inner_text()
            page.keyboard.press('ArrowRight')
            page.wait_for_function('previous => document.querySelector("#cap-no").textContent !== previous', arg=first_caption)
            page.wait_for_function('[...document.querySelectorAll("#viewer-box img")].every(img => img.complete && img.naturalWidth > 0)')
            page.keyboard.press('Escape')
            page.wait_for_function('getComputedStyle(document.querySelector("#viewer")).visibility==="hidden"')
            page.screenshot(path=f'/tmp/felix-career-archive-{width}.png')
            page.locator('.portfolio-exit').click()
            page.wait_for_url('**/#portfolio-gallery')
            assert page.locator('#wormhole-video').count() == 0
            assert not errors, errors
            print(f'PASS {width}px: profile, clean copy, projects, contact, 34 images, drag, new-image viewer, return')
            context.close()
    finally:
        browser.close()
