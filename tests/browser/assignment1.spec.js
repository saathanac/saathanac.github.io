import { test, expect } from '@playwright/test';

const points = ['(0, 0)', '(-4, 0)', '(-8, 0)', '(2, 0)', '(6, 0)'];

test('all five worked points, math, plots, tables, and navigation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#/assignments/1');
  await expect(page.getByRole('heading', { name: 'Part 1 · Distance from a curve' })).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('Worked point', { exact: true }).selectOption(String(i));
    for (const section of ['problem', 'analytical', 'newton', 'golden']) {
      const active = page.locator(`#${section} .point-work:not(.inactive-point)`);
      await expect(active).toHaveCount(1);
      await expect(active.getByRole('heading').first()).toContainText(points[i]);
    }
    const newton = page.locator('#newton .point-work:not(.inactive-point)');
    await newton.locator('summary').click();
    await expect(newton.locator('details')).toHaveAttribute('open', '');
    await expect(newton.locator('tbody tr').first()).toBeVisible();
    const golden = page.locator('#golden .point-work:not(.inactive-point)');
    await golden.locator('summary').click();
    await expect(golden.locator('tbody tr').last()).toBeVisible();
    expect(await golden.locator('tbody tr').count()).toBeGreaterThan(10);
    const images = page.locator('.point-work:not(.inactive-point) img');
    for (const image of await images.all()) {
      await expect(image).toBeVisible();
      expect(await image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    }
  }
  expect(await page.locator('.katex').count()).toBeGreaterThan(100);
  await expect(page.locator('.katex-error')).toHaveCount(0);
  await expect(page.locator('math').first()).toBeAttached();
  await page.getByRole('button', { name: 'Analytical', exact: true }).click();
  await expect(page.locator('#analytical')).toBeFocused();
  await page.getByRole('link', { name: 'Assignment 2', exact: true }).click();
  await expect(page.getByText('Not posted yet.')).toBeVisible();
  await page.getByRole('link', { name: 'Assignment 1', exact: true }).click();
  await expect(page.getByLabel('Worked point', { exact: true })).toHaveValue('0');
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/desktop.png' });
});

test('Python and result downloads are real files', async ({ page }) => {
  await page.goto('/#/assignments/1');
  for (const [name, filename] of [['Download Python source', 'solution.py'], ['Download results & histories (JSON)', 'results.json']]) {
    const response = await page.request.get(`/assignment1/${filename}`);
    expect(response.ok()).toBe(true);
    if (filename.endsWith('.py')) expect(await response.text()).toContain('def golden_section(');
    else expect((await response.json()).cases).toHaveLength(5);
    const pending = page.waitForEvent('download');
    await page.getByRole('link', { name, exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(filename);
    expect(await download.failure()).toBeNull();
  }
});

test('mobile layout confines wide equations and tables', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/assignments/1');
  await page.getByLabel('Worked point', { exact: true }).selectOption('2');
  await page.locator('#golden .point-work:not(.inactive-point) summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const region = page.locator('#golden .point-work:not(.inactive-point) .table-scroll');
  expect(await region.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/mobile.png' });
});

test('print includes every point and collapsed histories, then restores screen state', async ({ page }) => {
  await page.goto('/#/assignments/1');
  await expect(page.getByRole('heading', { name: 'Part 1 · Distance from a curve' })).toBeVisible();
  await expect(page.locator('details')).toHaveCount(16);
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('details:not([open])')).toHaveCount(0);
  for (const section of ['problem', 'analytical', 'newton', 'golden']) {
    for (const item of await page.locator(`#${section} .point-work`).all()) await expect(item).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Print full solution' })).toBeHidden();
  const overflow = await page.locator('.equation, .table-scroll').evaluateAll(elements => elements
    .filter(el => el.scrollWidth > el.clientWidth + 2).map(el => ({ tag: el.className, width: el.clientWidth, scroll: el.scrollWidth })));
  expect(overflow).toEqual([]);
  await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
  await page.pdf({ path: 'test-results/assignment1-print.pdf', preferCSSPageSize: true, printBackground: true });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });
  await expect(page.locator('details[open]')).toHaveCount(0);
  await expect(page.locator('#analytical .point-work:visible')).toHaveCount(1);
});
