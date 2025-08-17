if (!process.env.DOTENV_CONFIG_SILENT) process.env.DOTENV_CONFIG_SILENT = 'true';
require('dotenv').config();
const puppeteer = require('puppeteer');
const DB = require('./db');

function getLocalDatetime() {
  const now = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mi = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://www.kitco.com/price/precious-metals', { waitUntil: 'networkidle2' });

  const result = await page.evaluate(() => {
    const data = [];
    const seen = new Set();
    const ul = Array.from(document.querySelectorAll('ul')).find(ul =>
      [...ul.classList].some(cls => cls.startsWith('BidAskGrid_listify_'))
    );
    if (!ul) return data;
    const lis = Array.from(ul.querySelectorAll('li'));
    lis.forEach(li => {
      const row = {};
      const container = li.querySelector('div.BidAskGrid_gridifier__l1T1o');
      if (!container) return;
      const spans = container.querySelectorAll('span');
      let metalName = '';
      let base = 1;
      const metalSpan = spans[0];
      if (metalSpan) {
        const a = metalSpan.querySelector('a');
        if (a) {
          metalName = a.textContent.trim();
        } else {
          metalName = metalSpan.textContent.trim();
        }
      }
      if (seen.has(metalName)) return;
      seen.add(metalName);
      // Jeśli spans[1] == 'Rhodium', pomiń ją i przesuwaj indeksy
      if (spans[1]?.textContent.trim() === 'Rhodium') {
        base = 2;
      }
      let name = metalName;
      let slug = name.toLowerCase().replace(/\s+/g, '-');
      let bid = (spans[base+2]?.textContent.trim() || '').replace(/,/g, '');
      let ask = (spans[base+3]?.textContent.trim() || '').replace(/,/g, '');
      const changeDivs = container.querySelectorAll('div.BidAskGrid_changeRow__407Qp > div.BidAskGrid_change__ALV4Z > div');
      let change = changeDivs[0]?.textContent.trim() || '';
      let change_percent = changeDivs[1]?.textContent.trim() || '';
      if (change === '-') change = '0';
      if (change_percent === '-') change_percent = '0';
      change_percent = change_percent.replace('%', '');
      let low = (spans[base+4]?.textContent.trim() || '').replace(/,/g, '');
      let high = (spans[base+5]?.textContent.trim() || '').replace(/,/g, '');
      let price = bid;
      // Budowanie obiektu z kluczami lowercase
      const obj = {
        name,
        slug,
        bid,
        ask,
        change,
        change_percent,
        low,
        high,
        price
      };
      data.push(obj);
    });
    return data;
  });

  const updated = getLocalDatetime();
  // Dodaj pole updated do każdego rekordu
  result.forEach(obj => { obj.updated = updated; });

  console.log(JSON.stringify(result, null, 2));

  // Zapisz do bazy danych
  const db = new DB();
  try {
    await db.insertMetals(result);
    //console.log('Dane zostały zapisane do bazy.');
  } catch (e) {
    //console.error('Błąd zapisu do bazy:', e);
  } finally {
    await db.close();
    await browser.close();
  }
})();
