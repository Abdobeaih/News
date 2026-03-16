
let ratesCache = {};

document.addEventListener('DOMContentLoaded', () => {
    Utils.setupNav();
    Utils.observeElements('.news-card, .match-row');

    Utils.skeleton('news-politics', 3, 'card');
    Utils.skeleton('news-economy', 3, 'card');
    Utils.skeleton('news-entertainment', 3, 'card');
    Utils.skeleton('news-sports', 3, 'card');
    Utils.skeleton('live-list', 3, 'match');

    Promise.allSettled([
        loadWeather(),
        loadNews('nation', 'news-politics', 'politics'),
        loadNews('business', 'news-economy', 'economy'),
        loadNews('entertainment', 'news-entertainment', 'entertainment'),
        loadNews('sports', 'news-sports', 'sports'),
        loadRates(),
        loadLiveMatches()
    ]).then(() => Utils.hideLoader());

    // Auto-refresh
    setInterval(loadLiveMatches, 60000);
    setInterval(loadRates, 300000);
});


async function loadWeather() {
    try {
        let lat = 30.0444, lon = 31.2357; // Default Cairo

        // BONUS: Try user geolocation
        try {
            const pos = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
            );
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
        } catch (e) {
            console.log('Geolocation unavailable → using Cairo');
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.keys.weather}`;
        const data = await Utils.fetchJSON(url);

        document.getElementById('w-temp').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('w-desc').textContent = data.weather[0].description;
        document.getElementById('w-city').textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById('w-humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('w-wind').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        document.getElementById('w-feels').textContent = `${Math.round(data.main.feels_like)}°`;
        document.getElementById('w-icon').innerHTML =
            `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" alt="">`;

    } catch (err) {
        console.error('Weather error:', err);
        document.getElementById('w-icon').innerHTML =
            '<i class="fa-solid fa-triangle-exclamation" style="font-size:40px;color:#e94560"></i>';
        document.getElementById('w-temp').textContent = '--°C';
        document.getElementById('w-desc').textContent = 'Unavailable';
        document.getElementById('w-city').textContent = 'Check API key';
    }
}

// ============================================================
// 2. NEWS  (GNews.io)
//    4 categories × 3 articles each
// ============================================================
async function loadNews(topic, containerId, badge) {
    try {
        const url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=en&max=3&apikey=${CONFIG.keys.news}`;
        const data = await Utils.fetchJSON(url);

        if (!data.articles || !data.articles.length) throw new Error('Empty');

        const container = document.getElementById(containerId);
        container.innerHTML = data.articles.map(a => {
            const img = a.image || 'https://via.placeholder.com/400x220/16213e/888?text=No+Image';
            const date = Utils.formatDate(a.publishedAt);
            return `
                <article class="news-card">
                    <div class="card-img">
                        <img src="${img}" alt=""
                             onerror="this.src='https://via.placeholder.com/400x220/16213e/888?text=No+Image'">
                        <span class="badge badge-${badge}">${badge}</span>
                    </div>
                    <div class="card-body">
                        <span class="card-source">
                            <i class="fa-regular fa-newspaper"></i> ${a.source.name}
                        </span>
                        <h3 class="card-title">${a.title}</h3>
                        <time class="card-date">
                            <i class="fa-regular fa-clock"></i> ${date}
                        </time>
                        <p class="card-desc">${a.description || ''}</p>
                        <a href="${a.url}" target="_blank" class="card-link">
                            Read More <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </article>`;
        }).join('');

        // Ticker from first category
        if (topic === 'nation') {
            const ticker = document.getElementById('ticker-text');
            ticker.textContent = data.articles.map(a => `📰 ${a.title}`).join('   |   ');
        }

    } catch (err) {
        console.error(`News [${topic}]:`, err);
        Utils.showError(containerId,
            `Unable to load ${badge} news`,
            `loadNews('${topic}','${containerId}','${badge}')`);
    }
}

// ============================================================
// 3. EXCHANGE RATES  (exchangerate-api.com)
//    Display USD & SAR  +  BONUS: converter
// ============================================================
async function loadRates() {
    try {
        const url = `https://v6.exchangerate-api.com/v6/${CONFIG.keys.currency}/latest/USD`;
        const data = await Utils.fetchJSON(url);
        if (data.result !== 'success') throw new Error(data['error-type']);

        ratesCache = data.conversion_rates;

        const egp = ratesCache.EGP;
        const sarToEgp = egp / ratesCache.SAR;

        document.getElementById('rates-list').innerHTML = `
            <div class="rate-row">
                <div class="rate-left">
                    <span class="rate-flag">🇺🇸</span>
                    <div>
                        <strong>US Dollar (USD)</strong>
                        <small>USD → EGP</small>
                    </div>
                </div>
                <span class="rate-val">${egp.toFixed(2)} <small>EGP</small></span>
            </div>
            <div class="rate-row">
                <div class="rate-left">
                    <span class="rate-flag">🇸🇦</span>
                    <div>
                        <strong>Saudi Riyal (SAR)</strong>
                        <small>SAR → EGP</small>
                    </div>
                </div>
                <span class="rate-val">${sarToEgp.toFixed(2)} <small>EGP</small></span>
            </div>`;

        initConverter();

    } catch (err) {
        console.error('Rates error:', err);
        Utils.showError('rates-list', 'Unable to load rates', 'loadRates()');
    }
}

function initConverter() {
    const amt = document.getElementById('conv-amount');
    const from = document.getElementById('conv-from');
    const to = document.getElementById('conv-to');
    const swap = document.getElementById('conv-swap');

    const run = () => convert();
    amt.addEventListener('input', run);
    from.addEventListener('change', run);
    to.addEventListener('change', run);
    swap.addEventListener('click', () => {
        [from.value, to.value] = [to.value, from.value];
        run();
    });
    run();
}

function convert() {
    const amount = parseFloat(document.getElementById('conv-amount').value);
    const from = document.getElementById('conv-from').value;
    const to = document.getElementById('conv-to').value;
    const out = document.getElementById('conv-result');

    if (isNaN(amount) || amount <= 0 || !ratesCache[from] || !ratesCache[to]) {
        out.innerHTML = '<span class="muted">Enter a valid amount</span>';
        return;
    }

    const result = (amount / ratesCache[from]) * ratesCache[to];
    out.innerHTML = `
        <span class="conv-from">${amount.toLocaleString()} ${from}</span>
        <span class="conv-eq">=</span>
        <span class="conv-to">${result.toLocaleString(undefined,
        { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${to}</span>`;
}

// ============================================================
// 4. LIVE MATCHES  (AllSportsAPI)
// ============================================================
async function loadLiveMatches() {
    const box = document.getElementById('live-list');

    try {
        // Try live scores
        let data = await Utils.fetchJSON(
            `${CONFIG.sportsBase}?met=Livescore&APIkey=${CONFIG.keys.sports}`
        );
        let matches = data.result;

        // Fallback: today's fixtures
        if (!matches || !matches.length || data.success === 0) {
            const today = new Date().toISOString().split('T')[0];
            data = await Utils.fetchJSON(
                `${CONFIG.sportsBase}?met=Fixtures&APIkey=${CONFIG.keys.sports}&from=${today}&to=${today}`
            );
            matches = data.result;
        }

        if (!matches || !matches.length) {
            box.innerHTML = '<div class="empty"><i class="fa-solid fa-calendar-xmark"></i><p>No matches today</p></div>';
            return;
        }

        box.innerHTML = matches.slice(0, 6).map(m => {
            const st = matchStatus(m);
            return `
                <div class="match-row">
                    <span class="mr-status ${st.cls}">${st.label}</span>
                    <div class="mr-teams">
                        <div class="mr-team">
                            ${Utils.teamLogo(m.home_team_logo)}
                            <span>${m.event_home_team}</span>
                        </div>
                        <span class="mr-score">
                            ${m.event_home_team_score || '-'} - ${m.event_away_team_score || '-'}
                        </span>
                        <div class="mr-team">
                            ${Utils.teamLogo(m.away_team_logo)}
                            <span>${m.event_away_team}</span>
                        </div>
                    </div>
                    <span class="mr-league">
                        <i class="fa-solid fa-trophy"></i> ${m.league_name || ''}
                    </span>
                </div>`;
        }).join('');

    } catch (err) {
        console.error('Live matches error:', err);
        Utils.showError('live-list', 'Unable to load matches', 'loadLiveMatches()');
    }
}

function matchStatus(m) {
    const s = m.event_status || '';
    if (['Finished', 'After Pens', 'After ET'].includes(s))
        return { label: 'FT', cls: 'st-ft' };
    if (s === 'Half Time')
        return { label: 'HT', cls: 'st-ht' };
    if (!s || s === 'Not Started' || s === '')
        return { label: m.event_time || 'Soon', cls: 'st-soon' };
    return { label: `LIVE ${s}'`, cls: 'st-live' };
}