// ============================================================
// STATISTICS PAGE
// ============================================================
let srcScorers = [], srcYellow = [], srcRed = [];

document.addEventListener('DOMContentLoaded', () => {
    Utils.setupNav();
    Utils.observeElements('.player-card');

    initTabs();
    initSort();
    loadStats();
});

// ---- Tabs ----
function initTabs() {
    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
        });
    });
}

// ---- BONUS: Sorting ----
function initSort() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applySort(btn.dataset.sort);
        });
    });
}

function applySort(key) {
    let s = [...srcScorers], y = [...srcYellow], r = [...srcRed];
    if (key === 'goals')  s.sort((a,b) => b.goals - a.goals);
    if (key === 'yellow') y.sort((a,b) => b.cards - a.cards);
    if (key === 'red')    r.sort((a,b) => b.cards - a.cards);
    drawScorers(s);
    drawYellow(y);
    drawRed(r);
}

// ---- Fetch ----
async function loadStats() {
    ['grid-scorers','grid-yellow','grid-red'].forEach(id => Utils.skeleton(id, 6, 'stat'));

    try {
        const url = `${CONFIG.sportsBase}?met=Topscorers&APIkey=${CONFIG.keys.sports}&leagueId=${CONFIG.leagueId}`;
        const data = await Utils.fetchJSON(url);
        if (!data.result || !data.result.length) throw new Error('No data');

        const players = data.result;

        // Scorers
        srcScorers = players.map(p => ({
            name: p.player_name || 'Unknown',
            photo: p.player_image || '',
            team: p.team_name || '',
            teamLogo: p.team_logo || '',
            goals: parseInt(p.goals) || 0,
            yellow: parseInt(p.yellow_cards) || 0,
            red: parseInt(p.red_cards) || 0
        }));
        drawScorers(srcScorers);

        // Yellow
        srcYellow = players.map(p => ({
            name: p.player_name || 'Unknown',
            photo: p.player_image || '',
            team: p.team_name || '',
            teamLogo: p.team_logo || '',
            cards: parseInt(p.yellow_cards) || 0
        })).sort((a,b) => b.cards - a.cards);
        drawYellow(srcYellow);

        // Red
        srcRed = players.map(p => ({
            name: p.player_name || 'Unknown',
            photo: p.player_image || '',
            team: p.team_name || '',
            teamLogo: p.team_logo || '',
            cards: parseInt(p.red_cards) || 0
        })).sort((a,b) => b.cards - a.cards);
        drawRed(srcRed);

        Utils.hideLoader();

    } catch (err) {
        console.error('Stats error:', err);
        ['grid-scorers','grid-yellow','grid-red'].forEach(id =>
            Utils.showError(id, 'Unable to load statistics', 'loadStats()'));
        Utils.hideLoader();
    }
}

// ---- Renderers ----
function playerCard(p, index, statHtml) {
    const photo = p.photo
        ? `<img src="${p.photo}" alt=""
             onerror="this.outerHTML='<i class=\\'fa-solid fa-user placeholder-user\\'></i>'">`
        : '<i class="fa-solid fa-user placeholder-user"></i>';

    return `
        <div class="player-card">
            <span class="pc-rank">${index + 1}</span>
            <div class="pc-photo">${photo}</div>
            <div class="pc-info">
                <h3>${p.name}</h3>
                <div class="pc-team">
                    ${Utils.teamLogo(p.teamLogo)}
                    <span>${p.team}</span>
                </div>
            </div>
            <div class="pc-stats">${statHtml}</div>
        </div>`;
}

function drawScorers(list) {
    document.getElementById('grid-scorers').innerHTML =
        list.slice(0, 20).map((p, i) => playerCard(p, i, `
            <div class="stat-block">
                <i class="fa-solid fa-futbol"></i>
                <strong>${p.goals}</strong>
                <small>Goals</small>
            </div>
            <div class="stat-chips">
                <span class="chip chip-y" title="Yellow cards">${p.yellow}</span>
                <span class="chip chip-r" title="Red cards">${p.red}</span>
            </div>
        `)).join('');
}

function drawYellow(list) {
    document.getElementById('grid-yellow').innerHTML =
        list.slice(0, 20).map((p, i) => playerCard(p, i, `
            <div class="stat-block yellow-block">
                <div class="card-rect yellow-rect"></div>
                <strong>${p.cards}</strong>
                <small>Yellow</small>
            </div>
        `)).join('');
}

function drawRed(list) {
    document.getElementById('grid-red').innerHTML =
        list.slice(0, 20).map((p, i) => playerCard(p, i, `
            <div class="stat-block red-block">
                <div class="card-rect red-rect"></div>
                <strong>${p.cards}</strong>
                <small>Red</small>
            </div>
        `)).join('');
}