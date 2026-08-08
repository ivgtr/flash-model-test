import { expect, test } from '@playwright/test'

test('home page lists registered tools', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tool Forge' })).toBeVisible()
  await expect(page.getByRole('link', { name: /JSON Formatter/ })).toBeVisible()
})

test('formats JSON end to end', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /JSON Formatter/ }).click()
  await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible()

  await page.getByLabel('JSON input').fill('{"name":"tool-forge","count":2}')
  await page.getByRole('button', { name: 'Format' }).click()

  await expect(page.getByTestId('json-output')).toHaveText(
    '{\n  "name": "tool-forge",\n  "count": 2\n}',
  )
  await expect(page.getByRole('button', { name: 'Copy' })).toBeEnabled()

  await page.getByRole('button', { name: 'Copy' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
})

test('shows an error for invalid JSON', async ({ page }) => {
  await page.goto('/tools/json-formatter')
  await page.getByLabel('JSON input').fill('{"broken":')
  await page.getByRole('button', { name: 'Format' }).click()
  await expect(page.getByRole('alert')).toContainText('Invalid JSON')
})

test('shows not found for an unknown tool', async ({ page }) => {
  await page.goto('/tools/does-not-exist')
  await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible()
})
