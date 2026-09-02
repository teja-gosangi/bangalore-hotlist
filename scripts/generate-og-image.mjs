import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const htmlPath = path.join(root, 'scripts', 'og-image.html')
const outputPath = path.join(root, 'public', 'social-card.png')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })

await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.screenshot({ path: outputPath, type: 'png' })

await browser.close()
console.log(`Wrote ${outputPath}`)
