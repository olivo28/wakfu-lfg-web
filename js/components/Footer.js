import { Socket } from '../core/Socket.js';
import { i18n } from '../core/i18n.js';

export const Footer = {
    render: async () => {
        return `
            <div class="footer-content">
                <p class="footer-copy">&copy; ${new Date().getFullYear()} Wakfu LFG &mdash; <span class="footer-tagline" data-i18n="ui.prototype_tagline">${i18n.t('ui.prototype_tagline') || 'Prototipo para la comunidad de Wakfu'}</span></p>
                <div class="footer-stats" id="footer-live-stats">
                    <div class="footer-stat" id="footer-stat-online">
                        <span class="stat-dot stat-dot--online"></span>
                        <span class="stat-value" id="stat-online-val">—</span>
                        <span class="stat-label" data-i18n="ui.stats_online"></span>
                    </div>
                    <div class="footer-stat-sep">|</div>
                    <div class="footer-stat" id="footer-stat-groups">
                        <span class="stat-dot stat-dot--groups"></span>
                        <span class="stat-value" id="stat-groups-val">—</span>
                        <span class="stat-label" data-i18n="ui.stats_active_groups"></span>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender: () => {
        // Listen for real-time stats updates from the server
        Socket.off('stats_update');
        Socket.on('stats_update', (data) => {
            const onlineEl = document.getElementById('stat-online-val');
            const groupsEl = document.getElementById('stat-groups-val');
            if (onlineEl) onlineEl.textContent = data.online ?? '—';
            if (groupsEl) groupsEl.textContent = data.activeGroups ?? '—';
        });
    }
};