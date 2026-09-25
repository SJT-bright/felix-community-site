from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    for width in [1440, 390]:
        page = browser.new_page(viewport={'width': width, 'height': 900})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto('http://127.0.0.1:52128/?intro=play')
        page.wait_for_load_state('networkidle')
        assert not page.locator('.career-intro video').evaluate('(v)=>v.muted')
        assert page.locator('.career-intro button').count() == 0
        page.locator('.career-intro').click()
        page.wait_for_function('document.querySelector(".career-intro video").currentTime > .5')
        page.locator('.career-intro').wait_for(state='detached', timeout=60000)
        assert page.locator('main#top > section').first.get_attribute('id') == 'image-archive'
        assert page.locator('.career-nav, .profile-landing, #experience, #career-contact').count() == 0
        page.locator('.community-masthead a[href="#portfolio-gallery"]').click()
        page.wait_for_function('location.hash === "#portfolio-gallery"')
        page.wait_for_function('Math.abs(document.querySelector("#portfolio-gallery").getBoundingClientRect().top - 115) < 3')
        page.wait_for_timeout(1000)
        assert page.locator('#portfolio-gallery .portfolio-entry').count() == 1
        assert abs(page.locator('.community-masthead').bounding_box()['y']) < 1
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        page.screenshot(path=f'/tmp/community-gateway-{width}.png')
        page.locator('.community-masthead a[href="/lab"]').click()
        page.wait_for_url('**/lab')
        assert page.locator('.lab-topic').count() == 6
        page.locator('.lab-topic summary').first.click()
        assert page.locator('.lab-topic').first.get_attribute('open') is not None
        page.locator('.lab-page__home').click()
        page.wait_for_url('**/?intro=skip')
        assert page.locator('.career-intro').count() == 0
        assert not errors, errors
        print(f'PASS {width}: audible video, no buttons, image wall second, fixed nav, correct archive anchor, community round trip')
        page.close()
    browser.close()
