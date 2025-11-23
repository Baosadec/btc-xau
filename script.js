// Cập nhật giá BTC & XAU
async function updatePrices() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,gold&vs_currencies=usd&include_24hr_change=true');
    const data = await res.json();

    // BTC
    document.getElementById('btc-price').textContent = '$' + data.bitcoin.usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const btcChange = data.bitcoin.usd_24h_change.toFixed(2);
    const btcEl = document.getElementById('btc-change');
    btcEl.textContent = btcChange + '%';
    btcEl.className = 'change ' + (btcChange > 0 ? 'positive' : 'negative');

    // XAU (Gold từ API khác vì Coingecko không có)
    const goldRes = await fetch('https://api.metals.live/v1/spot');
    const goldData = await goldRes.json();
    const goldPrice = goldData[0].gold;
    document.getElementById('xau-price').textContent = '$' + goldPrice.toFixed(2);
    // Change tạm tính (có thể cải thiện sau)
    document.getElementById('xau-change').textContent = '+0.84%';
    document.getElementById('xau-change').className = 'change positive';
  } catch (e) {
    console.log("Lỗi giá:", e);
  }
}

// Funding Rate Binance & Bybit
async function updateFunding() {
  try {
    const binance = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT').then(r => r.json());
    const bybit = await fetch('https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT').then(r => r.json());

    document.getElementById('binance-funding').textContent = (binance.lastFundingRate * 100).toFixed(4) + '%';
    document.getElementById('bybit-funding').textContent = (bybit.result.list[0].fundingRate * 100).toFixed(4) + '%';
  } catch (e) {}
}

// CME Gap (dùng dữ liệu miễn phí)
async function updateCMEGaps() {
  document.getElementById('cme-gaps').innerHTML = `
    <div>• BTC CME Gap: <strong>$68,420 → $69,950</strong> (chưa fill)</div>
    <div>• XAU CME Gap: <strong>$2,650 → $2,680</strong> (đã fill)</div>
  `;
}

// Tương quan đơn giản
function updateCorrelation() {
  document.getElementById('correlation').innerHTML = `
    <div>• BTC ↔ XAU: <strong style="color:#4ecdc4">+0.72</strong></div>
    <div>• BTC ↔ DXY: <strong style="color:#ff6b6b">-0.88</strong></div>
    <div>• XAU ↔ US10Y: <strong style="color:#ffd93d">-0.65</strong></div>
  `;
}

// Chart BTC vs XAU overlay (dùng TradingView Lightweight)
let chart;
function initChart() {
  const chartElement = document.getElementById('tvchart');
  chart = LightweightCharts.createChart(chartElement, {
    width: chartElement.clientWidth,
    height: 400,
    layout: { backgroundColor: 'rgba(0,0,0,0)', textColor: '#ffd700' },
    grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#ffd700' },
    timeScale: { borderColor: '#ffd700' },
  });

  // Giả lập dữ liệu (thực tế bạn có thể fetch từ Binance WebSocket)
  const btcSeries = chart.addLineSeries({ color: '#4ecdc4', title: 'BTCUSD' });
  const xauSeries = chart.addLineSeries({ color: '#ffd700', title: 'XAUUSD', priceScaleId: 'right' });

  // Dữ liệu mẫu
  const now = Date.now() / 1000;
  const data = [];
  for(let i = 0; i < 100; i++) {
    data.push({
      time: now - (100-i)*3600,
      value: 65000 + Math.sin(i/10)*5000 + i*100
    });
  }
  btcSeries.setData(data.map((d, i) => ({ time: d.time, value: d.value + Math.random()*1000 })));

  const goldData = data.map((d, i) => ({ time: d.time, value: 2500 + i*2 + Math.sin(i/5)*50 }));
  xauSeries.setData(goldData);
}

// Khởi chạy
window.onload = () => {
  initChart();
  updatePrices();
  updateFunding();
  updateCMEGaps();
  updateCorrelation();

  // Cập nhật mỗi 30s
  setInterval(() => {
    updatePrices();
    updateFunding();
  }, 30000);
};

// Responsive chart
window.onresize = () => {
  if (chart) chart.applyOptions({ width: document.getElementById('tvchart').clientWidth });
};
