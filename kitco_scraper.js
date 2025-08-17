const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
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
      row['Metals'] = metalName;
      if (spans[1]?.textContent.trim() === 'Rhodium') {
        base = 2;
      }
      row['Date'] = spans[base]?.textContent.trim() || '';
      row['Time'] = spans[base+1]?.textContent.trim() || '';
      // Usuwanie przecinków z Bid, Ask, Low, High
      row['Bid'] = (spans[base+2]?.textContent.trim() || '').replace(/,/g, '');
      row['Ask'] = (spans[base+3]?.textContent.trim() || '').replace(/,/g, '');
      const changeDivs = container.querySelectorAll('div.BidAskGrid_changeRow__407Qp > div.BidAskGrid_change__ALV4Z > div');
      let change = changeDivs[0]?.textContent.trim() || '';
      let changePercent = changeDivs[1]?.textContent.trim() || '';
      // '-' zamień na '0', usuń % z ChangePercent
      if (change === '-') change = '0';
      if (changePercent === '-') changePercent = '0';
      changePercent = changePercent.replace('%', '');
      row['Change'] = change;
      row['ChangePercent'] = changePercent;
      row['Low'] = (spans[base+4]?.textContent.trim() || '').replace(/,/g, '');
      row['High'] = (spans[base+5]?.textContent.trim() || '').replace(/,/g, '');
      data.push(row);
    });
    return data;
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
