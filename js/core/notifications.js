import { API } from './api.js';
import { Socket } from './Socket.js';
import { i18n } from './i18n.js';
import { Router } from './router.js';


/**
 * NotificationSystem
 * - Renders a 🔔 bell in the header with unread badge
 * - Shows an in-app dropdown with notification history
 * - Fires desktop (browser) Notification API when the tab isn't focused
 * - Listens to real-time socket events
 */
export const NotificationSystem = {
    _unreadCount: 0,
    _notifications: [],
    _desktopPermission: 'default',
    _desktopGranted: false,
    _mazmos: null, // cache of mazmos.json array

    // =========================================================
    // INIT – call once after the user is authenticated
    // =========================================================
    async init() {
        // Ask for desktop notification permission
        if ('Notification' in window) {
            this._desktopPermission = Notification.permission;
            if (Notification.permission === 'default') {
                const perm = await Notification.requestPermission();
                this._desktopPermission = perm;
            }
            this._desktopGranted = this._desktopPermission === 'granted';
        }

        // Pre-load dungeon data for name resolution
        if (!this._mazmos) {
            try {
                const res = await fetch('./assets/data/mazmos.json');
                this._mazmos = await res.json();
            } catch (e) {
                this._mazmos = [];
                console.warn('[Notifications] Failed to load mazmos.json', e);
            }
        }

        // Load existing notifications from backend
        await this.fetchNotifications();

        // Listen for real-time socket events
        Socket.off('new_notification');
        Socket.on('new_notification', (data) => {
            this._handleSocketNotification(data);
        });

        console.log('🔔 [Notifications] System initialized');
    },

    // =========================================================
    // FETCH – get unread notifications from backend
    // =========================================================
    async fetchNotifications() {
        try {
            const data = await API.getNotifications();
            this._notifications = Array.isArray(data) ? data : [];
            this._unreadCount = this._notifications.filter(n => !n.is_read).length;
            this._refreshUI();
        } catch (e) {
            console.warn('[Notifications] Failed to fetch:', e.message);
        }
    },

    // =========================================================
    // REAL-TIME – handle incoming socket notification
    // =========================================================
    _handleSocketNotification(data) {
        console.log('📬 [Notifications] Nuevo evento recibido:', data);

        // Build a synthetic notification object
        const notif = {
            id: data.id || Date.now(),
            type: data.type || 'info',
            data: data,
            createdAt: new Date().toISOString(),
            is_read: false,
        };

        this._notifications.unshift(notif);
        this._unreadCount++;
        this._refreshUI();

        // Show in-app toast
        this.showToast(this._buildMessage(notif), notif.type);

        // Show desktop notification if tab is not focused
        if (this._desktopGranted && document.visibilityState !== 'visible') {
            this._fireDesktop(notif);
        }
    },

    _refreshUI() {
        this._updateBadge();
        const list = document.getElementById('notif-list');
        const dropdown = document.getElementById('notif-dropdown');
        if (list) {
            list.innerHTML = this._renderList();
            if (dropdown) this._bindNotifItemClicks(dropdown);
        }
    },

    // =========================================================
    // DESKTOP NOTIFICATION API
    // =========================================================
    _fireDesktop(notif) {
        try {
            const title = 'Wakfu LFG';
            const body = this._stripHtml(this._buildMessage(notif));
            
            // Icon optimization: Use character emote if available
            let icon = 'assets/classes/icons/1.png';
            if (notif.data?.classId) {
                const paddedId = String(notif.data.classId).padStart(2, '0');
                const gender = notif.data.gender !== undefined ? notif.data.gender : 0;
                icon = `assets/classes/emote/${paddedId}${gender}.png`;
            }

            const n = new Notification(title, { body, icon, tag: String(notif.id) });

            n.onclick = () => {
                window.focus();
                // Navigate to relevant page
                if (notif.data?.groupId) {
                    Router.navigateTo(`/group/${notif.data.groupId}`);
                }
                n.close();
            };
        } catch (e) {
            console.warn('[Notifications] Desktop notification failed:', e);
        }
    },

    // =========================================================
    // DUNGEON NAME RESOLVER
    // =========================================================
    _getDungeonName(d) {
        const lang = localStorage.getItem('lang') || 'es';

        // Prefer dungeonId lookup from mazmos.json
        if (d.dungeonId && this._mazmos?.length) {
            const entry = this._mazmos.find(m => String(m.id) === String(d.dungeonId));
            if (entry?.name) {
                return entry.name[lang] || entry.name.es || entry.name.en || Object.values(entry.name)[0] || '';
            }
        }

        // Fallback: dungeonName field (object or string)
        const rawName = d.dungeonName;
        if (!rawName) return '';
        if (typeof rawName === 'object') {
            return rawName[lang] || rawName.es || rawName.en || Object.values(rawName)[0] || '';
        }
        return rawName;
    },

    getMessage(notif) {
        return this._buildMessage(notif);
    },

    // =========================================================
    // MESSAGE BUILDER
    // =========================================================
    _buildMessage(notif) {
        const d = notif.data || {};
        const dungeon = this._getDungeonName(d);

        switch (notif.type) {
            case 'request_received': {
                const charName = d.characterName || 'Alguien';
                const classId = d.classId || 1;
                const gender = d.gender !== undefined ? d.gender : 0;
                const paddedId = String(classId).padStart(2, '0');
                const groupTitle = d.groupTitle || '...';
                const classIcon = `<img src="assets/classes/emote/${paddedId}${gender}.png" class="notif-class-icon" style="width:20px; height:20px; vertical-align:middle; margin-right:6px; border-radius:4px; display:inline-block !important; background: rgba(255,255,255,0.05);">`;
                
                return i18n.t('notifs.request_received', { 
                    charName: `${classIcon} <b>${charName}</b>`,
                    groupTitle: `<b>${groupTitle}</b>`,
                    dungeon 
                });
            }
            case 'request_accepted': {
                const charName = d.characterName || '';
                const classId = d.classId;
                const gender = d.gender !== undefined ? d.gender : 0;
                let charStr = '';
                if (charName && classId) {
                    const paddedId = String(classId).padStart(2, '0');
                    const icon = `<img src="assets/classes/emote/${paddedId}${gender}.png" class="notif-class-icon" style="width:20px; height:20px; vertical-align:middle; margin-right:6px; border-radius:4px; display:inline-block !important; background: rgba(255,255,255,0.05);">`;
                    charStr = `${icon} <b>${charName}</b>`;
                }
                return i18n.t('notifs.request_accepted', { dungeon, charName: charStr }) || `¡Tu solicitud para ${dungeon} fue aceptada!`;
            }
            case 'request_rejected':
                return i18n.t('notifs.request_rejected', { dungeon }) || `Tu solicitud para ${dungeon} fue rechazada.`;
            case 'leader_changed':
                return i18n.t('notifs.leader_changed') || '¡Ahora eres el nuevo líder del grupo!';
            case 'member_joined':
                return i18n.t('notifs.member_joined', { name: d.characterName }) || `${d.characterName || 'Alguien'} se unió al grupo.`;
            case 'member_left':
                return i18n.t('notifs.member_left', { name: d.characterName }) || `${d.characterName || 'Alguien'} abandonó el grupo.`;
            case 'kicked_from_group': {
                const charName = d.characterName || '';
                const classId = d.classId;
                const gender = d.gender !== undefined ? d.gender : 0;
                let charStr = '';
                if (charName && classId) {
                    const paddedId = String(classId).padStart(2, '0');
                    const icon = `<img src="assets/classes/emote/${paddedId}${gender}.png" class="notif-class-icon" style="width:20px; height:20px; vertical-align:middle; margin-right:6px; border-radius:4px; display:inline-block !important; background: rgba(255,255,255,0.05);">`;
                    charStr = `${icon} <b>${charName}</b>`;
                }
                return i18n.t('notifs.kicked_from_group', { dungeon, charName: charStr }) || `Fuiste expulsado del grupo de ${dungeon}.`;
            }
            case 'group_closed':
                return i18n.t('notifs.group_closed', { dungeon }) || `El grupo de ${dungeon} fue cerrado.`;
            default:
                return d.message || i18n.t('notifs.generic') || 'Nueva notificación';
        }
    },

    // =========================================================
    // IN-APP TOAST
    // =========================================================
    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `notif-toast notif-toast--${type}`;
        toast.innerHTML = `
            <span class="notif-toast__icon">${this._typeIcon(type)}</span>
            <span class="notif-toast__msg">${message}</span>
            <button class="notif-toast__close">×</button>
        `;

        container.appendChild(toast);

        // Auto-dismiss after 5s
        const dismiss = () => {
            toast.classList.add('notif-toast--out');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        };
        const timer = setTimeout(dismiss, 5000);

        toast.querySelector('.notif-toast__close').onclick = () => {
            clearTimeout(timer);
            dismiss();
        };

        // Animate in
        requestAnimationFrame(() => toast.classList.add('notif-toast--in'));
    },

    _typeIcon(type) {
        const map = {
            request_received: '📩',
            request_accepted: '✅',
            request_rejected: '❌',
            leader_changed: '👑',
            member_joined: '🎉',
            member_left: '👣',
            kicked_from_group: '🚫',
            group_closed: '🚪',
            info: '🔔',
        };
        return map[type] || '🔔';
    },

    // =========================================================
    // BADGE UPDATER
    // =========================================================
    _updateBadge() {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;
        badge.textContent = this._unreadCount > 0 ? (this._unreadCount > 9 ? '9+' : this._unreadCount) : '';
        badge.style.display = this._unreadCount > 0 ? 'flex' : 'none';
    },

    // =========================================================
    // BELL HTML (injected into Header)
    // =========================================================
    renderBell() {
        const count = this._unreadCount;
        return `
            <div class="notif-bell-wrapper" id="notif-bell-wrapper">
                <button class="notif-bell-btn" id="notif-bell-btn" title="${i18n.t('notifs.title') || 'Notificaciones'}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span id="notif-badge" class="notif-badge" style="display:${count > 0 ? 'flex' : 'none'}">${count > 9 ? '9+' : count}</span>
                </button>

                <div class="notif-dropdown" id="notif-dropdown">
                    <div class="notif-dropdown__header">
                        <span>${i18n.t('notifs.title') || 'Notificaciones'}</span>
                        <button class="notif-mark-all" id="notif-mark-all">${i18n.t('notifs.mark_all_read') || 'Marcar todo como leído'}</button>
                    </div>
                    <div class="notif-dropdown__list" id="notif-list">
                        ${this._renderList()}
                    </div>
                </div>
            </div>
        `;
    },

    _renderList() {
        if (this._notifications.length === 0) {
            return `<div class="notif-empty">${i18n.t('notifs.empty') || 'No tienes notificaciones nuevas'}</div>`;
        }
        return this._notifications.slice(0, 5).map(n => `
            <div class="notif-item ${n.is_read ? 'notif-item--read' : ''}" data-notif-id="${n.id}" data-group-id="${n.data?.groupId || ''}">
                <span class="notif-item__icon">${this._typeIcon(n.type)}</span>
                <div class="notif-item__body">
                    <span class="notif-item__msg">${this._buildMessage(n)}</span>
                    <span class="notif-item__time">${this._relativeTime(n.createdAt)}</span>
                </div>
                <button class="notif-item-dismiss" data-notif-id="${n.id}" title="${i18n.t('ui.dismiss') || 'Descartar'}">×</button>
            </div>
        `).join('');
    },

    _relativeTime(isoStr) {
        const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
        if (diff < 60) return i18n.t('time.just_now') || 'ahora mismo';
        if (diff < 3600) return `${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return new Date(isoStr).toLocaleDateString();
    },

    // =========================================================
    // AFTER RENDER – bind events to the bell button
    // =========================================================
    afterRender() {
        const btn = document.getElementById('notif-bell-btn');
        const dropdown = document.getElementById('notif-dropdown');
        const markAllBtn = document.getElementById('notif-mark-all');

        if (!btn || !dropdown) return;

        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('show');
            // Mutual exclusion: close language dropdown if open
            document.getElementById('lang-dropdown')?.classList.remove('show');
            dropdown.classList.toggle('show');

            // On open: we used to mark all as read automatically, 
            // but now we leave it to the manual button to make it more meaningful.
            if (!isOpen) { 
                // Do nothing special on open relative to marking read
            }
        });

        // Close on outside click
        window.addEventListener('click', () => dropdown?.classList.remove('show'));

        // Click on individual notification → dismiss (remove) + navigate
        this._bindNotifItemClicks(dropdown);

        if (markAllBtn) {
            markAllBtn.onclick = async (e) => {
                e.stopPropagation();
                await this._markAllReadOnly();
            };
        }
    },

    _bindNotifItemClicks(dropdown) {
        document.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                // Ignore if clicking dismiss button
                if (e.target.closest('.notif-item-dismiss')) return;

                e.stopPropagation();
                const nid = item.dataset.notifId;
                const gid = item.dataset.groupId;

                // Mark as read internally
                const notif = this._notifications.find(n => String(n.id) === String(nid));
                if (notif && !notif.is_read) {
                    notif.is_read = true;
                    this._unreadCount = this._notifications.filter(n => !n.is_read).length;
                    this._updateBadge();
                    item.classList.add('notif-item--read');
                    try { await API.markNotificationAsRead(nid); } catch (err) { /* ignore */ }
                }

                // Navigate if group exists
                if (gid) {
                    dropdown.classList.remove('show');
                    import('./router.js').then(({ Router }) => Router.navigateTo(`/group/${gid}`));
                }
            });
        });

        // Small dismiss button (x) inside each notification
        document.querySelectorAll('.notif-item-dismiss').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const nid = btn.dataset.notifId;
                const row = btn.closest('.notif-item');
                
                // Animate out
                if (row) {
                    row.style.opacity = '0';
                    row.style.maxHeight = '0';
                    row.style.padding = '0';
                    row.style.margin = '0';
                }

                this._notifications = this._notifications.filter(n => String(n.id) !== String(nid));
                this._unreadCount = this._notifications.filter(n => !n.is_read).length;
                this._updateBadge();

                try { await API.dismissNotification(nid); } catch (err) { /* ignore */ }
                
                setTimeout(() => {
                    const list = document.getElementById('notif-list');
                    if (list) list.innerHTML = this._renderList();
                    this._bindNotifItemClicks(dropdown);
                }, 300);
            };
        });
    },

    // Mark all as read (dim) but keep visible in list
    async _markAllReadOnly() {
        try {
            await API.markNotificationsRead();
            this._notifications.forEach(n => n.is_read = true);
            this._unreadCount = 0;
            this._updateBadge();
            // Re-render to show dimmed state
            const list = document.getElementById('notif-list');
            if (list) {
                list.innerHTML = this._renderList();
                this._bindNotifItemClicks(document.getElementById('notif-dropdown'));
            }
        } catch (e) {
            console.warn('[Notifications] Failed to mark read:', e.message);
        }
    },

    // Dismiss ALL notifications (removes from list entirely)
    async _dismissAll() {
        try {
            // Delete each one
            await Promise.all(this._notifications.map(n => API.dismissNotification(n.id).catch(() => {})));
        } finally {
            this._notifications = [];
            this._unreadCount = 0;
            this._updateBadge();
            const list = document.getElementById('notif-list');
            if (list) list.innerHTML = this._renderList();
        }
    },

    // =========================================================
    async requestDesktopPermission() {
        if (!('Notification' in window)) return false;
        const perm = await Notification.requestPermission();
        this._desktopPermission = perm;
        this._desktopGranted = perm === 'granted';
        return this._desktopGranted;
    },

    // Standard HTML stripper for plain-text notifications (Desktop API)
    _stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
};
