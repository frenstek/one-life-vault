import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'letter-of-engagement-dsw.html');
const outputPath = path.join(__dirname, 'Letter_of_Engagement_DSW_One_Life_Foundation.pdf');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

await page.evaluate(() => {
  document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
});

await page.pdf({
  path: outputPath,
  format: 'A4',
  margin: { top: '20mm', right: '18mm', bottom: '20mm', left: '18mm' },
  printBackground: true,
});

await browser.close();
console.log('PDF created:', outputPath);
