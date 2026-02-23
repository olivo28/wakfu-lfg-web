import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';
import { CONFIG } from '../config.js';
import { Modal } from './Modal.js';
import { DungeonSelector } from './DungeonSelector.js';
import { CharacterCard } from './CharacterCard.js';

export const LFGModals = {
    openCreateGroupModal: async (preSelectedDungeon = null, editingGroup = null) => {
        const lang = i18n.currentLang;
        const editData = editingGroup ? (editingGroup.data || editingGroup) : null;

        // Obtener personajes del usuario para elegir el leader
        const myCharacters = await API.getMyCharacters();
        if (myCharacters.length === 0) {
            await Modal.info(i18n.t('lfg.char_needed'));
            return;
        }

        let selectedDungeon = preSelectedDungeon || (editingGroup ? { id: editData.dungeonId, name: editData.dungeonName } : null);

        const modalContent = `
            <div class="form-tech-vertical" id="create-group-form">
                <div class="filter-group">
                    <label class="label-tech" data-i18n="dungeons.dungeon">MAZMORRA</label>
                    <div id="create-dungeon-selector"></div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.group_title"></label>
                    <input type="text" id="group-title" class="input-tech" placeholder="${i18n.t('filters.placeholder_group_title')}" autocomplete="off" value="${editData?.title || ''}" maxlength="50">
                </div>

                <div class="form-row">
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="dungeon.stasis"></label>
                        <select id="group-stasis" class="input-tech">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => `
                                <option value="${s}" ${editData?.difficulty?.stasis == s ? 'selected' : ''}>${s}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="home.filter_server">SERVIDOR</label>
                        <select id="group-server" class="input-tech">
                            ${CONFIG.SERVERS.map(s => `
                                <option value="${s}" ${editData?.server == s ? 'selected' : ''}>${s.toUpperCase()}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="dungeon.modulated"></label>
                        <select id="group-modulated" class="input-tech">
                            <option value="false" ${editData?.difficulty?.is_modulated === false ? 'selected' : ''} data-i18n="ui.no"></option>
                            <option value="true" ${editData?.difficulty?.is_modulated === true ? 'selected' : ''} data-i18n="ui.yes"></option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 2;">
                        <label class="label-tech" data-i18n="lfg.leader_title"></label>
                        <div class="custom-select-tech" id="leader-selector-custom">
                            <div class="select-trigger input-tech" id="leader-trigger">
                                <span data-i18n="ui.loading"></span>
                                <i class="arrow-down"></i>
                            </div>
                            <div class="select-options-list hide" id="leader-options">
                                ${myCharacters.map(c => {
                                    const paddedId = String(c.classId || 1).padStart(2, '0');
                                    const gender = String(c.gender || 0);
                                    return `
                                        <div class="custom-option" data-id="${c.id}" data-server="${c.server}">
                                            <img src="assets/classes/emote/${paddedId}${gender}.png" class="emote-mini">
                                            <span>${c.name.toUpperCase()} (Lvl ${c.level})</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            <input type="hidden" id="group-leader" value="${editData?.leaderCharacterId || myCharacters[0].id}">
                        </div>
                    </div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.roles_title"></label>
                    <div class="roles-selection-visual">
                        ${CONFIG.ROLES.map(role => `
                            <label class="role-option-card">
                                <input type="checkbox" name="roles-needed" value="${role}" 
                                    ${editData?.roles_needed?.includes(role) ? 'checked' : ''}>
                                <div class="role-content">
                                    <img src="assets/roles/${role}.png" alt="${role}">
                                    <span data-i18n="roles.${role}"></span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.dmg_title"></label>
                    <div class="dmg-grid">
                        ${CONFIG.DMG_TYPES.map(type => `
                            <div class="dmg-card ${editData?.dmgType === type ? 'selected' : ''}" onclick="window.toggleSelection(this, 'dmg-type')" data-value="${type}">
                                <img src="assets/element/${type}.png">
                                <span data-i18n="dmg_types.${type}"></span>
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="group-dmg-type" value="${editData?.dmgType || ''}">
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.elements_title"></label>
                    <div class="elements-grid">
                        ${CONFIG.ELEMENTS.map(el => `
                            <div class="element-card ${editData?.elements?.includes(el) ? 'selected' : ''}" onclick="window.toggleElement(this)" data-value="${el}">
                                <img src="assets/element/${el}.png">
                                <span data-i18n="elements.${el}"></span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.chat_languages"></label>
                    <div class="roles-selection-visual" style="gap: 10px;">
                        ${['PT', 'ES', 'EN', 'FR'].map(l => {
                            const flags = {
                                'PT': 'https://flagcdn.com/w80/br.png',
                                'ES': 'https://flagcdn.com/w80/es.png',
                                'EN': 'https://flagcdn.com/w80/us.png',
                                'FR': 'https://flagcdn.com/w80/fr.png'
                            };
                            return `
                            <label class="role-option-card">
                                <input type="checkbox" name="chat-langs" value="${l}" 
                                    ${editData?.languages?.includes(l) ? 'checked' : ''}>
                                <div class="role-content" style="padding: 5px 15px; display: flex; align-items: center; gap: 8px;">
                                    <img src="${flags[l]}" alt="${l}" style="width: 16px; border-radius: 2px;">
                                    <span>${l}</span>
                                </div>
                            </label>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="form-row" style="margin-bottom: 20px;">
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="lfg.mission_only"></label>
                        <select id="group-mission-only" class="input-tech" style="border-color: #ffd700;">
                            <option value="false" ${editData?.missionOnly === false ? 'selected' : ''} data-i18n="ui.no"></option>
                            <option value="true" ${editData?.missionOnly === true ? 'selected' : ''} data-i18n="ui.yes"></option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="lfg.requires_mechanics" style="font-size: 8px;"></label>
                        <select id="group-requires-mechanics" class="input-tech" style="border-color: #ff4d4d;">
                            <option value="false" ${editData?.requiresMechanics === false ? 'selected' : ''} data-i18n="ui.no"></option>
                            <option value="true" ${editData?.requiresMechanics === true ? 'selected' : ''} data-i18n="ui.yes"></option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        Modal.open(editingGroup ? i18n.t("lfg.edit_title") : i18n.t("lfg.create_title"), modalContent, async () => {
            if (!selectedDungeon) {
                await Modal.info(i18n.t("lfg.dungeon_req"), i18n.t("lfg.dungeon_req"));
                return;
            }

            const rolesNeeded = Array.from(document.querySelectorAll('input[name="roles-needed"]:checked')).map(el => el.value);
            const leaderId = document.getElementById('group-leader').value;
            const leader = myCharacters.find(c => c.id == leaderId);
            
            const dmgType = document.getElementById('group-dmg-type').value;
            const elements = Array.from(document.querySelectorAll('.element-card.selected')).map(el => el.dataset.value);

            const isModulated = document.getElementById('group-modulated').value === 'true';
            const title = document.getElementById('group-title').value.trim();
            
            const languages = Array.from(document.querySelectorAll('input[name="chat-langs"]:checked')).map(el => el.value);
            const missionOnly = document.getElementById('group-mission-only').value === 'true';
            const requiresMechanics = document.getElementById('group-requires-mechanics').value === 'true';

            // Si estamos editando, preservamos los miembros actuales pero actualizamos al líder
            let finalCharacters = [leader];
            if (editingGroup) {
                const existing = editingGroup.data?.characters || editingGroup.characters || [];
                // Preservamos a todos menos al primero (el líder antiguo)
                finalCharacters = [leader, ...existing.slice(1)];
            }

            const groupData = {
                leaderCharacterId: leader.id,
                dungeonId: selectedDungeon.id,
                dungeonName: selectedDungeon.name,
                title: title,
                level: isModulated ? (selectedDungeon.modulated || selectedDungeon.min_lvl) : selectedDungeon.min_lvl,
                server: document.getElementById('group-server').value,
                difficulty: {
                    stasis: parseInt(document.getElementById('group-stasis').value),
                    is_modulated: isModulated
                },
                entry_req: {
                    key_status: 'FREE' 
                },
                roles_needed: rolesNeeded.length > 0 ? rolesNeeded : ['damage'],
                dmgType: dmgType || 'melee',
                elements: elements.length > 0 ? elements : ['fire'],
                languages: languages.length > 0 ? languages : ['ES'],
                missionOnly: missionOnly,
                requiresMechanics: requiresMechanics,
                characters: finalCharacters,
                maxMembers: selectedDungeon.players || 6,
                capacity: selectedDungeon.players || 6
            };

            try {
                if (editingGroup) {
                    await API.updateGroup(editingGroup.id, groupData);
                } else {
                    await API.createGroup(groupData);
                }
                Modal.close();
                // Optionally redirect or refresh
                if (window.location.hash.includes('finder')) {
                    window.location.reload();
                } else {
                    window.location.hash = '/finder';
                }
            } catch (err) {
                await Modal.error(i18n.t('lfg.error_prefix') + err.message);
            }
        }, "modal-compact");

        // Inicializar el buscador de mazmorras dentro del modal
        DungeonSelector.init('create-dungeon-selector', (dungeon) => {
            selectedDungeon = dungeon;
        }, preSelectedDungeon || (editingGroup ? { id: editData.dungeonId, name: editData.dungeonName } : null)); 

        // Helper logic for toggle selection inside modal
        window.toggleSelection = (element, type) => {
            const parent = element.parentElement;
            parent.querySelectorAll('.dmg-card').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            document.getElementById('group-dmg-type').value = element.dataset.value;
        };

        window.toggleElement = (element) => {
            if (element.classList.contains('selected')) {
                element.classList.remove('selected');
            } else {
                const selected = document.querySelectorAll('.element-card.selected').length;
                if (selected < 3) {
                    element.classList.add('selected');
                }
            }
        };

        // Custom Selector Logic
        const leaderSelect = document.getElementById('leader-selector-custom');
        const leaderTrigger = document.getElementById('leader-trigger');
        const leaderOptions = document.getElementById('leader-options');
        const leaderHidden = document.getElementById('group-leader');
        const groupServerSelect = document.getElementById('group-server');

        const filterLeadersByServer = (server) => {
            const options = leaderOptions.querySelectorAll('.custom-option');
            let firstVisible = null;
            let currentStillVisible = false;

            options.forEach(opt => {
                const charServer = opt.dataset.server;
                const charId = opt.dataset.id;
                const isVisible = String(charServer).toLowerCase() === String(server).toLowerCase();
                
                opt.style.display = isVisible ? 'flex' : 'none';
                
                if (isVisible) {
                    if (!firstVisible) firstVisible = charId;
                    if (String(charId) === String(leaderHidden.value)) currentStillVisible = true;
                }
            });

            // Si el líder actual desaparece, auto-seleccionar el primero visible
            if (!currentStillVisible && firstVisible) {
                leaderHidden.value = firstVisible;
                updateTriggerContent(firstVisible);
            } else if (!firstVisible) {
                // No hay personajes en este servidor
                leaderHidden.value = "";
                leaderTrigger.innerHTML = `<span class="text-error" style="color: #ff4d4d; font-size: 11px;">${i18n.t('profile.no_chars') || 'Sin personajes'}</span><i class="arrow-down"></i>`;
            }
        };

        const updateTriggerContent = (charId) => {
            if (!charId) return;
            // Comparar IDs como string para mayor seguridad
            const char = myCharacters.find(c => String(c.id) === String(charId));
            if (char) {
                const paddedId = String(char.classId || 1).padStart(2, '0');
                const gender = String(char.gender || 0);
                leaderTrigger.innerHTML = `
                    <div class="select-trigger-content">
                        <img src="assets/classes/emote/${paddedId}${gender}.png" class="emote-mini">
                        <span>${char.name.toUpperCase()} (Lvl ${char.level})</span>
                    </div>
                    <i class="arrow-down"></i>
                `;
            }
        };

        groupServerSelect.onchange = () => {
            filterLeadersByServer(groupServerSelect.value);
        };

        leaderTrigger.onclick = (e) => {
            e.stopPropagation();
            leaderSelect.classList.toggle('open');
            leaderOptions.classList.toggle('hide');
        };

        document.querySelectorAll('.custom-option').forEach(opt => {
            opt.onclick = (e) => {
                e.stopPropagation();
                const charId = opt.dataset.id;
                leaderHidden.value = charId;
                updateTriggerContent(charId);
                leaderSelect.classList.remove('open');
                leaderOptions.classList.add('hide');
            };
        });

        window.addEventListener('click', () => {
            leaderSelect.classList.remove('open');
            leaderOptions.classList.add('hide');
        });

        // Set initial state
        filterLeadersByServer(groupServerSelect.value);
        updateTriggerContent(leaderHidden.value);

        i18n.translatePage();
    },

    openJoinModal: async (group, skipToSelection = false, onSuccess = null) => {
        const lang = i18n.currentLang;
        // ... (resto sin cambios significativos hasta el final del Modal.open)
        const data = group.data || group;
        const server = data.server || 'all';
        const dungeonId = data.dungeonId;
        const dungeonName = data.dungeonName || {};
        const members = data.members || [];
        const stasis = data.difficulty ? data.difficulty.stasis : (data.stasis || 1);
        const isModulated = data.difficulty ? data.difficulty.is_modulated : (data.isModulated || false);
        const level = data.level;
        const rolesNeeded = data.roles_needed || data.rolesNeeded || [];
        const groupElements = data.elements || [];
        const groupDmgType = data.dmgType || 'melee';
        const groupTitle = data.title || '';
        const myCharacters = await API.getMyCharacters();
        const dungeons = await API.getDungeons();
        await API.getClasses();

        // Helper para normalizar IDs (quitar comillas, espacios, etc)
        const cleanId = (id) => String(id || '').trim().replace(/^["']|["']$/g, '');
        
        // Obtener solicitudes enviadas por mí para este grupo
        const sentRequests = await API.getSentRequests().catch(() => []);
        console.log('[JoinModal] All sent requests (raw):', sentRequests);

        const pendingForThisGroup = sentRequests.filter(r => {
            const rGroupId = cleanId(r.group_id || r.groupId);
            const targetGroupId = cleanId(group.id);
            const isMatch = rGroupId === targetGroupId && r.status === 'pending';
            return isMatch;
        });
        console.log('[JoinModal] Pending for this group:', pendingForThisGroup);

        const pendingCharIds = new Set(pendingForThisGroup.map(r => cleanId(r.character_id)));
        
        // FAIL-SAFE: Si el backend ya nos envió SU solicitud pendiente en el objeto del grupo
        if (group.userPendingRequest) {
            const uprCharId = cleanId(group.userPendingRequest.character_id || group.userPendingRequest.characterId);
            pendingCharIds.add(uprCharId);
        }

        // Resolve modulated level if needed
        const dungeon = dungeons.find(d => d.id == dungeonId);
        const groupLevel = (isModulated && dungeon && dungeon.modulated) ? dungeon.modulated : data.level;

        // Helper: Recomendación lógica
        const getRecommendationReason = (char) => {
            const reasons = [];
            // 1. Rol
            const hasRole = char.roles.some(r => rolesNeeded.includes(r));
            if (hasRole) reasons.push(i18n.t('roles.title'));
            
            // 2. Elemento
            const hasElement = char.elements.some(e => groupElements.includes(e));
            if (hasElement) reasons.push(i18n.t('profile.elements_short'));

            // 3. Tipo Daño
            if (char.dmgType && Array.isArray(char.dmgType) ? char.dmgType.includes(groupDmgType) : char.dmgType === groupDmgType) reasons.push(i18n.t('profile.dmg_type'));

            return reasons.length > 0 ? reasons.join(', ') : null;
        };

        const renderStep1 = () => `
            <div class="detailed-join-container">
                <div class="group-hero-banner">
                    <img src="assets/mazmos/${dungeonId}.png" class="hero-img" onerror="this.src='assets/backgrounds/default_dungeon.jpg'">
                    <div class="hero-overlay">
                        <div class="hero-main-info">
                            <span class="srv-badge srv-${server.toLowerCase()}">${server.toUpperCase()}</span>
                            ${groupTitle ? `<h3 class="hero-room-title">${groupTitle.toUpperCase()}</h3>` : ''}
                            <h2>${dungeonName[lang] || dungeonName['es'] || '...'}</h2>
                        </div>
                    </div>
                </div>

                <div class="group-detail-body">
                    <div class="detail-column main-side">
                        <h4 class="detail-subtitle" data-i18n="lfg.current_members">${i18n.t('lfg.current_members')}</h4>
                        <div class="member-list-detailed">
                            ${members.map(m => CharacterCard.renderCompact(m, isModulated ? groupLevel : null)).join('')}
                        </div>
                    </div>

                    <div class="detail-column requirements-side">
                        <div class="tech-specs-grid">
                            <div class="spec-item">
                                <label class="label-tech" data-i18n="dungeon.stasis">${i18n.t('dungeon.stasis')}</label>
                                <span class="spec-val stasis-val-${stasis > 5 ? 'high' : stasis > 2 ? 'mid' : 'low'}">${stasis}</span>
                            </div>
                            <div class="spec-item">
                                <label class="label-tech" data-i18n="home.filter_lvl">${i18n.t('home.filter_lvl')}</label>
                                <span class="spec-val">${groupLevel}</span>
                            </div>
                            <div class="spec-item">
                                <label class="label-tech" data-i18n="dungeon.modulated">${i18n.t('dungeon.modulated')}</label>
                                <span class="spec-val">${isModulated ? i18n.t('ui.yes') : i18n.t('ui.no')}</span>
                            </div>
                        </div>

                        <div class="roles-needed-section">
                            <label class="label-tech" data-i18n="lfg.roles_sought">${i18n.t('lfg.roles_sought')}</label>
                            <div class="roles-big-list">
                                ${rolesNeeded.map(role => `
                                    <div class="role-requirement-item">
                                        <img src="assets/roles/${role}.png" class="role-icon-big">
                                        <span data-i18n="roles.${role}">${i18n.t('roles.' + role)}</span>
                                    </div>
                                `).join('')}
                                
                                <div class="tech-spec-row" style="display: flex; gap: 10px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; width: 100%;">
                                    <div class="role-requirement-item">
                                        <img src="assets/element/${groupDmgType}.png" class="role-icon-big">
                                        <span data-i18n="dmg_types.${groupDmgType}">${i18n.t('dmg_types.' + groupDmgType)}</span>
                                    </div>
                                    ${groupElements.map(el => `
                                        <div class="role-requirement-item">
                                            <img src="assets/element/${el}.png" class="role-icon-big">
                                            <span data-i18n="elements.${el}">${i18n.t('elements.' + el)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const renderStep2 = () => {
            // IDs de personajes ya en el grupo
            const memberCharIds = new Set(members.map(m => cleanId(m.id || m.charId)));
            // Solo mostrar personajes que NO están ya en el grupo (sistema Héroes)
            // Y que están en el mismo servidor que el grupo
            const availableChars = myCharacters.filter(c => {
                const isMember = memberCharIds.has(cleanId(c.id));
                const isSameServer = server === 'all' || String(c.server || '').toLowerCase() === String(server).toLowerCase();
                return !isMember && isSameServer;
            });
            console.log(`[JoinModal] Available chars for selection (Server: ${server}):`, availableChars.map(c => `${c.name} (${cleanId(c.id)})`));

            return `
            <div class="char-selection-container">
                <div class="recommendation-banner">
                    <span style="font-size: 20px;">💡</span>
                    <p>${i18n.t('lfg.rec_text')}</p>
                </div>
                
                <div class="char-selection-grid">
                    ${availableChars.length > 0 ? availableChars.map(char => {
                        const recReason = getRecommendationReason(char);
                        const isRecommended = recReason !== null;
                        const hasPending = pendingCharIds.has(cleanId(char.id));
                        if (hasPending) console.log(`[JoinModal] Marking character as PENDING: ${char.name} (${cleanId(char.id)})`);
                        
                        return `
                            <div class="btn-char-select ${isRecommended ? 'recommended' : ''} ${hasPending ? 'request-pending' : ''}" data-id="${char.id}">
                                ${isRecommended && !hasPending ? `<span class="rec-badge" title="${recReason}">[${i18n.t('lfg.recommended')}]</span>` : ''}
                                ${hasPending ? `<span class="pending-badge">${i18n.t('lfg.status_requested')}</span>` : ''}
                                ${CharacterCard.render(char, isModulated ? groupLevel : null)}
                            </div>
                        `;
                    }).join('') : `<div style="text-align:center; color: var(--text-dim); padding: 30px;">${i18n.t('lfg.no_chars_avail')}</div>`}
                </div>
                <input type="hidden" id="selected-char-id" value="">
            </div>
        `;
        };


        const initSelectionHandlers = () => {
            document.querySelectorAll('.btn-char-select').forEach(card => {
                card.onclick = () => {
                    document.querySelectorAll('.btn-char-select').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    document.getElementById('selected-char-id').value = card.dataset.id;
                };
            });
        };

        const initialStep = skipToSelection ? '2' : '1';
        Modal.open(i18n.t("ui.request_join"), initialStep === '2' ? renderStep2() : renderStep1(), async () => {
            const mainBtn = document.getElementById('modal-confirm');
            
            if (mainBtn.dataset.step === '1') {
                document.querySelector('.card-body').innerHTML = renderStep2();
                mainBtn.dataset.step = '2';
                mainBtn.innerText = i18n.t('ui.confirm');
                i18n.translatePage();
                document.querySelector('.card-body').scrollTop = 0;
                initSelectionHandlers();
                return false; 
            } else {
                const charId = document.getElementById('selected-char-id').value;
                if (!charId) {
                    await Modal.info(i18n.t('lfg.char_req'), i18n.t('lfg.char_req'));
                    return false;
                }
                
                try {
                    const requiresMechanics = data.requiresMechanics === true;
                    if (requiresMechanics) {
                        try {
                            const mechData = await API.getMyMechanics();
                            const known = mechData.known_mechanics || [];
                            if (!known.includes(String(dungeonId))) {
                                const confirmMech = await Modal.confirm(i18n.t('lfg.mechanics_prompt_desc'), i18n.t('lfg.mechanics_prompt_title'));
                                if (!confirmMech) return false;
                                await API.saveMechanics(dungeonId);
                            }
                        } catch (e) {
                            console.error('Error checking mechanics:', e);
                        }
                    }

                    await API.joinGroup(group.id, charId);
                    const char = myCharacters.find(c => c.id == charId);
                    await Modal.info(i18n.t('lfg.request_sent', { name: char.name }), i18n.t('lfg.request_sent_title'));
                    Modal.close();
                    if (onSuccess) onSuccess();
                } catch (err) {
                    await Modal.error(i18n.t('lfg.error_prefix') + err.message);
                }
            }
        }, "modal-compact");

        const confirmBtn = document.getElementById('modal-confirm');
        if (confirmBtn) {
            confirmBtn.dataset.step = initialStep;
            confirmBtn.innerText = i18n.t('ui.confirm');
        }

        if (initialStep === '2') {
            initSelectionHandlers();
        }

        i18n.translatePage();
    },

    openEditGroupModal: (group) => {
        LFGModals.openCreateGroupModal(null, group);
    }
};
