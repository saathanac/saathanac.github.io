import { test, expect } from '@playwright/test';

for (const [selected, label] of [[0, 'Line'], [1, 'Parabola']]) {
  test(`Part 2 ${label}: equations, histories, plots, and responsive print layout`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/#/assignments/1');
    const section = page.locator('#part2');
    await section.getByLabel('Model', { exact: true }).selectOption(String(selected));
    await expect(section.getByRole('heading', { name: `${label} model and objective` })).toBeVisible();
    await expect(section.locator('.result-line').first()).toContainText('Converged in 1 Newton step');
    await expect(section.getByRole('heading', { name: 'Multivariate Newton–Raphson' })).toBeVisible();
    await expect(section.getByRole('heading', { name: 'Newton–Raphson — Single-parameter updates' })).toBeVisible();
    await expect(section.locator('.coordinate-newton .worked-step')).toHaveCount(3);
    await expect(section.locator('.coordinate-newton .result-line')).toContainText(selected === 0 ? '40 sweeps' : '422 sweeps');
    await expect(section.getByRole('region', { name: `${label} residuals` }).locator('tbody tr')).toHaveCount(4);
    await expect(section.getByRole('region', { name: 'Final fitted models' }).locator('tbody tr')).toHaveCount(2);
    for (const image of await section.locator('img').all()) {
      await image.evaluate(img => img.decode());
      await expect(image).toHaveAttribute('src', new RegExp(`part2-${label.toLowerCase()}`));
    }
    await expect(section.locator('.katex-error')).toHaveCount(0);
    await section.screenshot({ path: `test-results/part2-${selected}.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 680, height: 960 });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
    await expect(section.locator('details:not([open])')).toHaveCount(0);
    const overflow = await section.locator('.equation, .table-scroll').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth+2).map(el => el.textContent.slice(0, 60)));
    expect(overflow).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('Part 2 downloads are available and selection preserves Part 1', async ({ page }) => {
  await page.goto('/#/assignments/1');
  const section = page.locator('#part2');
  await page.getByLabel('Worked point', { exact: true }).selectOption('1');
  await section.getByLabel('Model', { exact: true }).selectOption('1');
  await expect(page.getByLabel('Worked point', { exact: true })).toHaveValue('1');
  for (const file of ['fitting.py', 'fitting-results.json']) {
    const response = await page.request.get(`/assignment1/${file}`);
    expect(response.ok()).toBe(true);
    if (file.endsWith('.json')) expect((await response.json()).models).toHaveLength(2);
    else expect(await response.text()).toContain('def simultaneous_newton(');

  }
});
