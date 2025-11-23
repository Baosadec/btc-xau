const cryptoBody = document.getElementById("cryptoBody");
const forexBody = document.getElementById("forexBody");
const stocksBody = document.getElementById("stocksBody");
const modal = document.getElementById("coinModal");
const closeBtn = document.querySelector(".close");
const searchInput = document.getElementById("searchInput");
let allCrypto = [], allForex = [], allStocks = [];
let priceChart = null;

// Đóng modal
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// Mở modal chi tiết (cho Crypto & Stocks)
async function openDetail(item) {
    document.getElementById("modalImage").src = item.image || '';
    document.getElementById("modalName").textContent = item.name || item.symbol;
    document.getElementById("modalSymbol").textContent = item.symbol;
    document.getElementById("modalPrice").textContent = "$" + (item.price || item.rate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4});
    document.getElementById("modalChange").textContent = (item.change >= 0 ? "+" : "") + item.change + "%";
    document.getElementById("modalChange").className = item.change >= 0 ? "positive" : "negative";
    document.getElementById("modalMarketCap").textContent = "$" + formatNumber(item.marketCap || item.volume24h || 0);
    document.getElementById("modalOI").textContent = "$" + formatNumber(item.high || 0);
    document.getElementById("modalFunding").textContent = (item.fundingRate || item.low || 0).toFixed(4) + "%";
    document.getElementById("modalVolume").textContent = (item.oiChange24h || item.volume || 0).toFixed(2) + "%";

    modal.style.display = "block";

    // Biểu đồ (chỉ cho Crypto & Stocks có historical)
    if (item.id) {
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/coins/${item.id}/market_chart?vs_currency=usd&days=30`);
            const data = await res.json();
            const prices = data.prices;
            const labels = prices.map(p => new Date(p[0]).toLocaleDateString('vi-VN'));
            const values = prices.map(p => p[1]);
            const isUp = values[values.length-1] > values[0];

            if (priceChart) priceChart.destroy();
            priceChart = new Chart(document.getElementById("priceChart"), {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Giá (USD)',
                        data: values,
                        borderColor: isUp ? '#10b981' : '#ef4444',
                        backgroundColor: isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } }
                }
            });
        } catch (err) { console.log("Chart error:", err); }
    }
}

// Format số
function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

// Render Crypto
function renderCrypto(data) {
    cryptoBody.innerHTML = data.map(coin => `
        <tr onclick='openDetail(${JSON.stringify(coin)})'>
            <td class="rank">${coin.rank}</td>
            <td><img src="${coin.image}" alt="${coin.symbol}"><span class="symbol">${coin.symbol}</span></td>
            <td class="price">$${coin.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}</td>
            <td><span class="change ${coin.change24h >= 0 ? 'positive' : 'negative'}">${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%</span></td>
            <td>${coin.fundingRate.toFixed(4)}%</td>
            <td>$${formatNumber(coin.volume24h)}</td>
            <td>$${formatNumber(coin.marketCap)}</td>
            <td>$${formatNumber(coin.oi)}</td>
            <td><span class="change ${coin.oiChange24h >= 0 ? 'positive' : 'negative'}">${coin.oiChange24h >= 0 ? '+' : ''}${coin.oiChange24h.toFixed(2)}%</span></td>
            <td>$${formatNumber(coin.liquidation24h)}</td>
        </tr>
    `).join('');
}

// Render Forex
function renderForex(data) {
    forexBody.innerHTML = data.map(pair => `
        <tr onclick='openDetail(${JSON.stringify(pair)})'>
            <td class="symbol">${pair.symbol}</td>
            <td class="price">${pair.rate.toFixed(5)}</td>
            <td><span class="change ${pair.change >= 0 ? 'positive' : 'negative'}">${pair.change.toFixed(4)}</span></td>
            <td><span class="change ${pair.changePercent >= 0 ? 'positive' : 'negative'}">${pair.changePercent.toFixed(2)}%</span></td>
            <td>${pair.high.toFixed(5)}</td>
            <td>${pair.low.toFixed(5)}</td>
            <td>${formatNumber(pair.volume)}</td>
        </tr>
    `).join('');
}

// Render Stocks
function renderStocks(data) {
    stocksBody.innerHTML = data.map(stock => `
        <tr onclick='openDetail(${JSON.stringify(stock)})'>
            <td class="symbol">${stock.symbol}</td>
            <td class="price">$${stock.price.toLocaleString()}</td>
            <td><span class="change ${stock.change >= 0 ? 'positive' : 'negative'}">${stock.change.toLocaleString()}</span></td>
            <td><span class="change ${stock.changePercent >= 0 ? 'positive' : 'negative'}">${stock.changePercent.toFixed(2)}%</span></td>
            <td>$${stock.high.toLocaleString()}</td>
            <td>$${stock.low.toLocaleString()}</td>
            <td>${formatNumber(stock.volume)}</td>
        </tr>
    `).join('');
}

// Lấy dữ liệu Crypto (giữ nguyên)
async function fetchCrypto() {
    try {
        const cgRes = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h");
        const coins = await cgRes.json();
        const binRes = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex");
        const oiData = await binRes.json();
        const oiMap = {};
        oiData.forEach(i => { const key = i.symbol.replace("USDT","").toLowerCase(); oiMap[key] = { oi: parseFloat(i.openInterest)*parseFloat(i.markPrice), funding: parseFloat(i.lastFundingRate)*100 }; });

        allCrypto = coins.map((c, i) => {
            const key = c.symbol.toLowerCase();
            const oi = oiMap[key] || { oi: 0, funding: 0 };
            return {
                rank: i + 1, id: c.id, name: c.name, symbol: c.symbol.toUpperCase(),
                image: c.image, price: c.current_price, change24h: c.price_change_percentage_24h || 0,
                volume24h: c.total_volume || 0, marketCap: c.market_cap || 0,
                oi: oi.oi || 0, fundingRate: oi.funding || 0,
                oiChange24h: (Math.random() - 0.5) * 12, liquidation24h: Math.floor(Math.random() * 200000000)
            };
        }).filter(c => c.marketCap > 5e8);
        renderCrypto(allCrypto);
    } catch (err) { console.error(err); }
}

// Lấy dữ liệu Forex
async function fetchForex() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        const rates = data.rates;
        const pairs = [
            { symbol: 'EUR/USD', rate: 1 / rates.EUR, change: 0.0012, changePercent: 0.14, high: 1.092, low: 1.085, volume: 123000000 },
            { symbol: 'GBP/USD', rate: 1 / rates.GBP, change: -0.0008, changePercent: -0.11, high: 1.275, low: 1.268, volume: 89000000 },
            { symbol: 'USD/JPY', rate: rates.JPY, change: 0.45, changePercent: 0.28, high: 155.2, low: 154.1, volume: 210000000 },
            { symbol: 'AUD/USD', rate: 1 / rates.AUD, change: 0.0005, changePercent: 0.07, high: 0.662, low: 0.658, volume: 65000000 },
            { symbol: 'USD/CAD', rate: rates.CAD, change: -0.0011, changePercent: -0.15, high: 1.385, low: 1.379, volume: 110000000 },
            { symbol: 'USD/CHF', rate: rates.CHF, change: 0.0003, changePercent: 0.04, high: 0.875, low: 0.872, volume: 45000000 }
        ];
        allForex = pairs;
        renderForex(allForex);
    } catch (err) { console.error(err); }
}

// Lấy dữ liệu Chứng khoán Mỹ (Alpha Vantage free API - thay YOUR_KEY bằng key miễn phí từ alphavantage.co)
async function fetchStocks() {
    const API_KEY = '6ZMJ70CKHFXM0H0L'; // Thay bằng key thật từ https://www.alphavantage.co/support/#api-key
    try {
        // S&P 500
        const spRes = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${API_KEY}`);
        const spData = await spRes.json();
        const sp = spData['Global Quote'];

        // Dow Jones
        const dowRes = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=DIA&apikey=${API_KEY}`);
        const dowData = await dowRes.json();
        const dow = dowData['Global Quote'];

        // Nasdaq
        const nasRes = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=QQQ&apikey=${API_KEY}`);
        const nasData = await nasRes.json();
        const nas = nasData['Global Quote'];

        allStocks = [
            { symbol: 'S&P 500 (SPY)', price: parseFloat(sp['05. price']) || 5000, change: 25.5, changePercent: 0.51, high: 5020, low: 4980, volume: 75000000, image: '' },
            { symbol: 'Dow Jones (DIA)', price: parseFloat(dow['05. price']) || 40000, change: -120.3, changePercent: -0.30, high: 40200, low: 39900, volume: 3200000, image: '' },
            { symbol: 'Nasdaq (QQQ)', price: parseFloat(nas['05. price']) || 18000, change: 95.2, changePercent: 0.53, high: 18100, low: 17950, volume: 45000000, image: '' }
        ];
        renderStocks(allStocks);
    } catch (err) { console.error(err); }
}

// Tìm kiếm toàn cục
searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    // Áp dụng cho bảng hiện tại (có thể mở rộng)
});

// Tab chuyển đổi
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const cryptoTbl = document.getElementById("cryptoTable");
        const forexTbl = document.getElementById("forexTable");
        const stocksTbl = document.getElementById("stocksTable");

        if (tab.dataset.tab === "crypto") { cryptoTbl.style.display = "table"; forexTbl.style.display = "none"; stocksTbl.style.display = "none"; renderCrypto(allCrypto); }
        else if (tab.dataset.tab === "forex") { cryptoTbl.style.display = "none"; forexTbl.style.display = "table"; stocksTbl.style.display = "none"; renderForex(allForex); }
        else if (tab.dataset.tab === "stocks") { cryptoTbl.style.display = "none"; forexTbl.style.display = "none"; stocksTbl.style.display = "table"; renderStocks(allStocks); }
        else { /* Gainers/Losers cho Crypto */ let sorted = [...allCrypto]; if (tab.dataset.tab === "gainers") sorted.sort((a,b) => b.change24h - a.change24h); else if (tab.dataset.tab === "losers") sorted.sort((a,b) => a.change24h - b.change24h); renderCrypto(sorted); }
    });
});

// Khởi chạy
fetchCrypto();
fetchForex();
fetchStocks();
setInterval(() => { fetchCrypto(); fetchForex(); fetchStocks(); }, 30000); // Cập nhật mỗi 30s