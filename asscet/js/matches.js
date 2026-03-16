// ============================================================
// MATCHES PAGE — All league matches with filters
// ============================================================

let allMatches = [];

document.addEventListener('DOMContentLoaded', () => {
    Utils.setupMobileMenu();
    Utils.setupBackToTop();
    Utils.setupAnimations();

    fetchAllMatches();
    setupFilters();
});

async function fetchAllMatches() {
    const container = document.getElementById('matches-container');
    container.innerHTML = Array(6).fill(`
        <div class="match-card-full skeleton-card">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
    `).join('');

    try {
        // Get full season fixtures
        const seasonFrom = '2024-08-01';
        const seasonTo = '2025-06-30';

        const data = await Utils.fetchData(
            `${CONFIG.sportsBaseUrl}?met=Fixtures&APIkey=${CONFIG.keys.sports}&from=${seasonFrom}&to=${seasonTo}&leagueId=${CONFIG.defaultLeagueId}`
        );

        if (!data.result || data.result.length === 0) {
            throw new Error('No matches found');
        }

        allMatches = data.result;

        // Sort by date (newest first for finished, then live, then upcoming)
        allMatches.sort((a, b) => {
            const dateA = new Date(a.event_date);
            const dateB = new Date(b.event_date);
            return dateA - dateB;
        });

        renderMatches(allMatches);
        Utils.hideLoader();

    } catch (error) {
        console.error('Matches error:', error);
        container.innerHTML = `
            <div class="error-box full-width">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Unable to load matches</p>
                <p class="error-sub">Check your AllSportsAPI key and league ID</p>
                <button class="retry-btn" onclick="fetchAllMatches()">
                    <i class="fa-solid fa-rotate"></i> Retry
                </button>
            </div>
        `;
        Utils.hideLoader();
    }
}

function renderMatches(matches) {
    const container = document.getElementById('matches-container');
    const countEl = document.getElementById('matches-count');

    if (matches.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fa-solid fa-search"></i>
                <p>No matches found matching your filters</p>
            </div>
        `;
        countEl.textContent = '0 matches found';
        return;
    }

    countEl.textContent = `${matches.length} matches found`;

    // Group matches by date
    const grouped = {};
    matches.forEach(match => {
        const date = match.event_date || 'Unknown Date';
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(match);
    });

    let html = '';

    Object.entries(grouped).forEach(([date, dateMatches]) => {
        const formattedDate = Utils.formatDate(date);
        const isToday = new Date(date).toDateString() === new Date().toDateString();

        html += `
            <div class="match-date-group">
                <div class="match-date-header">
                    <i class="fa-regular fa-calendar"></i>
                    ${formattedDate}
                    ${isToday ? '<span class="today-badge">TODAY</span>' : ''}
                </div>
            </div>
        `;

        dateMatches.forEach(match => {
            const status = getMatchStatusFull(match);
            const homeScore = match.event_home_team_score || '-';
            const awayScore = match.event_away_team_score || '-';

            html += `
                <div class="match-card-full ${status.class}">
                    <div class="match-card-status">
                        <span class="status-badge ${status.badgeClass}">${status.text}</span>
                    </div>
                    <div class="match-card-content">
                        <div class="match-team home">
                            ${Utils.getTeamLogo(match.home_team_logo)}
                            <span class="team-name">${match.event_home_team}</span>
                        </div>
                        <div class="match-center">
                            ${status.isUpcoming
                                ? `<div class="match-time-display">
                                        <span class="match-time-big">${match.event_time || 'TBD'}</span>
                                        <span class="match-date-small">${formattedDate}</span>
                                   </div>`
                                : `<div class="match-score-display">
                                        <span class="score-big">${homeScore}</span>
                                        <span class="score-divider">-</span>
                                        <span class="score-big">${awayScore}</span>
                                   </div>`
                            }
                        </div>
                        <div class="match-team away">
                            ${Utils.getTeamLogo(match.away_team_logo)}
                            <span class="team-name">${match.event_away_team}</span>
                        </div>
                    </div>
                    <div class="match-card-footer">
                        <span><i class="fa-solid fa-trophy"></i> ${match.league_name || ''}</span>
                        <span>${match.league_round || ''}</span>
                    </div>
                </div>
            `;
        });
    });

    container.innerHTML = html;
}

function getMatchStatusFull(match) {
    const status = match.event_status || '';

    if (status === 'Finished' || status === 'After Pens' || status === 'After ET') {
        return {
            text: 'Finished',
            class: 'match-finished',
            badgeClass: 'badge-finished',
            isUpcoming: false
        };
    }
    if (status === 'Half Time') {
        return {
            text: 'Half Time',
            class: 'match-live',
            badgeClass: 'badge-live',
            isUpcoming: false
        };
    }
    if (status === '' || status === 'Not Started' || !status) {
        return {
            text: 'Upcoming',
            class: 'match-upcoming',
            badgeClass: 'badge-upcoming',
            isUpcoming: true
        };
    }
    return {
        text: `Live ${status}'`,
        class: 'match-live',
        badgeClass: 'badge-live',
        isUpcoming: false
    };
}

// ============================================================
// FILTERS (Bonus)
// ============================================================
function setupFilters() {
    const teamInput = document.getElementById('filter-team');
    const dateInput = document.getElementById('filter-date');
    const statusSelect = document.getElementById('filter-status');
    const clearBtn = document.getElementById('clear-filters');

    let debounceTimer;

    const applyFilters = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const teamQuery = teamInput.value.toLowerCase().trim();
            const dateQuery = dateInput.value;
            const statusQuery = statusSelect.value;

            let filtered = [...allMatches];

            // Filter by team name
            if (teamQuery) {
                filtered = filtered.filter(m =>
                    m.event_home_team.toLowerCase().includes(teamQuery) ||
                    m.event_away_team.toLowerCase().includes(teamQuery)
                );
            }

            // Filter by date
            if (dateQuery) {
                filtered = filtered.filter(m => m.event_date === dateQuery);
            }

            // Filter by status
            if (statusQuery !== 'all') {
                filtered = filtered.filter(m => {
                    const s = getMatchStatusFull(m);
                    if (statusQuery === 'finished') return s.text === 'Finished';
                    if (statusQuery === 'live') return s.class === 'match-live';
                    if (statusQuery === 'upcoming') return s.text === 'Upcoming';
                    return true;
                });
            }

            renderMatches(filtered);
        }, 300);
    };

    teamInput.addEventListener('input', applyFilters);
    dateInput.addEventListener('change', applyFilters);
    statusSelect.addEventListener('change', applyFilters);

    clearBtn.addEventListener('click', () => {
        teamInput.value = '';
        dateInput.value = '';
        statusSelect.value = 'all';
        renderMatches(allMatches);
    });
}