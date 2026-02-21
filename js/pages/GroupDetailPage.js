import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';
import { Header } from '../components/Header.js';
import { Router } from '../core/router.js';
import { LFGModals } from '../components/LFGModals.js';
import { Modal } from '../components/Modal.js';
import { Socket } from '../core/Socket.js';

export const GroupDetailPage = {
    group: null,

    getSEOData: async () => {
        const group = GroupDetailPage.group;
        if (!group) return {};

        const data = group.data || group;
        const lang = i18n.currentLang;
        const dung = GroupDetailPage.dungeons?.find(d => d.id == data.dungeonId);
        const dungeonName = dung?.name?.[lang] || dung?.name?.['es'] || data.dungeonName?.[lang] || '...';
        const title = data.title || dungeonName;
        const members = data.members || [];
        const leaderChar = members.find(m => String(m.id) === String(data.leaderCharacterId));
        const leaderName = leaderChar?.name || group.creator_name || '...';

        return {
            title: `${title.toUpperCase()} (${dungeonName}) | Wakfu LFG`,
            description: i18n.t('lfg.seo_desc', { 
                dungeon: dungeonName, 
                level: data.level || '?', 
                leader: leaderName 
            }),
            image: `https://wakfutracker.com/assets/mazmos/${data.dungeonId}.png`
        };
    },

    render: async () => {
        const groupId = Router.params.id;
        if (!groupId) return `<div class="error-state">${i18n.t('lfg.error_no_group_id')}</div>`;

        try {
            const [groupRes, classes, dungeons] = await Promise.all([
                API.getGroup(groupId),
                API.getClasses(),
                API.getDungeons()
            ]);
            GroupDetailPage.group = groupRes;
            GroupDetailPage.classes = classes;
            GroupDetailPage.dungeons = dungeons;

            // Cargar solicitudes pendientes si el usuario es líder
            const user = Header.getUserFromToken();
            const isLeaderCheck = user && String(user.id) === String(groupRes.leader_id);
            if (isLeaderCheck) {
                const allRequests = await API.getReceivedRequests().catch(() => []);
                GroupDetailPage.pendingRequests = Array.isArray(allRequests)
                    ? allRequests.filter(r => (String(r.groupId || r.group_id) === String(groupId)) && r.status === 'pending')
                    : [];
                console.debug('[GroupDetailPage] Leader detected. Pending requests:', GroupDetailPage.pendingRequests, 'from total:', allRequests.length);
            } else {
                GroupDetailPage.pendingRequests = [];
            }
        } catch (e) {
            return `<div class="error-state">${i18n.t('lfg.error_load_group', { error: e.message })}</div>`;
        }

        const group = GroupDetailPage.group;
        const classes = GroupDetailPage.classes;
        const dungeons = GroupDetailPage.dungeons;
        const pendingRequests = GroupDetailPage.pendingRequests || [];
        const data = group.data || group;
        const members = data.members || [];
        const user = Header.getUserFromToken();
        const isLeader = user && (
            String(user.id) === String(group.leader_id) || 
            String(user.id) === String(data.leader_id)
        );
        const lang = i18n.currentLang;

        // Buscar info de mazmorra
        const dungInfo = dungeons.find(d => d.id == data.dungeonId);
        const dungeonName = dungInfo?.name?.[lang] || dungInfo?.name?.['es'] || data.dungeonName?.[lang] || '...';
        
        // Datos de dificultad
        const stasis = data.difficulty?.stasis || 1;
        const isModulated = data.difficulty?.is_modulated || false;
        const levelDisplay = isModulated && dungInfo ? dungInfo.modulated : (data.level || dungInfo?.min_lvl || '???');

        const getBodyAsset = (m) => {
            const charClass = classes.find(c => c.id == m.classId);
            if (!charClass) return 'assets/classes/body/iop_m.png';
            return m.gender == 1 ? charClass.assets.female.body : charClass.assets.male.body;
        };

        return `
            <div class="group-detail-container">
                <header class="detail-header">
                    <div class="header-banner">
                        <img src="assets/mazmos/${data.dungeonId}.png" class="banner-img-tech" onerror="this.src='assets/backgrounds/default_dungeon.jpg'">
                        <div class="header-overlay">
                            <h1 class="label-tech">${(data.title || dungeonName).toUpperCase()}</h1>
                            <p class="text-dim">${dungeonName} — ${i18n.t('profile.level_short')} ${levelDisplay} ${isModulated ? `(${i18n.t('dungeon.modulated')})` : ''}</p>
                        </div>
                    </div>
                </header>

                <div class="detail-grid">
                    <!-- MIEMBROS - COLUMNA IZQUIERDA -->
                    <section class="detail-section members-section">
                        <h3 class="label-tech section-title">${i18n.t('lfg.team_actual', { current: members.length, total: dungInfo?.players || 6 })}</h3>
                        <div class="full-body-team">
                            ${members.map(m => `
                                <div class="full-body-member">
                                    <div class="char-render-container">
                                        <img src="${getBodyAsset(m)}" class="ak-breed-render ak-breed-direction-0">
                                    </div>
                                    <div class="char-info-box">
                                        <span class="char-name">${m.name}</span>
                                        <div class="char-details-mini">
                                            <span class="mini-lvl">${i18n.t('profile.level_short')} ${m.level || 0} ${isModulated && dungInfo ? `[${dungInfo.modulated}]` : ''}</span>
                                        </div>
                                        <div class="char-stats-row">
                                            <div class="roles-chips-container">
                                                ${(m.roles || []).map(r => `<img src="assets/roles/${r}.png" class="role-icon-mini" title="${r}">`).join('')}
                                            </div>
                                            <div class="elements-chips-container">
                                                ${(m.elements || []).map(e => `<img src="assets/element/${e}.png" class="element-icon-mini" title="${e}">`).join('')}
                                                ${m.dmgType ? `<img src="assets/element/${m.dmgType}.png" class="element-icon-mini" title="${m.dmgType}">` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    ${(() => {
                                        const isMyChar = user && String(m.user_id || m.userId) === String(user.id);
                                        const isLeaderChar = String(m.id) === String(group.data.leaderCharacterId);
                                        let badge = '';
                                        if (isLeaderChar) {
                                            badge = `<span class="leader-crown-badge" title="${i18n.t('lfg.leader')}">👑</span>`;
                                        }
                                        
                                        // Leader char leaving = leadership transfer button
                                        if (isMyChar && isLeaderChar) {
                                            return badge + `
                                                <button class="btn-kick-member btn-leave-member" data-id="${m.id}" title="${i18n.t('lfg.leader_leave')}">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                                </button>
                                            `;
                                        } else if (isMyChar && !isLeaderChar) {
                                            return badge + `
                                                <button class="btn-kick-member btn-leave-member" data-id="${m.id}" title="${i18n.t('ui.leave')}">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                                </button>
                                            `;
                                        } else if (isLeader && !isLeaderChar) {
                                            return badge + `
                                                <button class="btn-kick-member" data-id="${m.id}" title="${i18n.t('ui.remove')}">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            `;
                                        }
                                        return badge;
                                    })()}
                                </div>
                            `).join('')}

                            ${Array(Math.max(0, (dungInfo?.players || 6) - members.length)).fill(0).map(() => `
                                <div class="full-body-member empty-slot">
                                    <div class="slot-placeholder">?</div>
                                    <span class="char-name-dim">${i18n.t('lfg.slot_empty')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </section>

                    <!-- INFO Y GESTIÓN - COLUMNA DERECHA -->
                    <aside class="detail-aside">
                        <div class="info-card-tech">
                            <h3 class="label-tech">${i18n.t('lfg.req_info')}</h3>
                            
                            <div class="info-row">
                                <span class="info-label">${i18n.t('lfg.leader').toUpperCase()}:</span>
                                <span class="info-val">${group.creator_name || '...'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${i18n.t('ui.server').toUpperCase()}:</span>
                                <span class="info-val">${(data.server || 'all').toUpperCase()}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${i18n.t('dungeon.stasis').toUpperCase()}:</span>
                                <span class="info-val">S${stasis}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${i18n.t('dungeon.modulated').toUpperCase()}:</span>
                                <span class="info-val">${isModulated ? i18n.t('ui.yes') : i18n.t('ui.no')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">${i18n.t('ui.level').toUpperCase()} REQ:</span>
                                <span class="info-val">${levelDisplay}</span>
                            </div>

                            <hr class="divider-tech">
                            
                            <h4 class="label-tech mini-label">${i18n.t('lfg.roles_title')}</h4>
                            <div class="roles-flex">
                                ${(data.roles_needed || data.rolesNeeded || []).map(r => `
                                    <img src="assets/roles/${r}.png" class="role-icon-detail" title="${i18n.t('roles.' + r)}">
                                `).join('')}
                            </div>

                            ${(data.dmgType || (data.elements || []).length > 0) ? `
                            <div class="dmg-elements-row">
                                ${data.dmgType ? `
                                <div class="dmg-el-col">
                                    <span class="mini-col-label">${i18n.t('lfg.dmg_title')}</span>
                                    <div class="roles-flex">
                                        <img src="assets/element/${data.dmgType}.png" class="role-icon-detail" title="${i18n.t('dmg_types.' + data.dmgType)}">
                                    </div>
                                </div>` : ''}
                                ${data.dmgType && (data.elements || []).length > 0 ? '<div class="col-sep"></div>' : ''}
                                ${(data.elements || []).length > 0 ? `
                                <div class="dmg-el-col">
                                    <span class="mini-col-label">${i18n.t('lfg.elements_title')}</span>
                                    <div class="roles-flex">
                                        ${(data.elements || []).map(el => `
                                            <img src="assets/element/${el}.png" class="role-icon-detail" title="${i18n.t('elements.' + el)}">
                                        `).join('')}
                                    </div>
                                </div>` : ''}
                            </div>` : ''}
                        </div>

                        <!-- ACCIONES DE LÍDER (Aprobar/Cerrar) -->
                        ${isLeader ? `
                            <div class="leader-panel-tech">
                                <h3 class="label-tech">${i18n.t('lfg.req_pending')}</h3>
                                <div class="requests-stack-mini">
                                    ${pendingRequests.length > 0 ? pendingRequests.map(req => {
                                        const ch = req.requesterCharacter || req.character || req;
                                        const classId = String(ch.classId || ch.class_id || 1).padStart(2, '0');
                                        const gender = ch.gender || 0;
                                        const isMyOwnRequest = String(req.requester_id || req.requesterId) === String(user.id);
                                        return `
                                        <div class="mini-req-item ${isMyOwnRequest ? 'own-request' : ''}">
                                            <img src="assets/classes/emote/${classId}${gender}.png" class="emote-mini">
                                            <div class="mini-req-info">
                                                <span class="mini-name">${ch.name || '???'} ${isMyOwnRequest ? `<small>(${i18n.t('ui.me')})</small>` : ''}</span>
                                                <span class="mini-lvl">${i18n.t('profile.level_short')} ${ch.level || '?'}</span>
                                            </div>
                                            <div class="mini-req-actions">
                                                <button class="btn-action btn-accept-inline" data-id="${req.id}" title="${i18n.t('lfg.accept')}">&#10003;</button>
                                                <button class="btn-action btn-reject-inline" data-id="${req.id}" title="${i18n.t('lfg.reject')}">&#10005;</button>
                                            </div>
                                        </div>
                                    `}).join('') : `<p class="text-dim-mini">${i18n.t('lfg.req_none')}</p>`}
                                </div>
                                ${group.is_active !== false ? `
                                <div class="action-panel-tech leader-actions" style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                                    <button class="btn btn-block btn-finish-group" style="font-size: 11px;">
                                        ${(i18n.t('lfg.finish_group')).toUpperCase()}
                                    </button>
                                </div>
                                ` : `
                                <div class="status-badge-closed" style="text-align: center; color: var(--text-dim); padding: 10px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; margin-top: 15px;">
                                    ${(i18n.t('lfg.group_finished')).toUpperCase()}
                                </div>
                                `}
                            </div>
                        ` : ''}

                        <!-- SOLICITUDES ENVIADAS (Solo no-líderes, ya que el líder se ve en la cola de arriba) -->
                        ${(!isLeader && group.userPendingRequests && group.userPendingRequests.length > 0) ? `
                            <div class="leader-panel-tech">
                                <h3 class="label-tech" data-i18n="lfg.sent_requests">${(i18n.t('lfg.sent_requests')).toUpperCase()}</h3>
                                <div class="requests-stack-mini">
                                    ${group.userPendingRequests.map(req => {
                                        const ch = req.requesterCharacter || req.character || req;
                                        const classId = String(ch.classId || ch.class_id || 1).padStart(2, '0');
                                        const gender = ch.gender || 0;
                                        return `
                                        <div class="mini-req-item">
                                            <img src="assets/classes/emote/${classId}${gender}.png" class="emote-mini">
                                            <div class="mini-req-info">
                                                <span class="mini-name">${ch.name || '???'}</span>
                                                <span class="mini-lvl" data-i18n="lfg.status_pending">${i18n.t('lfg.status_pending').toUpperCase()}</span>
                                            </div>
                                            <div class="mini-req-actions">
                                                <button class="btn-action btn-cancel-request" data-id="${req.id}" title="${i18n.t('ui.cancel')}">
                                                    &#10005;
                                                </button>
                                            </div>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- BOTÓN DE UNIRSE (Visible para todos si hay hueco) -->
                        ${members.length < (dungInfo?.players || 6) ? `
                            <div class="action-panel-tech" style="margin-top: ${isLeader || (group.userPendingRequests?.length > 0) ? '10px' : '0'}">
                                <button class="btn btn-accent btn-block btn-join-detail" data-id="${group.id}">
                                    ${i18n.t('ui.request_join').toUpperCase()}
                                </button>
                            </div>
                        ` : ''}
                    </aside>
                </div>
            </div>
        `;
    },

    refresh: async () => {
        if (Router.currentPath !== '/group') return;
        const app = document.getElementById('app');
        if (!app) return;
        try {
            const html = await GroupDetailPage.render();
            app.innerHTML = html;
            await GroupDetailPage.afterRender();
        } catch (e) {
            console.error('[GroupDetail] Refresh error:', e);
        }
    },

    afterRender: async () => {
        const groupId = Router.params.id;
        console.log("🛠️ [GroupDetail] API.deleteGroup status:", typeof API.deleteGroup);
        if (groupId) {
            Socket.joinGroup(groupId);
            
            // Listener para refrescar cuando el servidor avise de cambios en este grupo
            Socket.off('group_update'); // Evitar duplicidad
            Socket.on('group_update', async (data) => {
                console.log("🔄 [GroupDetail] Cambio detectado via Socket:", data.type);
                if (data.type === 'group_closed') {
                    console.log("🚪 [GroupDetail] Grupo cerrado, redirigiendo...");
                    Router.navigateTo('/finder');
                    return;
                }
                await GroupDetailPage.refresh();
            });

            // Listener específico para el aspirante (si su solicitud fue procesada)
            Socket.off('request_processed');
            Socket.on('request_processed', async (data) => {
                if (String(data.groupId) === String(groupId)) {
                    console.log("🎯 [GroupDetail] Tu solicitud ha sido procesada:", data.status);
                    await GroupDetailPage.refresh();
                }
            });
        }

        // Event listeners here
        document.querySelectorAll('.btn-accept-inline').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                try {
                    await API.processRequest(id, 'accepted');
                    await GroupDetailPage.refresh();
                } catch (err) { await Modal.error(err.message); }
            };
        });

        document.querySelectorAll('.btn-reject-inline').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                try {
                    await API.processRequest(id, 'rejected');
                    await GroupDetailPage.refresh();
                } catch (err) { await Modal.error(err.message); }
            };
        });

        document.querySelector('.btn-join-detail')?.addEventListener('click', () => {
            LFGModals.openJoinModal(GroupDetailPage.group, true, () => GroupDetailPage.refresh());
        });

        document.querySelectorAll('.btn-cancel-request').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (!await Modal.confirm(i18n.t('lfg.confirm_cancel'))) return;
                try {
                    await API.cancelRequest(id);
                    await GroupDetailPage.refresh();
                } catch (err) { await Modal.error(err.message); }
            });
        });

        document.querySelectorAll('.btn-kick-member').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const charId = btn.dataset.id;
                const char = GroupDetailPage.group.data.members.find(m => String(m.id) === String(charId));
                const isLeave = btn.classList.contains('btn-leave-member');
                const isLeaderChar = String(charId) === String(GroupDetailPage.group.data?.leaderCharacterId);
                const isLastMember = (GroupDetailPage.group.data.members?.length || 0) <= 1;

                let confirmMsg;
                if (isLeave && isLeaderChar) {
                    confirmMsg = isLastMember
                        ? i18n.t('lfg.confirm_leader_leave_close')
                        : i18n.t('lfg.confirm_leader_leave', { name: char?.name });
                } else if (isLeave) {
                    confirmMsg = i18n.t('lfg.confirm_leave', { name: char?.name });
                } else {
                    confirmMsg = i18n.t('lfg.confirm_kick', { name: char?.name });
                }
                
                if (!await Modal.confirm(confirmMsg)) return;
                
                try {
                    const res = await API.removeMember(GroupDetailPage.group.id, charId);
                    if (res?.groupClosed) {
                        Router.navigateTo('/finder');
                    } else {
                        await GroupDetailPage.refresh();
                    }
                } catch (err) {
                    await Modal.error(err.message);
                }
            };
        });

        document.querySelector('.btn-finish-group')?.addEventListener('click', async () => {
            if (!await Modal.confirm(i18n.t('lfg.confirm_finish'))) return;
            try {
                await API.deleteGroup(GroupDetailPage.group.id, true);
                // Al cerrar el grupo, Router detectará el group_closed via socket o simplemente redirigimos
                Router.navigateTo('/finder');
                await Modal.info(i18n.t('lfg.group_closed_ok'));
            } catch (err) { await Modal.error(err.message); }
        });
    }
};
