import { expect, test } from '@playwright/test'

test('share JSON formatter state via URL and restore it in another tab', async ({
  page,
  context,
}) => {
  await page.goto('/tools/json-formatter')
  await page.getByLabel('JSON input').fill('{"name":"tool-forge","count":2}')
  await page.getByLabel('Indent').selectOption('4')
  await page.getByRole('button', { name: 'Format' }).click()
  await expect(page.getByTestId('json-output')).toHaveText(
    '{\n    "name": "tool-forge",\n    "count": 2\n}',
  )

  await page.getByRole('button', { name: 'Share' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  const url = await page.evaluate(() => navigator.clipboard.readText())
  expect(url).toContain('/tools/json-formatter?s=1.')

  const tab = await context.newPage()
  await tab.goto(url)
  await expect(tab.getByLabel('JSON input')).toHaveValue('{"name":"tool-forge","count":2}')
  await expect(tab.getByLabel('Indent')).toHaveValue('4')
  await expect(tab.getByTestId('json-output')).toHaveText(
    '{\n    "name": "tool-forge",\n    "count": 2\n}',
  )
})

test('malformed state URL renders the tool with defaults instead of crashing', async ({ page }) => {
  await page.goto('/tools/json-formatter?s=1.garbage!!!')
  await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible()
  await expect(page.getByLabel('JSON input')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Share' })).toBeDisabled()
})

test('a URL without state behaves exactly as before', async ({ page }) => {
  await page.goto('/tools/json-formatter')
  await expect(page.getByLabel('JSON input')).toHaveValue('')
  await expect(page.getByLabel('Indent')).toHaveValue('2')
  await expect(page.getByRole('button', { name: 'Share' })).toBeDisabled()
})

test('regex tester state restores from a shared URL', async ({ page, context }) => {
  await page.goto('/tools/regex-tester')
  await page.getByLabel('Pattern').fill('\\d+')
  await page.getByLabel('Test string').fill('abc 123 x 456')
  await page.getByRole('checkbox', { name: 'g' }).check()
  await page.getByRole('button', { name: 'Test' }).click()
  await expect(page.getByTestId('match-count')).toHaveText('2 matches')

  await page.getByRole('button', { name: 'Share' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  const url = await page.evaluate(() => navigator.clipboard.readText())
  expect(url).toContain('/tools/regex-tester?s=1.')

  const tab = await context.newPage()
  await tab.goto(url)
  await expect(tab.getByLabel('Pattern')).toHaveValue('\\d+')
  await expect(tab.getByLabel('Test string')).toHaveValue('abc 123 x 456')
  await expect(tab.getByRole('checkbox', { name: 'g' })).toBeChecked()
  await expect(tab.getByTestId('match-count')).toHaveText('2 matches')
})
