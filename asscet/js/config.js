// ============================================================
// API CONFIGURATION
// Replace with your actual API keys
// ============================================================
const CONFIG = {
    keys: {
        weather: '331c2bb2845e215a421b06d181477344',
        news: 'bcffadcb4fc959f6f2e76cff01247808',
        sports: 'Authorization code generated from your allsportsapi account',
        currency: 'ee07f882280a1eded5133c85'
    },
    leagueId: 152, // Premier League (change as needed)
    sportsBase: 'https://apiv2.allsportsapi.com/football/'
};
const Utils = {
    async fetchJSON(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    },

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    },

    hideLoader() {
        setTimeout(() => {
            const el = document.getElementById('loader');
            if (el) el.classList.add('hidden');
        }, 600);
    },

    teamLogo(src) {
        if (!src) return '<i class="fa-solid fa-shield-halved logo-placeholder"></i>';
        return `<img src="${src}" alt="" class="team-logo"
                onerror="this.outerHTML='<i class=\\'fa-solid fa-shield-halved logo-placeholder\\'></i>'">`;
    },

    setupNav() {
        const toggle = document.getElementById('menu-toggle');
        const menu = document.getElementById('mobile-menu');
        if (toggle && menu) {
            toggle.addEventListener('click', () => menu.classList.toggle('open'));
        }

        const backTop = document.getElementById('back-top');
        if (backTop) {
            window.addEventListener('scroll', () => {
                backTop.classList.toggle('show', window.scrollY > 300);
            });
            backTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    },

    observeElements(selector) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add('visible');
            });
        }, { threshold: 0.1 });

        new MutationObserver(() => {
            document.querySelectorAll(`${selector}:not(.watched)`).forEach(el => {
                el.classList.add('watched');
                observer.observe(el);
            });
        }).observe(document.body, { childList: true, subtree: true });
    },

    showError(containerId, msg, retryFn) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>${msg}</p>
                ${retryFn ? `<button class="btn-retry" onclick="${retryFn}">
                    <i class="fa-solid fa-rotate-right"></i> Retry
                </button>` : ''}
            </div>`;
    },

    skeleton(id, count, type) {
        const el = document.getElementById(id);
        if (!el) return;
        const templates = {
            card: `<div class="news-card skeleton-active">
                     <div class="sk sk-img"></div>
                     <div class="sk sk-h"></div>
                     <div class="sk sk-p"></div>
                     <div class="sk sk-p half"></div>
                   </div>`,
            match: `<div class="match-row skeleton-active">
                      <div class="sk sk-p"></div>
                      <div class="sk sk-p half"></div>
                    </div>`,
            row: `<tr class="skeleton-active">
                    <td colspan="11"><div class="sk sk-p"></div></td>
                  </tr>`,
            stat: `<div class="player-card skeleton-active">
                     <div class="sk sk-circle"></div>
                     <div class="sk sk-h"></div>
                     <div class="sk sk-p half"></div>
                   </div>`
        };
        el.innerHTML = Array(count).fill(templates[type] || templates.card).join('');
    }
};