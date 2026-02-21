import { i18n } from '../core/i18n.js';
import { CONFIG } from '../config.js';
import { Header } from './Header.js';

// Cache de IDs de personajes del usuario (inyectado desde GroupFinderPage)
let _myCharIds = new Set();

export const GroupCard = {
    // Inyectar los IDs de personajes del usuario
    setMyCharIds: (ids) => { _myCharIds = new Set(ids.map(String)); },

    render: (group) => {
        const lang = i18n.currentLang;
        const data = group.data || group;
        
        const stasis = data.difficulty ? data.difficulty.stasis : (data.stasis || 1);
        const isModulated = data.difficulty ? data.difficulty.is_modulated : (data.isModulated || false);
        const keyStatus = data.entry_req ? data.entry_req.key_status : (data.keyStatus || 'FREE');
        const rolesNeeded = data.roles_needed || data.rolesNeeded || [];
        const members = data.members || [];
        const level = data.level;
        const dungeonId = data.dungeonId;
        const server = data.server || 'all';
        const user = Header.getUserFromToken();
        // isLeader: account-level check (leader_id es ID de cuenta)
        const isLeader = user && (
            String(user.id) === String(group.leader_id) ||
            String(user.id) === String(data.leader_id)
        );
        // Sistema Héroes: cualquier cuenta puede tener varios pjs en el mismo grupo.
        // Ocultamos Join SOLO si TODOS los pjs del usuario ya están en el grupo.
        const getMemberId = m => String(m.id || m.charId || m.char_id || '');
        const memberCharIds = new Set(members.map(getMemberId).filter(id => id && id !== 'undefined'));
        const myAvailableChars = _myCharIds.size > 0
            ? [..._myCharIds].filter(id => !memberCharIds.has(id))
            : null;
        // null = char IDs no cargados => mostrar botón por defecto
        // [] vacío = todos sus pjs ya están en el grupo => ocultar botón
        const canJoin = myAvailableChars === null || myAvailableChars.length > 0;
        console.debug('[GroupCard] group:', group.id, '| memberCharIds:', [...memberCharIds], '| _myCharIds:', [..._myCharIds], '| canJoin:', canJoin);
        
        const stasisClass = stasis > 5 ? 'stasis-high' : stasis > 2 ? 'stasis-mid' : 'stasis-low';

        return `
            <div class="group-card-clean hover-tilt" style="cursor: pointer;" onclick="window.location.hash = '#/group/${group.id}'">
                ${isLeader ? `<button class="btn-edit-tech" data-id="${group.id}" title="${i18n.t('lfg.edit_title')}" onclick="event.stopPropagation();">✏️</button>` : ''}
                <div class="banner-pure">
                    <img src="assets/mazmos/${dungeonId}.png" class="img-full" onerror="this.src='assets/backgrounds/default_dungeon.jpg'">
                </div>
                <div class="info-tech-box">
                    <div class="tech-header">
                        <span class="srv-label">${server.toUpperCase()}</span>
                        <div class="stasis-tag ${stasisClass}">
                            <span>${i18n.t('dungeon.stasis')}: ${stasis}</span>
                        </div>
                    </div>

                    <!-- Nombre y Nivel -->
                    <div class="tech-main">
                        <div class="dung-title-row">
                            <span class="room-title-text">${data.title || (data.dungeonName ? (data.dungeonName[lang] || data.dungeonName['es']) : '...')}</span>
                            <span class="dung-name-text">${data.title ? (data.dungeonName ? (data.dungeonName[lang] || data.dungeonName['es']) : '...') : '&nbsp;'}</span>
                        </div>
                        <span class="lvl-text">${i18n.t('profile.level_short')} ${level}</span>
                    </div>

                    <!-- Miembros -->
                    <div class="tech-members-row">
                        <div class="tech-members centered-members">
                            <div class="members-tech-container">
                                ${members.map(m => {
                                    if (!m) return '';
                                    const paddedId = String(m.classId || 1).padStart(2, '0');
                                    const gender = String(m.gender || 0);
                                    return `
                                        <div class="member-unit-mini">
                                            <img src="assets/classes/emote/${paddedId}${gender}.png" class="emote-mini" title="${m.name || '...'}">
                                            <span class="member-name-tag">${m.name}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        <span class="count-text">${members.length}/${data.capacity || 6}</span>
                    </div>
 
                    <!-- Roles y Requisitos -->
                    <div class="tech-footer">
                        <div class="roles-mini-list">
                            ${rolesNeeded.map(role => `
                                <img src="assets/roles/${role}.png" 
                                     class="role-icon-tech" 
                                     title="${i18n.t('roles.' + role)}"
                                     onerror="this.style.display='none'">
                            `).join('')}
                        </div>
                        <div class="status-chips-tech">
                            <img src="assets/element/${data.dmgType || 'melee'}.png" class="element-icon-tech" title="${i18n.t('dmg_types.' + (data.dmgType || 'melee'))}">
                            <div class="elements-mini-list">
                                ${(data.elements || []).map(el => `<img src="assets/element/${el}.png" class="element-icon-tech" title="${i18n.t('elements.' + el)}">`).join('')}
                            </div>
                            ${isModulated ? `<span class="chip-mod-tech">M</span>` : ''}
                            <span class="chip-key-tech ${keyStatus === 'FREE' ? 'free' : 'paid'}">
                                ${keyStatus === 'FREE' ? i18n.t('ui.free').toUpperCase() : i18n.t('ui.key').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                ${canJoin ? `<button class="btn-join-tech" data-id="${group.id}" data-i18n="ui.request_join" onclick="event.stopPropagation();"></button>` : ''}
            </div>
        `;
    }
};