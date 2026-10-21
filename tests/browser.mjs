import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Usa la copia de Playwright incluida en Codex cuando no hay instalación local.
const modulePath = process.env.NOVA_PLAYWRIGHT_MODULE || 'C:/Users/Usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(modulePath).href);
const chrome = process.env.NOVA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
process.env.NOVA_DATA_DIR = join(tmpdir(), `nova-browser-test-${process.pid}`);
const { server } = await import('../server/index.mjs');
const screenshotDir = resolve('qa');
mkdirSync(screenshotDir, { recursive: true });

await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const findings = [];
const test = async (name, callback) => {
  await callback();
  findings.push(`PASS ${name}`);
  console.log(`PASS ${name}`);
};
const pageFor = async (width = 1440) => {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  return { context, page };
};
const visit = async (page, route) => {
  await page.goto(base + route);
  await page.locator('main').waitFor();
};
const prepareScreenshot = async page => page.evaluate(async () => {
  await Promise.all([...document.images].map(image => {
    image.loading = 'eager';
    if (image.complete) return Promise.resolve();
    return new Promise(resolveImage => {
      image.addEventListener('load', resolveImage, { once: true });
      image.addEventListener('error', resolveImage, { once: true });
    });
  }));
});
const future = () => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

try {
  browser = await chromium.launch({ executablePath: chrome, headless: true });
  await test('Agencia: navegación, menú móvil, portafolio y WhatsApp', async () => {
    const { context, page } = await pageFor(390);
    await visit(page, '/');
    assert.match(await page.locator('h1').innerText(), /Diseñamos lo que viene/i);
    assert.equal(await page.locator('[data-depth-wordmark]').innerText(), 'VYRO');
    assert.equal(await page.locator('.portfolio-card').count(), 4);
    assert.match(await page.locator('.contact-direct').getAttribute('href'), /^https:\/\/wa\.me\/\d+\?text=/);
    await page.locator('.agency-header .menu-toggle').click();
    assert.equal(await page.locator('.agency-header .menu-toggle').getAttribute('aria-expanded'), 'true');
    await page.locator('.agency-nav a[href="/#portafolio"]').click();
    assert.equal(await page.locator('.agency-header .menu-toggle').getAttribute('aria-expanded'), 'false');
    await context.close();
  });
  await test('Hero VYRO: profundidad, lente, seguimiento y movimiento reducido', async () => {
    const motionContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const motionPage = await motionContext.newPage();
    await visit(motionPage, '/');
    const hero = motionPage.locator('#hero-glass');
    const wordmark = motionPage.locator('[data-depth-wordmark]');
    const wordmarkBounds = await wordmark.boundingBox();
    await motionPage.mouse.move(wordmarkBounds.x + wordmarkBounds.width * .8, wordmarkBounds.y + wordmarkBounds.height * .5);
    await motionPage.waitForFunction(() => !!document.querySelector('[data-depth-wordmark]')?.style.getPropertyValue('--depth-tilt-y'));
    assert.match(await wordmark.getAttribute('style'), /--depth-tilt-y/);
    assert.equal(await hero.count(), 1);
    assert.notEqual(await motionPage.locator('.hero-glass-lens').evaluate(el => getComputedStyle(el).display), 'none');
    assert.notEqual(await motionPage.locator('.hero-art img').evaluate(el => getComputedStyle(el).animationName), 'none');
    const bounds = await hero.boundingBox();
    await motionPage.mouse.move(bounds.x + bounds.width * .82, bounds.y + bounds.height * .4);
    await motionPage.waitForFunction(() => document.querySelector('#hero-glass')?.style.getPropertyValue('--lens-x').endsWith('px'));
    assert.equal(await hero.getAttribute('class'), 'hero-visual is-engaged');
    await motionPage.mouse.move(bounds.x - 50, bounds.y + bounds.height * .4);
    await motionPage.waitForFunction(() => !document.querySelector('#hero-glass')?.style.getPropertyValue('--lens-x'));
    await motionContext.close();

    const reduced = await pageFor(1440);
    await visit(reduced.page, '/');
    assert.equal(await reduced.page.locator('.hero-glass-lens').evaluate(el => getComputedStyle(el).display), 'none');
    assert.equal(await reduced.page.locator('.depth-wordmark span').evaluate(el => getComputedStyle(el).animationName), 'none');
    await reduced.context.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'no-preference' });
    const mobilePage = await mobileContext.newPage();
    await visit(mobilePage, '/');
    assert.notEqual(await mobilePage.locator('.hero-glass-lens').evaluate(el => getComputedStyle(el).display), 'none');
    assert.ok(await mobilePage.locator('.hero-glass-lens').evaluate(el => el.getBoundingClientRect().width) < 120);
    await mobileContext.close();
  });
  await test('Cotización: casillas separadas, validación, persistencia y retirada', async () => {
    const { context, page } = await pageFor(390);
    await visit(page, '/');
    assert.equal(await page.locator('[name="privacy"]').isChecked(), false);
    assert.equal(await page.locator('[name="terms"]').isChecked(), false);
    await page.locator('#quote-form button[type="submit"]').click();
    assert.match(await page.locator('#quote-message').innerText(), /Completá/);
    await page.locator('#quote-form [name="name"]').fill('Prueba Automatizada');
    await page.locator('#quote-form [name="contactType"]').selectOption('correo');
    await page.locator('#quote-form [name="contact"]').fill('qa@example.test');
    await page.locator('#quote-form [name="projectType"]').selectOption({ label: 'Web empresarial' });
    await page.locator('#quote-form [name="description"]').fill('Prueba automatizada del formulario local sin datos reales.');
    await page.locator('#quote-form [name="privacy"]').check();
    await page.locator('#quote-form button[type="submit"]').click();
    await page.locator('#quote-message code').first().waitFor();
    const requestId = await page.locator('#quote-message code').first().innerText();
    const withdrawalToken = await page.locator('#quote-message code').nth(1).innerText();
    assert.equal(requestId.length, 32);
    await visit(page, '/retirar-consentimiento');
    await page.locator('[name="requestId"]').fill(requestId);
    await page.locator('[name="withdrawalToken"]').fill(withdrawalToken);
    const withdrawalResponse = page.waitForResponse(response => response.url().endsWith('/api/consent/withdraw'));
    await page.locator('#withdraw-form button').click();
    const withdrawalStatus = (await withdrawalResponse).status();
    assert.equal(withdrawalStatus, 200);
    await page.waitForFunction(() => document.querySelector('#withdraw-form .form-message')?.textContent.includes('Retirada registrada'));
    assert.match(await page.locator('#withdraw-form .form-message').innerText(), /Retirada registrada/);
    await context.close();
  });
  await test('Restaurante: filtro y reserva simulada', async () => {
    const { context, page } = await pageFor();
    await visit(page, '/demos/restaurante');
    await page.locator('[data-food-filter="postres"]').click();
    assert.equal(await page.locator('.food-card').count(), 3);
    await page.locator('[data-demo-booking="restaurante"] [name="date"]').fill(future());
    await page.locator('[data-demo-booking="restaurante"] [name="time"]').selectOption('19:00');
    await page.locator('[data-demo-booking="restaurante"] [name="people"]').selectOption('2');
    await page.locator('[data-demo-booking="restaurante"] button').click();
    assert.match(await page.locator('[data-demo-booking="restaurante"] .form-message').innerText(), /No se creó ninguna reserva/);
    await context.close();
  });
  await test('Barbería: selección de servicio y cita simulada', async () => {
    const { context, page } = await pageFor();
    await visit(page, '/demos/barberia');
    await page.locator('[data-service-select]').first().click();
    const form = page.locator('[data-demo-booking="barberia"]');
    assert.notEqual(await form.locator('[name="service"]').inputValue(), '');
    await form.locator('[name="professional"]').selectOption({ index: 1 });
    await form.locator('[name="date"]').fill(future());
    await form.locator('[name="time"]').selectOption('10:30');
    await form.locator('button').click();
    assert.match(await form.locator('.form-message').innerText(), /No se creó ninguna reserva/);
    await context.close();
  });
  await test('Clínica: servicios, FAQ y solicitud simulada', async () => {
    const { context, page } = await pageFor();
    await visit(page, '/demos/clinica-dental');
    assert.equal(await page.locator('.dental-service-grid article').count(), 6);
    await page.locator('.dental-faq summary').first().click();
    assert.equal(await page.locator('.dental-faq details').first().getAttribute('open'), '');
    const form = page.locator('[data-demo-booking="clinica"]');
    await form.locator('[name="service"]').selectOption({ index: 1 });
    await form.locator('[name="date"]').fill(future());
    await form.locator('[name="time"]').selectOption('10:00');
    await form.locator('button').click();
    assert.match(await form.locator('.form-message').innerText(), /No se creó ninguna reserva/);
    await context.close();
  });
  await test('Tienda: filtros, ordenamiento, talla, cantidad, carrito y checkout', async () => {
    const { context, page } = await pageFor();
    await visit(page, '/demos/tienda-ropa');
    assert.equal(await page.locator('.product-card').count(), 12);
    await page.locator('#category-filter').selectOption('Abrigos');
    assert.equal(await page.locator('.product-card').count(), 2);
    await page.locator('#filters-reset').click();
    await page.locator('#sort-filter').selectOption('low');
    assert.match(await page.locator('.product-card').first().innerText(), /Camisa de algodón/);
    await page.locator('.product-card a').first().click();
    await page.locator('#add-cart-form [name="size"]').nth(1).check();
    await page.locator('#add-cart-form [name="quantity"]').fill('2');
    await page.locator('#add-cart-form button').click();
    assert.equal(await page.locator('#cart-drawer').getAttribute('aria-hidden'), 'false');
    await page.locator('[data-cart-qty]').fill('3');
    await page.locator('[data-cart-qty]').dispatchEvent('change');
    assert.match(await page.locator('#cart-total').innerText(), /97[\s,.]?500/);
    await page.locator('.cart-summary a').click();
    assert.match(await page.locator('#checkout-summary').innerText(), /97[\s,.]?500/);
    await page.locator('#checkout-finish').click();
    assert.match(await page.locator('#checkout-message').innerText(), /No se procesó un pago/);
    await context.close();
  });
  await test('Ficha NORTHLINE: galería, ampliación, detalles y diseño móvil', async () => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      const { context, page } = await pageFor(width);
      await visit(page, '/demos/tienda-ropa/producto/1');
      assert.equal(await page.locator('.detail-thumb').count(), 3);
      assert.equal(await page.locator('.related-grid .product-card').count(), 4);
      await page.locator('.detail-thumb').nth(1).click();
      assert.match(await page.locator('#product-main-image').getAttribute('src'), /fashion-01-back\.jpg$/);
      assert.equal(await page.locator('.detail-thumb').nth(1).getAttribute('aria-pressed'), 'true');
      await page.locator('#product-zoom-open').click();
      assert.equal(await page.locator('#product-zoom').evaluate(dialog => dialog.open), true);
      assert.match(await page.locator('#product-zoom-image').getAttribute('src'), /fashion-01-back\.jpg$/);
      await page.locator('#product-zoom-close').click();
      assert.equal(await page.locator('#product-zoom').evaluate(dialog => dialog.open), false);
      await page.locator('#product-zoom-open').click();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#product-zoom').evaluate(dialog => dialog.open), false);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'product-zoom-open');
      await page.locator('.detail-accordions summary').first().click();
      assert.equal(await page.locator('.detail-accordions details').first().getAttribute('open'), '');
      await page.locator('.detail-thumb').first().click();
      if (width === 390 || width === 1440) {
        await prepareScreenshot(page);
        await page.screenshot({ path: join(screenshotDir, `producto-despues-${width}.png`), fullPage: true, animations: 'disabled' });
      }
      const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(layout.scroll <= layout.viewport + 1, `producto ${width}px: ${layout.scroll} > ${layout.viewport}`);
      await context.close();
    }
  });
  await test('Rutas internas: fichas, checkout y legales sin desbordamiento móvil', async () => {
    const routes = [
      ...Array.from({ length: 12 }, (_, index) => `/demos/tienda-ropa/producto/${index + 1}`),
      '/demos/tienda-ropa/checkout',
      '/terminos-y-condiciones',
      '/politica-de-privacidad',
      '/politica-de-cookies',
      '/politica-de-reembolsos'
    ];
    for (const route of routes) {
      const { context, page } = await pageFor(390);
      await visit(page, route);
      assert.equal(await page.locator('h1').count(), 1, route);
      const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(layout.scroll <= layout.viewport + 1, `${route}: ${layout.scroll} > ${layout.viewport}`);
      await context.close();
    }
  });
  await test('Rutas legales y metadatos de noindex', async () => {
    const { context, page } = await pageFor();
    for (const route of ['/terminos-y-condiciones','/politica-de-privacidad','/politica-de-cookies','/politica-de-reembolsos']) {
      await visit(page, route);
      assert.match(await page.locator('.legal-meta').innerText(), /Versión/);
      assert.ok(await page.locator('.legal-layout article section').count() > 0);
    }
    await visit(page, '/demos/restaurante');
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,nofollow');
    await context.close();
  });
  await test('Accesibilidad básica y sesión limpia sin almacenamiento opcional', async () => {
    for (const route of ['/','/demos/restaurante','/demos/barberia','/demos/clinica-dental','/demos/tienda-ropa']) {
      const { context, page } = await pageFor(390);
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      await visit(page, route);
      const audit = await page.evaluate(() => ({
        headings: document.querySelectorAll('h1').length,
        missingAlt: [...document.images].filter(image => !image.hasAttribute('alt')).length,
        unnamedButtons: [...document.querySelectorAll('button')].filter(button => !button.textContent.trim() && !button.getAttribute('aria-label')).length,
        unlabeledControls: [...document.querySelectorAll('input,select,textarea')].filter(control => !control.labels?.length && !control.getAttribute('aria-label') && control.type !== 'hidden').length,
        storage: Object.keys(localStorage)
      }));
      assert.equal(audit.headings, 1, route);
      assert.equal(audit.missingAlt, 0, route);
      assert.equal(audit.unnamedButtons, 0, route);
      assert.equal(audit.unlabeledControls, 0, route);
      assert.deepEqual(audit.storage, [], route);
      assert.deepEqual(await context.cookies(), [], route);
      assert.deepEqual(pageErrors, [], route);
      await context.close();
    }
  });
  await test('Capturas y ausencia de desbordamiento horizontal en 5 rutas × 5 tamaños', async () => {
    for (const [slug, route] of [['agencia','/'],['restaurante','/demos/restaurante'],['barberia','/demos/barberia'],['clinica','/demos/clinica-dental'],['tienda','/demos/tienda-ropa']]) {
      for (const width of [320,390,768,1024,1440]) {
        const { context, page } = await pageFor(width);
        await visit(page, route);
        if (width === 390 || width === 1440) {
          await prepareScreenshot(page);
          await page.screenshot({ path: join(screenshotDir, `${slug}-${width}.png`), fullPage: true, animations: 'disabled' });
        }
        const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
        if (layout.scroll > layout.viewport + 1) {
          const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')].map(el => ({ tag: el.tagName, className: String(el.className).slice(0, 70), parent: String(el.parentElement?.className).slice(0, 70), text: el.textContent?.slice(0, 55), right: Math.round(el.getBoundingClientRect().right), width: Math.round(el.getBoundingClientRect().width) })).filter(x => x.right > innerWidth + 1).sort((a,b) => b.right - a.right).slice(0,8));
          console.error('Desbordamiento:', slug, width, offenders);
        }
        assert.ok(layout.scroll <= layout.viewport + 1, `${slug} ${width}px: ${layout.scroll} > ${layout.viewport}`);
        await context.close();
      }
    }
  });
} finally {
  if (browser) await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
console.log(`Resultado: ${findings.length} grupos completados.`);
