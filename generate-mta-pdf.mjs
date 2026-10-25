import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'mta-service-agreement.html');
const outputPath = path.join(__dirname, 'MTA_Service_Agreement_One_Life_Foundation.pdf');
const downloadsPath = path.join('C:', 'Users', 'kevin', 'Downloads', 'MTA_Service_Agreement_One_Life_Foundation.pdf');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

// Hide the print button
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
fs.copyFileSync(outputPath, downloadsPath);
console.log('PDF created:', outputPath);
console.log('Copied to Downloads:', downloadsPath);
