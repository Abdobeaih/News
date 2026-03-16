
document.addEventListener('DOMContentLoaded', () => {
    Utils.setupNav();
    loadStandings();
});

async function loadStandings() {
    const tbody = document.getElementById('tbl-body');
    Utils.skeleton('tbl-body', 20, 'row');

    try {
        const url = `${CONFIG.sportsBase}?met=Standings&APIkey=${CONFIG.keys.sports}&leagueId=${CONFIG.leagueId}`;
        const data = await Utils.fetchJSON(url);

        if (!data.result || !data.result.total || !data.result.total.length)
            throw new Error('No standings');

        const teams = data.result.total;
        const total = teams.length;

        tbody.innerHTML = teams.map((t, i) => {
            const rank = i + 1;
            let cls = '';
            if (rank <= 4)            cls = 'pos-champ';
            else if (rank <= 6)       cls = 'pos-europa';
            else if (rank > total - 3) cls = 'pos-releg';

            const gd = (parseInt(t.standing_GF) || 0) - (parseInt(t.standing_GA) || 0);
            const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
            const gdCls = gd > 0 ? 'gd-pos' : gd < 0 ? 'gd-neg' : '';

            return `
                <tr class="${cls}">
                    <td><span class="rank">${rank}</span></td>
                    <td>
                        ${t.team_logo
                            ? `<img src="${t.team_logo}" class="tbl-logo"
                                 onerror="this.outerHTML='<i class=\\'fa-solid fa-shield-halved\\' style=\\'color:#666\\'></i>'">`
                            : '<i class="fa-solid fa-shield-halved" style="color:#666"></i>'}
                    </td>
                    <td class="col-team-name">${t.standing_team || '?'}</td>
                    <td>${t.standing_P  || 0}</td>
                    <td class="td-w">${t.standing_W  || 0}</td>
                    <td>${t.standing_D  || 0}</td>
                    <td class="td-l">${t.standing_L  || 0}</td>
                    <td>${t.standing_GF || 0}</td>
                    <td>${t.standing_GA || 0}</td>
                    <td class="${gdCls}">${gdStr}</td>
                    <td class="td-pts"><strong>${t.standing_PTS || 0}</strong></td>
                </tr>`;
        }).join('');

        Utils.hideLoader();

    } catch (err) {
        console.error('Standings error:', err);
        tbody.innerHTML = `<tr><td colspan="11">
            <div class="error-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Unable to load standings</p>
                <button class="btn-retry" onclick="loadStandings()">
                    <i class="fa-solid fa-rotate-right"></i> Retry</button>
            </div></td></tr>`;
        Utils.hideLoader();
    }
}