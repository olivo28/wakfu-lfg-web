import { CONFIG } from '../config.js';
import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';
import { Modal } from '../components/Modal.js';
import { CharacterCard } from '../components/CharacterCard.js';
import { Header } from '../components/Header.js';
import { Router } from '../core/router.js';
import { NotificationSystem } from '../core/notifications.js';

export const ProfilePage = {
    // Cache local de clases para evitar múltiples fetchs
    masterClasses: null,
    dungeonData: null,

    currentTab: 'chars',

    getSEOData: () => ({
        title: `${i18n.t('nav.profile')} | Wakfu LFG`,
        description: 'Gestiona tus personajes y revisa tus solicitudes de grupo.'
    }),

    refresh: async () => {
        if (Router.currentPath !== '/profile') return;
        const layout = document.querySelector('.profile-page-layout');
        if (!layout) {
            // Si no hay layout, re-render entero
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = await ProfilePage.render();
                await ProfilePage.afterRender();
            }
            return;
        }

        // Si hay layout, solo refrescar pestaña actual
        await ProfilePage.switchTab(ProfilePage.currentTab, false);
    },

    // Generar solo el contenido de la pestaña
    renderTabContent: async (tab) => {
        ProfilePage.currentTab = tab;
        const characters = await API.getMyCharacters();
        const getDungInfo = (id) => ProfilePage.dungeonData?.find(d => d.id == id);
        
        if (tab === 'chars') {
            return `
                <div class="characters-grid" id="char-list">
                    ${characters.length > 0 
                        ? characters.map(char => CharacterCard.render(char, ProfilePage.masterClasses)).join('')
                        : `<div class="empty-state"><p data-i18n="profile.no_chars">No tienes personajes registrados.</p></div>`
                    }
                </div>
            `;
        } else if (tab === 'groups') {
            const received = await API.getReceivedRequests();
            return `
                <div class="requests-premium-grid">
                    ${received.length > 0 ? received.map(req => {
                        const currentLang = localStorage.getItem('lang') || 'es';
                        const dungInfo = getDungInfo(req.LfgGroup?.data?.dungeonId);
                        const dungeon = dungInfo?.name?.[currentLang] || req.LfgGroup?.data?.dungeonName?.[currentLang] || i18n.t('dungeons.dungeon');
                        const dungeonId = req.LfgGroup?.data?.dungeonId;
                        const members = req.LfgGroup?.data?.members || [];
                        const stasis = req.LfgGroup?.data?.stasis || 1;
                        const level = dungInfo ? `${dungInfo.min_lvl} [${dungInfo.modulated}]` : '';
                        const app = req.requesterCharacter || { name: '?', classId: 1, gender: 0 };
                        const groupTitle = req.LfgGroup?.data?.title ? `${req.LfgGroup.data.title}` : '';

                        return `
                        <div class="request-card-premium card-clickable" data-group-id="${req.LfgGroup?.groupId}">
                            <div class="req-side-banner">
                                <img src="assets/mazmos/${dungeonId}.png" onerror="this.src='assets/ui/placeholder_dung.jpg'">
                            </div>
                            <div class="req-content-main">
                                <div class="req-info-header">
                                    <div class="req-titles-stack">
                                        ${groupTitle ? `<span class="req-group-title-mini">${groupTitle.toUpperCase()}</span>` : ''}
                                        <span class="req-dung-name">${dungeon}</span>
                                    </div>
                                    <div class="req-meta-badges">
                                        <span class="badge-mini">Lvl ${level}</span>
                                        <span class="badge-mini badge-stasis">S${stasis}</span>
                                    </div>
                                </div>
                                <div class="req-group-context">
                                    <span class="text-dim-mini" data-i18n="lfg.my_group">Mi Grupo</span>
                                    <div class="req-mini-members">
                                        ${members.map(m => `<img src="assets/classes/emote/${String(m.classId).padStart(2, '0')}${m.gender || 0}.png" title="${m.name}" class="emote-tiny">`).join('')}
                                    </div>
                                </div>
                            </div>
                            <div class="req-actions-panel">
                                <div class="applicant-bubble">
                                    <img src="assets/classes/emote/${String(app.classId).padStart(2, '0')}${app.gender || 0}.png" class="emote-applicant">
                                    <span class="name-applicant">${app.name}</span>
                                </div>
                                <div class="btn-group-vertical">
                                    <button class="btn btn-xs btn-accent btn-accept" data-id="${req.id}" data-i18n="lfg.accept">ACEPTAR</button>
                                    <button class="btn btn-xs btn-delete-char btn-reject" data-id="${req.id}" data-i18n="lfg.reject">RECHAZAR</button>
                                </div>
                            </div>
                        </div>`;
                    }).join('') : '<div class="empty-state-mini" data-i18n="profile.no_received_requests">No hay solicitudes pendientes.</div>'}
                </div>
            `;
        } else if (tab === 'sent') {
            const sent = await API.getSentRequests();
            const pending = sent.filter(r => r.status === 'pending');
            const resolved = sent.filter(r => r.status !== 'pending');
            
            const renderCard = (req) => {
                const currentLang = localStorage.getItem('lang') || 'es';
                const dungInfo = getDungInfo(req.LfgGroup?.data?.dungeonId);
                const dungeon = dungInfo?.name?.[currentLang] || req.LfgGroup?.data?.dungeonName?.[currentLang] || i18n.t('dungeons.dungeon');
                const dungeonId = req.LfgGroup?.data?.dungeonId;
                const status = req.status || 'pending';
                const members = req.LfgGroup?.data?.members || [];
                const stasis = req.LfgGroup?.data?.stasis || 1;
                const level = dungInfo ? `${dungInfo.min_lvl} [${dungInfo.modulated}]` : '';
                const groupTitle = req.LfgGroup?.data?.title ? req.LfgGroup.data.title : '';

                return `
                <div class="request-card-premium card-clickable" data-group-id="${req.LfgGroup?.groupId}">
                    <div class="req-side-banner">
                        <img src="assets/mazmos/${dungeonId}.png" onerror="this.src='assets/ui/placeholder_dung.jpg'">
                        <div class="status-indicator status-${status}"></div>
                    </div>
                    <div class="req-content-main">
                        <div class="req-info-header">
                            <div class="req-titles-stack">
                                ${groupTitle ? `<span class="req-group-title-mini">${groupTitle.toUpperCase()}</span>` : ''}
                                <span class="req-dung-name">${dungeon}</span>
                            </div>
                            <div class="req-meta-badges">
                                <span class="badge-mini">Lvl ${level}</span>
                                <span class="badge-mini badge-stasis">S${stasis}</span>
                            </div>
                        </div>
                        <div class="req-group-context">
                            <span class="text-dim-mini"><span data-i18n="lfg.leader">Líder</span>: <b>${req.LfgGroup?.creator_name || ''}</b></span>
                            <div class="req-mini-members">
                                ${members.map(m => `<img src="assets/classes/emote/${String(m.classId).padStart(2, '0')}${m.gender || 0}.png" title="${m.name}" class="emote-tiny">`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="req-actions-panel">
                        <div class="applicant-bubble">
                            <span class="status-label status-${status}">${status.toUpperCase()}</span>
                            <span class="text-dim-mini">${req.requesterCharacter?.name || ''}</span>
                        </div>
                        <div class="btn-group-vertical">
                            ${status === 'pending' ? `<button class="btn btn-xs btn-dim btn-cancel-req" data-id="${req.id}" data-i18n="lfg.cancel">CANCELAR</button>` : ''}
                        </div>
                    </div>
                </div>`;
            };

            let html = '';
            if (pending.length > 0) {
                html += `<div class="tab-section-header" data-i18n="lfg.pending_requests">Pendientes</div>`;
                html += `<div class="requests-premium-grid">${pending.map(renderCard).join('')}</div>`;
            }
            if (resolved.length > 0) {
                html += `<div class="tab-section-header" data-i18n="lfg.resolved_requests">Resueltas</div>`;
                html += `<div class="requests-premium-grid">${resolved.map(renderCard).join('')}</div>`;
            }
            if (sent.length === 0) {
                html += '<div class="empty-state-mini" data-i18n="profile.no_sent_requests">No has enviado ninguna solicitud.</div>';
            }
            return html;
        } else if (tab === 'notifs') {
            const { API: _api } = await import('../core/api.js');
            const all = await _api.getNotifications().catch(() => []);

            // Load mazmos for name resolution
            let mazmos = [];
            try { mazmos = await fetch('./assets/data/mazmos.json').then(r => r.json()); } catch(e) {}
            const lang = localStorage.getItem('lang') || 'es';

            const resolveName = (d) => {
                if (!d) return '';
                if (d.dungeonId) {
                    const entry = mazmos.find(m => String(m.id) === String(d.dungeonId));
                    if (entry?.name) return entry.name[lang] || entry.name.es || '';
                }
                const raw = d.dungeonName;
                if (!raw) return '';
                return typeof raw === 'object' ? (raw[lang] || raw.es || '') : raw;
            };

            const renderRow = (n) => {
                const msg = NotificationSystem.getMessage(n);
                const date = new Date(n.createdAt).toLocaleString(lang);
                const gid = n.data?.groupId || '';
                return `
                <div class="notif-history-row ${n.is_read ? 'notif-history-row--read' : ''}" data-notif-id="${n.id}" data-group-id="${gid}">
                    <span class="notif-history-icon">${NotificationSystem._typeIcon(n.type)}</span>
                    <div class="notif-history-body">
                        <span class="notif-history-msg">${msg}</span>
                        <span class="notif-history-date">${date}</span>
                    </div>
                    <button class="notif-history-dismiss" data-notif-id="${n.id}" title="Descartar">×</button>
                </div>`;
            };

            const unread = all.filter(n => !n.is_read);
            const read = all.filter(n => n.is_read);

            let html = '<div class="notif-history-list" id="notif-history-list">';
            if (all.length === 0) {
                html += `<div class="empty-state-mini">${i18n.t('notifs.empty') || 'No hay notificaciones.'}</div>`;
            } else {
                if (unread.length > 0) {
                    html += `<div class="tab-section-header">🔴 ${i18n.t('profile.notifs_unread') || 'SIN LEER'}</div>`;
                    html += unread.map(renderRow).join('');
                }
                if (read.length > 0) {
                    html += `<div class="tab-section-header">${i18n.t('profile.notifs_read') || 'LEÍDAS'}</div>`;
                    html += read.map(renderRow).join('');
                }
            }
            html += '</div>';
            return html;
        } else if (tab === 'teams') {
            const user = Header.getUserFromToken();
            const myGroupsRes = await API.getGroups({ is_active: 'all' });
            const allGroups = Array.isArray(myGroupsRes) ? myGroupsRes : (myGroupsRes?.groups || []);
            
            // Filtrar grupos donde el usuario es líder O miembro
            const historical = allGroups.filter(g => {
                const data = g.data || g;
                const isLeader = String(g.leader_id) === String(user.id);
                const isMember = data.members?.some(m => String(m.userId) === String(user.id));
                return isLeader || isMember;
            });

            // Aplicar búsqueda local si existe
            const searchTerm = ProfilePage.teamsSearchTerm?.toLowerCase() || '';
            const filtered = historical.filter(g => {
                if (!searchTerm) return true;
                const data = g.data || g;
                const currentLang = localStorage.getItem('lang') || 'es';
                const dungInfo = getDungInfo(data.dungeonId);
                const dungeon = dungInfo?.name?.[currentLang] || data.dungeonName?.[currentLang] || '';
                return dungeon.toLowerCase().includes(searchTerm) || String(data.level).includes(searchTerm);
            });

            const activeGroups = filtered.filter(g => g.is_active !== false);
            const closedGroups = filtered.filter(g => g.is_active === false);

            const renderGroupCard = (group) => {
                const data = group.data || group;
                const dungInfo = getDungInfo(data.dungeonId);
                const currentLang = localStorage.getItem('lang') || 'es';
                const dungeon = dungInfo?.name?.[currentLang] || data.dungeonName?.[currentLang] || '...';
                const members = data.members || []; 
                const date = new Date(group.createdAt).toLocaleDateString();
                const isActive = group.is_active !== false;
                const isLeader = String(group.leader_id) === String(user.id);

                return `
                <div class="request-card-premium card-clickable" data-group-id="${group.id || data.groupId}">
                    <div class="req-side-banner">
                        <img src="assets/mazmos/${data.dungeonId}.png" onerror="this.src='assets/backgrounds/default_dungeon.jpg'">
                    </div>
                    <div class="req-content-main">
                        <div class="req-info-header">
                            <div class="req-titles-stack">
                                <span class="req-group-title-mini">${(data.title || i18n.t('ui.title')).toUpperCase()}</span>
                                <span class="req-dung-name">${dungeon}</span>
                            </div>
                            <div class="req-meta-badges">
                                <span class="badge-mini">${date}</span>
                                <span class="badge-mini">Lvl ${data.level}</span>
                                ${isLeader ? `<span class="badge-mini badge-leader">LEADER</span>` : ''}
                            </div>
                        </div>
                        <div class="req-group-context">
                            <div class="req-mini-members">
                                ${members.map(m => `<img src="assets/classes/emote/${String(m.classId || 1).padStart(2, '0')}${m.gender || 0}.png" title="${m.name}" class="emote-tiny">`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="req-actions-panel" style="width: auto; background: transparent; border: none;">
                        ${isActive 
                            ? `<span class="status-badge status-accepted" style="text-transform: uppercase; font-size: 9px;">${i18n.t('lfg.status_recruiting')}</span>`
                            : `<span class="status-badge status-closed" style="text-transform: uppercase; font-size: 9px; opacity: 0.6;">${i18n.t('lfg.status_closed')}</span>`
                        }
                    </div>
                </div>`;
            };

            return `
                <div class="teams-tab-header">
                    <div class="search-box-premium">
                        <i class="search-icon">🔍</i>
                        <input type="text" id="teams-search" placeholder="${i18n.t('ui.search_placeholder')}" value="${ProfilePage.teamsSearchTerm || ''}">
                    </div>
                </div>
                
                <div class="teams-history-container">
                    ${activeGroups.length > 0 ? `
                        <div class="tab-section-header" style="margin-top:0">${(i18n.t('filters.with_groups') || 'GRUPOS ACTIVOS').toUpperCase()}</div>
                        <div class="requests-premium-grid">
                            ${activeGroups.map(renderGroupCard).join('')}
                        </div>
                    ` : ''}

                    ${closedGroups.length > 0 ? `
                        <div class="tab-section-header" style="margin-top: 30px;">${(i18n.t('profile.tab_teams_title') || 'HISTORIAL (CERRADOS)').toUpperCase()}</div>
                        <div class="requests-premium-grid">
                            ${closedGroups.map(renderGroupCard).join('')}
                        </div>
                    ` : ''}

                    ${filtered.length === 0 ? `
                        <div class="empty-state-mini" data-i18n="profile.no_teams_history">${i18n.t('profile.no_teams_history')}</div>
                    ` : ''}
                </div>
            `;
        }
        return '';
    },

    render: async () => {
        const user = Header.getUserFromToken();
        if (!user) {
            Router.navigateTo('/login');
            return '';
        }

        // Deep linking: leer tab del hash secundario
        const secondaryHash = window.location.hash.split('#')[2];
        if (secondaryHash) {
            if (secondaryHash === 'characters') ProfilePage.currentTab = 'chars';
            else if (secondaryHash === 'sended') ProfilePage.currentTab = 'sent';
            else if (secondaryHash === 'mygroups') ProfilePage.currentTab = 'groups';
            else if (secondaryHash === 'history') ProfilePage.currentTab = 'teams';
        }

        if (!ProfilePage.masterClasses) {
            ProfilePage.masterClasses = await API.getClasses();
        }
        if (!ProfilePage.dungeonData) {
            try {
                const res = await fetch('assets/data/mazmos.json');
                ProfilePage.dungeonData = await res.json();
            } catch (e) { ProfilePage.dungeonData = []; }
        }

        const activeContent = await ProfilePage.renderTabContent(ProfilePage.currentTab);
        
        let tabTitle = i18n.t(`profile.tab_${ProfilePage.currentTab}_title`);
        let tabDesc = i18n.t(`profile.tab_${ProfilePage.currentTab}_desc`);
        
        // Mapear shorts si i18n falla o es diferente
        if (ProfilePage.currentTab === 'chars') {
            tabTitle = i18n.t('profile.tab_chars_title');
            tabDesc = i18n.t('profile.tab_chars_desc');
        }

        return `
            <div class="profile-page-layout">
                <aside class="profile-sidebar">
                    <div class="sidebar-header">
                        <h2 class="label-tech" id="tab-title-main">${tabTitle}</h2>
                        <p class="text-dim-mini" id="tab-desc-main">${tabDesc}</p>
                    </div>

                    <nav class="sidebar-menu">
                        <div class="sidebar-menu-item ${ProfilePage.currentTab === 'chars' ? 'active' : ''}" data-tab="chars">
                            <i>👤</i> <span data-i18n="profile.sidebar_chars">MI EQUIPO</span>
                        </div>
                        <div class="sidebar-menu-item ${ProfilePage.currentTab === 'groups' ? 'active' : ''}" data-tab="groups">
                            <i>⚔️</i> <span data-i18n="profile.sidebar_requests">SOLICITUDES</span>
                        </div>
                        <div class="sidebar-menu-item ${ProfilePage.currentTab === 'sent' ? 'active' : ''}" data-tab="sent">
                            <i>✉️</i> <span data-i18n="profile.sidebar_sent">ENVIADAS</span>
                        </div>
                        <div class="sidebar-menu-item ${ProfilePage.currentTab === 'teams' ? 'active' : ''}" data-tab="teams">
                            <i>📜</i> <span data-i18n="profile.sidebar_teams">MIS EQUIPOS</span>
                        </div>
                        <div class="sidebar-menu-item ${ProfilePage.currentTab === 'notifs' ? 'active' : ''}" data-tab="notifs">
                            <i>🔔</i> <span data-i18n="profile.sidebar_notifs">NOTIFICACIONES</span>
                        </div>
                    </nav>

                    <div class="sidebar-footer">
                        <div id="sidebar-action-container">
                            ${ProfilePage.currentTab === 'chars' ? `
                                <button class="btn btn-accent btn-block" id="btn-add-char">
                                    <span data-i18n="profile.add_char">+ AÑADIR PERSONAJE</span>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </aside>
                <main class="profile-main-content">
                    <div class="tab-content-wrapper" id="profile-tab-content">
                        ${activeContent}
                    </div>
                </main>
            </div>
        `;
    },

    /**
     * Optimización SPA: Cambiar de pestaña sin recargar el layout completo
     */
    switchTab: async (tab, updateHash = true) => {
        ProfilePage.currentTab = tab;
        const { Router } = await import('../core/router.js');
        
        // 1. Actualizar UI Sidebar
        document.querySelectorAll('.sidebar-menu-item').forEach(el => {
            el.classList.toggle('active', el.dataset.tab === tab);
        });

        // 2. Actualizar Textos Cabecera
        const titleEl = document.getElementById('tab-title-main');
        const descEl = document.getElementById('tab-desc-main');
        
        const keyMap = { 
            chars: 'chars', 
            groups: 'requests', 
            sent: 'sent', 
            teams: 'teams',
            notifs: 'notifs'
        };
        const baseKey = keyMap[tab] || tab;
        
        if (titleEl) titleEl.innerHTML = i18n.t(`profile.tab_${baseKey}_title`);
        if (descEl) descEl.innerHTML = i18n.t(`profile.tab_${baseKey}_desc`);

        // 3. Actualizar Botón de Acción (Footer Sidebar)
        const actionContainer = document.getElementById('sidebar-action-container');
        if (actionContainer) {
            actionContainer.innerHTML = tab === 'chars' ? `
                <button class="btn btn-accent btn-block" id="btn-add-char">
                    <span data-i18n="profile.add_char">+ AÑADIR PERSONAJE</span>
                </button>
            ` : '';
            // Re-bind add char button if it's there
            document.getElementById('btn-add-char')?.addEventListener('click', () => ProfilePage.openCharacterModal());
        }

        // 4. Cargar nuevo contenido con loader sutil
        const contentEl = document.getElementById('profile-tab-content');
        if (contentEl) {
            contentEl.style.opacity = '0.5';
            const html = await ProfilePage.renderTabContent(tab);
            contentEl.innerHTML = html;
            contentEl.style.opacity = '1';
            
            // Re-bind listeners de la pestaña
            await ProfilePage.bindTabListeners();
            i18n.translatePage();
        }

        // 5. Opcional: Actualizar Hash para permitir recarga/compartir
        if (updateHash) {
            let anchor = 'characters';
            if (tab === 'sent') anchor = 'sended';
            else if (tab === 'groups') anchor = 'mygroups';
            else if (tab === 'teams') anchor = 'history';
            else if (tab === 'notifs') anchor = 'notifications';

            const newHash = `/profile#${anchor}`;
            Router.navigateTo(newHash);
        }
    },

    /**
     * Reaccionar a cambios de hash del navegador (Atrás/Adelante)
     */
    onHashChange: async () => {
        const secondaryHash = window.location.hash.split('#')[2];
        let tab = 'chars';
        if (secondaryHash === 'characters') tab = 'chars';
        else if (secondaryHash === 'sended') tab = 'sent';
        else if (secondaryHash === 'mygroups') tab = 'groups';
        else if (secondaryHash === 'history') tab = 'teams';
        else if (secondaryHash === 'notifications') tab = 'notifs';

        if (tab !== ProfilePage.currentTab) {
            await ProfilePage.switchTab(tab, false);
        }
    },

    afterRender: async () => {
        const { Socket } = await import('../core/Socket.js');
        
        Socket.off('group_list_update');
        Socket.on('group_list_update', async () => {
            if (ProfilePage.currentTab !== 'chars') {
                await ProfilePage.refresh();
            }
        });

        Socket.off('request_processed');
        Socket.on('request_processed', async () => {
            if (ProfilePage.currentTab === 'sent') await ProfilePage.refresh();
        });

        Socket.off('new_notification');
        Socket.on('new_notification', async () => {
            if (ProfilePage.currentTab === 'notifs') await ProfilePage.refresh();
        });

        // Manejo de TABS optimizado
        document.querySelectorAll('.sidebar-menu-item').forEach(item => {
            item.onclick = async () => {
                const tab = item.dataset.tab;
                if (tab === ProfilePage.currentTab) return;
                await ProfilePage.switchTab(tab);
            };
        });

        await ProfilePage.bindTabListeners();
    },

    bindTabListeners: async () => {
        i18n.translatePage();

        // 🔍 Buscador de Equipos (Teams)
        const searchInput = document.getElementById('teams-search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                ProfilePage.teamsSearchTerm = e.target.value;
                // Refresco diferido para no saturar si escribe muy rápido (opcional, aquí directo es pequeño)
                clearTimeout(ProfilePage._searchTimeout);
                ProfilePage._searchTimeout = setTimeout(() => {
                    const contentList = document.querySelector('.requests-list');
                    if (contentList) ProfilePage.switchTab('teams', false);
                }, 300);
            };
            searchInput.focus();
            // Puntero al final del texto
            const val = searchInput.value;
            searchInput.value = '';
            searchInput.value = val;
        }

        // 🔗 Navegación a Detalles de Grupo
        document.querySelectorAll('.card-clickable').forEach(card => {
            card.onclick = () => {
                const groupId = card.dataset.groupId;
                if (groupId) {
                    import('../core/router.js').then(({ Router }) => {
                        Router.navigateTo(`/group/${groupId}`);
                    });
                }
            };
        });

        // Controles de Personajes
        const addBtn = document.getElementById('btn-add-char');
        if (addBtn) addBtn.onclick = () => ProfilePage.openCharacterModal();
        
        document.querySelectorAll('.btn-edit-char').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation(); // Evitar navegar al grupo
                const id = e.currentTarget.dataset.id;
                const characters = await API.getMyCharacters();
                const char = characters.find(c => String(c.id) === String(id));
                if (char) ProfilePage.openCharacterModal(char);
            };
        });

        document.querySelectorAll('.btn-delete-char').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation(); // Evitar navegar al grupo
                ProfilePage.deleteCharacter(e.currentTarget.dataset.id);
            };
        });

        // Controles de Solicitudes (Líder)
        document.querySelectorAll('.btn-accept').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation(); // Evitar navegar al grupo
                try {
                    await API.processRequest(btn.dataset.id, 'accepted');
                    await ProfilePage.refresh();
                } catch (err) { await Modal.error(err.message); }
            };
        });

        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation(); // Evitar navegar al grupo
                try {
                    await API.processRequest(btn.dataset.id, 'rejected');
                    await ProfilePage.refresh();
                } catch (err) { await Modal.error(err.message); }
            };
        });

        // Cancelar Solicitud (Aspirante)
        document.querySelectorAll('.btn-cancel-req').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation(); // Evitar navegar al grupo
                if (!await Modal.confirm("¿Cancelar esta solicitud?")) return;
                try {
                    await API.cancelRequest(btn.dataset.id);
                    await ProfilePage.refresh();
                } catch (err) { await Modal.error(err.message); }
            };
        });

        // 🔔 Controles de Notificaciones (Historial)
        document.querySelectorAll('.notif-history-row').forEach(row => {
            row.onclick = async () => {
                const nid = row.dataset.notifId;
                const gid = row.dataset.groupId;
                // Al hacer click en la fila, navegamos y marcamos como leída (NO borramos)
                try {
                    await API.markNotificationAsRead(nid);
                    // Actualizar estado global
                    import('../core/notifications.js').then(({ NotificationSystem }) => {
                        const n = NotificationSystem._notifications.find(nt => String(nt.id) === String(nid));
                        if (n && !n.is_read) {
                            n.is_read = true;
                            NotificationSystem._unreadCount = NotificationSystem._notifications.filter(nt => !nt.is_read).length;
                            NotificationSystem._updateBadge();
                        }
                    });
                } catch(e) {}

                if (gid) {
                    import('../core/router.js').then(({ Router }) => {
                        Router.navigateTo(`/group/${gid}`);
                    });
                } else {
                    await ProfilePage.refresh();
                }
            };
        });

        document.querySelectorAll('.notif-history-dismiss').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const nid = btn.dataset.notifId;
                try {
                    await API.dismissNotification(nid);
                    // Actualizar estado global
                    import('../core/notifications.js').then(({ NotificationSystem }) => {
                        NotificationSystem._notifications = NotificationSystem._notifications.filter(n => String(n.id) !== String(nid));
                        NotificationSystem._unreadCount = NotificationSystem._notifications.filter(n => !n.is_read).length;
                        NotificationSystem._updateBadge();
                    });
                    await ProfilePage.refresh();
                } catch(e) {}
            };
        });
    },

    openCharacterModal: async (char = null) => {
        const lang = i18n.currentLang;
        const classes = ProfilePage.masterClasses || await API.getClasses();
        const isEdit = !!char;

        const modalContent = `
            <form id="form-add-char" class="form-tech-vertical">
                <!-- COMPACT ROW: NAME, GENDER, LEVEL, SERVER -->
                <div class="form-row">
                    <div class="filter-group" style="flex: 3;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="profile.name"></label>
                        <input type="text" id="char-name" class="input-tech" placeholder="Ej: Tristepin" value="${isEdit ? char.name : ''}" required>
                    </div>
                    <div class="filter-group" style="flex: 2;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="profile.gender"></label>
                        <select id="char-gender" class="input-tech">
                            <option value="0" ${isEdit && char.gender === 0 ? 'selected' : ''} data-i18n="profile.male"></option>
                            <option value="1" ${isEdit && char.gender === 1 ? 'selected' : ''} data-i18n="profile.female"></option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1; min-width: 80px; position: relative;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="home.filter_lvl"></label>
                        <input type="number" id="char-level" class="input-tech" min="1" max="245" value="${isEdit ? char.level : '245'}">
                        <small id="level-error" style="display:none; color: #ff4444; font-size: 10px; position: absolute; bottom: -18px; left: 0; white-space: nowrap;" data-i18n="profile.max_level_error"></small>
                    </div>
                    <div class="filter-group" style="flex: 2;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="home.filter_server"></label>
                        <select id="char-server" class="input-tech" style="max-width: 100%;">
                            ${CONFIG.SERVERS.map(s => `<option value="${s}" ${isEdit && char.server === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" style="text-align: center; display: block;" data-i18n="profile.class"></label>
                    <input type="hidden" id="char-class" value="${isEdit ? char.classId : '1'}">
                    
                    <!-- NEW LIST LAYOUT -->
                    <div class="class-selection-list">
                        ${classes.map(c => `
                            <div class="class-card ${(isEdit ? char.classId === c.id : c.id === 1) ? 'selected' : ''}" 
                                 data-id="${c.id}" 
                                 onclick="window.tempSelectClass(this, ${c.id})">
                                <img src="assets/classes/emote/${c.id.toString().padStart(2, '0')}${isEdit ? char.gender : '0'}.png" 
                                     id="class-img-${c.id}"
                                     alt="${c.names[lang]}">
                                <span>${c.names[lang]}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" style="text-align: center; display: block;" data-i18n="profile.main_roles"></label>
                    <div class="roles-selection-visual">
                        ${CONFIG.ROLES.map(role => `
                            <label class="role-option-card">
                                <input type="checkbox" name="roles" value="${role}" ${isEdit && char.roles?.includes(role) ? 'checked' : ''}>
                                <div class="role-content">
                                    <img src="assets/roles/${role}.png" alt="${role}" onerror="this.style.display='none'">
                                    <span data-i18n="roles.${role}"></span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-row" style="justify-content: center; gap: 40px;">
                    <!-- DAMAGE TYPE -->
                    <div class="filter-group" style="flex: 0 1 auto;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="profile.dmg_type"></label>
                        <div class="dmg-grid" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            ${CONFIG.DMG_TYPES.map(type => `
                                <div class="dmg-card ${isEdit && char.dmgType === type ? 'selected' : ''}" onclick="window.toggleSelection(this, 'dmg-type')" data-value="${type}">
                                    <img src="assets/element/${type}.png" onerror="this.style.display='none'">
                                    <span data-i18n="dmg_types.${type}"></span>
                                </div>
                            `).join('')}
                        </div>
                        <input type="hidden" id="char-dmg-type" value="${isEdit ? char.dmgType : ''}">
                    </div>

                    <!-- ELEMENTS (Max 3) -->
                    <div class="filter-group" style="flex: 0 1 auto;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="profile.elements"></label>
                        <div class="elements-grid" id="elements-container" style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            ${CONFIG.ELEMENTS.map(el => {
                                const selected = isEdit && char.elements?.includes(el);
                                return `
                                <div class="element-card ${selected ? 'selected' : ''}" onclick="window.toggleElement(this)" data-value="${el}">
                                    <img src="assets/element/${el}.png" onerror="this.style.display='none'">
                                    <span data-i18n="elements.${el}"></span>
                                </div>
                                `;
                            }).join('')}
                            <!-- Stasis Special -->
                            <div class="element-card special-stasis ${isEdit && char.elements?.includes('stasis') ? 'selected' : ''}" id="stasis-card" style="display: none;" data-value="stasis">
                                <img src="assets/element/stasis.png" onerror="this.style.display='none'">
                                <span data-i18n="elements.stasis"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        Modal.open(i18n.t(isEdit ? "ui.edit" : "profile.add_char"), modalContent, async () => {
            const name = document.getElementById('char-name').value;
            if (!name) { await Modal.info(i18n.t('ui.name_required'), i18n.t('lfg.error_prefix')); return; }
 
            const roles = Array.from(document.querySelectorAll('input[name="roles"]:checked')).map(el => el.value);
            const dmgType = document.getElementById('char-dmg-type').value;
            
            // Collect elements
            const elements = [];
            const stasisCard = document.getElementById('stasis-card');
            if (stasisCard.style.display !== 'none') {
                elements.push('stasis');
            } else {
                document.querySelectorAll('.element-card.selected').forEach(el => elements.push(el.dataset.value));
            }
 
            const charData = {
                name: name,
                server: document.getElementById('char-server').value,
                level: parseInt(document.getElementById('char-level').value),
                classId: parseInt(document.getElementById('char-class').value),
                gender: parseInt(document.getElementById('char-gender').value),
                roles: roles.length > 0 ? roles : ['damage'],
                dmgType: dmgType || 'melee',
                elements: elements.length > 0 ? elements : ['fire']
            };
 
            try {
                if (isEdit) {
                    await API.updateCharacter(char.id, charData);
                } else {
                    await API.createCharacter(charData);
                }
                Modal.close();
                await ProfilePage.refresh();
            } catch (err) {
                await Modal.error(i18n.t('lfg.error_prefix') + err.message);
            }
        });
        
        i18n.translatePage();

        // GENDER SWITCH LOGIC
        document.getElementById('char-gender').addEventListener('change', (e) => {
            const gender = e.target.value; // 0 or 1
            document.querySelectorAll('.class-selection-list img').forEach(img => {
                const card = img.closest('.class-card');
                const classId = card.dataset.id;
                const paddedId = classId.toString().padStart(2, '0');
                img.src = `assets/classes/emote/${paddedId}${gender}.png`;
            });
        });

        // ROLES MAX 2 LOGIC
        const roleInputs = document.querySelectorAll('input[name="roles"]');
        roleInputs.forEach(input => {
            input.addEventListener('change', () => {
                const checked = document.querySelectorAll('input[name="roles"]:checked');
                if (checked.length > 2) {
                    input.checked = false;
                }
            });
        });

        // STEMER LOGIC HOOK
        window.tempSelectClass = (element, id) => {
            ProfilePage.selectClass(element, id);
            
            // Steamer ID = 16
            const stasisCard = document.getElementById('stasis-card');
            const otherElements = document.querySelectorAll('.element-card:not(.special-stasis)');
            
            if (id === 16) {
                stasisCard.style.display = 'flex';
                stasisCard.classList.add('selected');
                otherElements.forEach(el => {
                    el.style.display = 'none';
                    el.classList.remove('selected');
                });
            } else {
                stasisCard.style.display = 'none';
                stasisCard.classList.remove('selected');
                otherElements.forEach(el => el.style.display = 'flex');
            }
        };

        // EXPOSE HELPERS TO WINDOW FOR ONCLICK
        window.toggleSelection = (element, type) => {
            ProfilePage.toggleSelection(element, type);
        };
        window.toggleElement = (element) => {
            ProfilePage.toggleElement(element);
        };

        // LEVEL VALIDATION
        const levelInput = document.getElementById('char-level');
        const levelError = document.getElementById('level-error');
        if (levelInput) {
            levelInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                if (val > 245) {
                    e.target.style.borderColor = '#ff4444';
                    e.target.style.color = '#ff4444';
                    if (levelError) levelError.style.display = 'block';
                } else {
                    e.target.style.borderColor = '';
                    e.target.style.color = '';
                    if (levelError) levelError.style.display = 'none';
                }
            });
        }
    },

    deleteCharacter: async (id) => {
        if (!await Modal.confirm(i18n.t('lfg.confirm_delete_char'), i18n.t('ui.confirm'))) return;
        try {
            await API.deleteCharacter(id);
            await ProfilePage.refresh();
        } catch (err) {
            await Modal.error(i18n.t('lfg.error_prefix') + err.message);
        }
    },

    // UI Helpers
    selectClass: (element, id) => {
        document.getElementById('char-class').value = id;
        document.querySelectorAll('.class-card').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    },

    toggleSelection: (element, type) => {
        const parent = element.parentElement;
        parent.querySelectorAll('.dmg-card').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        document.getElementById('char-dmg-type').value = element.dataset.value;
    },

    toggleElement: (element) => {
        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
        } else {
            const selected = document.querySelectorAll('.element-card.selected').length;
            if (selected < 3) {
                element.classList.add('selected');
            }
        }
    }
};