import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';
import { CONFIG } from '../config.js';
import { Router } from '../core/router.js';
import { Modal } from './Modal.js';
import { DungeonSelector } from './DungeonSelector.js';
import { CharacterCard } from './CharacterCard.js';

export const LFGModals = {
    openCreateGroupModal: async (preSelectedDungeon = null, editingGroup = null, onSuccess = null) => {
        const lang = i18n.currentLang;
        const editData = editingGroup ? (editingGroup.data || editingGroup) : null;
        const isEditing = !!editingGroup;

        // Obtener personajes del usuario para elegir el leader
        const myCharacters = await API.getMyCharacters();
        if (myCharacters.length === 0) {
            await Modal.info(i18n.t('lfg.char_needed'));
            return;
        }

        let stasisData = null;
        try {
            const res = await fetch(`${CONFIG.BASE_PATH}/assets/data/stasis.json`);
            if (res.ok) stasisData = await res.json();
        } catch(e) { console.error("Could not load stasis logic", e); }

        let selectedDungeon = preSelectedDungeon || (editingGroup ? { id: editData.dungeonId, name: editData.dungeonName } : null);

        const modalContent = `
            <div class="form-tech-vertical" id="create-group-form">
                <div id="modal-inline-error" style="display: none; background: rgba(255, 77, 77, 0.1); border: 1px solid #ff4d4d; color: #ff4d4d; padding: 10px; border-radius: 4px; margin-bottom: 15px; text-align: center; font-weight: bold; transition: all 0.3s ease; width: 100%;"></div>
                <div id="modal-page-1" style="width: 100%;">
                <div class="group-hero-banner" id="create-group-banner" style="margin-bottom: 20px; border-radius: 8px; height: 120px;">
                    <img src="${CONFIG.BASE_PATH}/assets/mazmos/${selectedDungeon?.id || 'default'}.png" class="hero-img" onerror="this.src='${CONFIG.BASE_PATH}/assets/backgrounds/default_dungeon.jpg'">
                </div>
                <div class="form-row" style="align-items: flex-end;">
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="dungeons.dungeon">${i18n.t('dungeons.dungeon')}</label>
                        <div id="create-dungeon-selector"></div>
                    </div>
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="lfg.group_title">${i18n.t('lfg.group_title')}</label>
                        <input type="text" id="group-title" class="input-tech" placeholder="${i18n.t('filters.placeholder_group_title')}" autocomplete="off" value="${editData?.title || ''}" maxlength="50">
                    </div>
                </div>

                <div class="form-row" style="align-items: flex-end;">
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="dungeon.stasis">${i18n.t('dungeon.stasis')}</label>
                        <select id="group-stasis" class="input-tech" style="font-weight: bold;">
                            ${(stasisData?.stasis_levels || [
                                {level: 1, difficulty_key: "stasis.difficulty.easy", color: "#00E5FF"},
                                {level: 2, difficulty_key: "stasis.difficulty.normal", color: "#49FF00"},
                                {level: 3, difficulty_key: "stasis.difficulty.hard", color: "#FFEB3B"},
                                {level: 4, difficulty_key: "stasis.difficulty.hard", color: "#FFEB3B"},
                                {level: 5, difficulty_key: "stasis.difficulty.very_hard", color: "#FFC107"},
                                {level: 6, difficulty_key: "stasis.difficulty.very_hard", color: "#FFC107"},
                                {level: 7, difficulty_key: "stasis.difficulty.very_hard", color: "#FFC107"},
                                {level: 8, difficulty_key: "stasis.difficulty.extreme", color: "#E91E63"},
                                {level: 9, difficulty_key: "stasis.difficulty.extreme", color: "#E91E63"},
                                {level: 10, difficulty_key: "stasis.difficulty.extreme", color: "#E91E63"}
                            ]).map(lv => `
                                <option value="${lv.level}" style="color: ${lv.color}; font-weight: bold; background: #2a2d32;" ${editData?.difficulty?.stasis == lv.level ? 'selected' : ''}>${lv.level} - ${i18n.t(lv.difficulty_key) || lv.difficulty_key}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="dungeon.modulated">${i18n.t('dungeon.modulated')}</label>
                        <select id="group-modulated" class="input-tech">
                            <option value="false" ${editData?.difficulty?.is_modulated === false ? 'selected' : ''} data-i18n="ui.no">${i18n.t('ui.no')}</option>
                            <option value="true" ${editData?.difficulty?.is_modulated === true ? 'selected' : ''} data-i18n="ui.yes">${i18n.t('ui.yes')}</option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="home.filter_server">${i18n.t('home.filter_server')}</label>
                        <select id="group-server" class="input-tech">
                            ${CONFIG.SERVERS.map(s => `
                                <option value="${s}" ${editData?.server == s ? 'selected' : ''}>${s}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row" style="align-items: flex-start; flex-wrap: nowrap; margin-top: 15px;">
                    <div class="filter-group" style="flex: 1; min-width: 250px;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="dungeon.stasis">${i18n.t('dungeon.stasis')} Info</label>
                        <div id="create-group-stasis-info" style="background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 4px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 8px; justify-content: center; height: 100%; min-height: 100px;">
                            <!-- Stasis Info rendered dynamically -->
                        </div>
                    </div>
                    <div class="filter-group" style="flex: 2; display: flex; flex-direction: column; overflow: hidden;">
                        <label class="label-tech" style="text-align: center; display: block;" data-i18n="lfg.leader_title">${i18n.t('lfg.leader_title')}</label>
                        <div id="create-group-leader-grid" class="roles-selection-visual" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; padding-right: 6px; flex: 1; min-height: 0; max-height: calc(140px); overflow-y: auto; overflow-x: hidden; align-content: flex-start;">
                            <!-- Leaders rendered dynamically -->
                        </div>
                    </div>
                </div>

                <div id="footer-page-1" class="card-footer" style="padding: 15px; border-top: 1px solid var(--card-border); display: flex; justify-content: flex-end; gap: 10px; margin: 20px -20px -20px -20px; background: var(--input-bg); border-radius: 0 0 8px 8px; z-index: 10;">
                    <button class="btn" type="button" id="modal-cancel-custom">${i18n.t('ui.cancel')}</button>
                    <button class="btn btn-accent" type="button" id="btn-next-page">${i18n.t('ui.next') || 'Siguiente'}</button>
                </div>
            </div><!-- end modal-page-1 -->

            <div id="modal-page-2" style="display: none; width: 100%;">
                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.roles_title">${i18n.t('lfg.roles_title')}</label>
                    <div class="roles-selection-visual">
                        ${CONFIG.ROLES.map(role => `
                            <label class="role-option-card">
                                <input type="checkbox" name="roles-needed" value="${role}" 
                                    ${editData?.roles_needed?.includes(role) ? 'checked' : ''}>
                                <div class="role-content">
                                    <img src="${CONFIG.BASE_PATH}/assets/roles/${role}.png" alt="${role}">
                                    <span data-i18n="roles.${role}">${i18n.t('roles.' + role)}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.dmg_title">${i18n.t('lfg.dmg_title')}</label>
                    <div class="dmg-grid">
                        ${CONFIG.DMG_TYPES.map(type => `
                            <div class="dmg-card ${editData?.dmgType === type ? 'selected' : ''}" onclick="window.toggleSelection(this, 'dmg-type')" data-value="${type}">
                                <img src="${CONFIG.BASE_PATH}/assets/element/${type}.png">
                                <span data-i18n="dmg_types.${type}">${i18n.t('dmg_types.' + type)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="group-dmg-type" value="${editData?.dmgType || ''}">
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.elements_title">${i18n.t('lfg.elements_title')}</label>
                    <div class="elements-grid">
                        ${CONFIG.ELEMENTS.map(el => `
                            <div class="element-card ${editData?.elements?.includes(el) ? 'selected' : ''}" onclick="window.toggleElement(this)" data-value="${el}">
                                <img src="${CONFIG.BASE_PATH}/assets/element/${el}.png">
                                <span data-i18n="elements.${el}">${i18n.t('elements.' + el)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="filter-group">
                    <label class="label-tech" data-i18n="lfg.chat_languages">${i18n.t('lfg.chat_languages')}</label>
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
                        <label class="label-tech" data-i18n="lfg.mission_only">${i18n.t('lfg.mission_only')}</label>
                        <select id="group-mission-only" class="input-tech" style="border-color: #ffd700;">
                            <option value="false" ${editData?.missionOnly === false ? 'selected' : ''} data-i18n="ui.no">${i18n.t('ui.no')}</option>
                            <option value="true" ${editData?.missionOnly === true ? 'selected' : ''} data-i18n="ui.yes">${i18n.t('ui.yes')}</option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 1;">
                        <label class="label-tech" data-i18n="lfg.requires_mechanics" style="font-size: 8px;">${i18n.t('lfg.requires_mechanics')}</label>
                        <select id="group-requires-mechanics" class="input-tech" style="border-color: #ff4d4d;">
                            <option value="false" ${editData?.requiresMechanics === false ? 'selected' : ''} data-i18n="ui.no">${i18n.t('ui.no')}</option>
                            <option value="true" ${editData?.requiresMechanics === true ? 'selected' : ''} data-i18n="ui.yes">${i18n.t('ui.yes')}</option>
                        </select>
                    </div>
                </div>

                <div id="footer-page-2" class="card-footer" style="padding: 15px; border-top: 1px solid var(--card-border); display: flex; justify-content: flex-end; gap: 10px; margin: 20px -20px -20px -20px; background: var(--input-bg); border-radius: 0 0 8px 8px; z-index: 10;">
                    <button class="btn" type="button" id="btn-prev-page">${i18n.t('ui.back') || 'Atrás'}</button>
                    <button class="btn btn-accent" type="button" id="btn-confirm-create">${editingGroup ? (i18n.t('ui.update') || 'Actualizar') : i18n.t('ui.confirm')}</button>
                </div>
            </div><!-- end modal-page-2 -->
            </div>
        `;

        Modal.open(editingGroup ? i18n.t("lfg.edit_title") : i18n.t("lfg.create_title"), modalContent, null, "");

        let localSelectedLeaderIds = [];
        if (editingGroup) {
            const existingChars = editData?.characters || editingGroup.characters || [];
            localSelectedLeaderIds = existingChars.filter(c => myCharacters.some(mc => mc.id == c.id)).map(c => c.id);
        }

        const rarityColors = {
            'rarity.common': '#FFFFFF',
            'rarity.rare': '#00FF00',
            'rarity.mythical': '#FF8000',
            'rarity.legendary': '#F4D330',
            'rarity.relic': '#B541FF',
            'rarity.souvenir': '#55FFFF',
            'rarity.epic': '#FF00FF'
        };

        const renderLeaders = () => {
            const grid = document.getElementById('create-group-leader-grid');
            if (!grid) return;
            const selectedServer = document.getElementById('group-server').value;
            const filteredChars = selectedServer === 'Todos' ? myCharacters : myCharacters.filter(c => c.server === selectedServer || selectedServer === '');
            
            if (filteredChars.length === 0) {
                grid.innerHTML = `<span style="color: var(--text-dim); font-size: 11px;">No hay personajes en este servidor.</span>`;
                return;
            }

            localSelectedLeaderIds = localSelectedLeaderIds.filter(id => filteredChars.some(c => c.id == id));
            // if (localSelectedLeaderIds.length === 0) {
            //     localSelectedLeaderIds = [filteredChars[0].id];
            // }

            grid.innerHTML = filteredChars.map(c => {
                const paddedId = String(c.classId || 1).padStart(2, '0');
                const gender = String(c.gender || 0);
                const isSelected = localSelectedLeaderIds.some(id => id == c.id);
                const isMainLeader = localSelectedLeaderIds[0] == c.id;
                
                let borderColor = 'var(--card-border)';
                let bgColor = 'transparent';
                if (isMainLeader) {
                    borderColor = 'var(--accent)';
                    bgColor = 'rgba(255,255,255,0.05)';
                } else if (isSelected) {
                    borderColor = '#aaa';
                    bgColor = 'rgba(255,255,255,0.02)';
                }

                return `
                    <label class="role-option-card" style="cursor: pointer; padding: 4px; min-width: 0; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid ${borderColor}; background: ${bgColor}; border-radius: 4px; overflow: visible;">
                        ${isMainLeader ? '<div class="leader-badge" style="position: absolute; top: 0; right: 0; background: var(--accent); color: #000; font-size: 8px; padding: 1px 3px; border-radius: 0 4px 0 4px; font-weight: bold; border-left: 1px solid rgba(0,0,0,0.5); border-bottom: 1px solid rgba(0,0,0,0.5); z-index: 2;">LÍDER</div>' : ''}
                        ${isSelected && !isMainLeader ? '<div class="leader-badge" style="position: absolute; top: 0; right: 0; background: #aaa; color: #000; font-size: 8px; padding: 1px 3px; border-radius: 0 4px 0 4px; font-weight: bold; border-left: 1px solid rgba(0,0,0,0.5); border-bottom: 1px solid rgba(0,0,0,0.5); z-index: 2;">HÉROE</div>' : ''}
                        <input type="checkbox" name="group-leader-checkbox" value="${c.id}" ${isSelected ? 'checked' : ''} style="display: none;">
                        <div class="role-content" style="flex-direction: column; gap: 4px; border: none; padding: 0;">
                            <img src="${CONFIG.BASE_PATH}/assets/classes/emote/${paddedId}${gender}.png" class="emote-mini" style="margin: 0 auto; background: none; border: none;">
                            <span style="font-size: 11px; font-weight: bold; text-align: center;">${c.name}</span>
                            <span style="font-size: 9px; color: var(--text-dim); text-align: center;">Lvl ${c.level}</span>
                        </div>
                    </label>
                `;
            }).join('');

            grid.querySelectorAll('input[name="group-leader-checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const id = e.target.value;
                    if (e.target.checked) {
                        if (selectedServer === 'Rubilax') {
                            if (localSelectedLeaderIds.length >= 3) {
                                e.target.checked = false;
                                return;
                            }
                            localSelectedLeaderIds.push(id);
                        } else {
                            localSelectedLeaderIds = [id];
                        }
                    } else {
                        localSelectedLeaderIds = localSelectedLeaderIds.filter(v => v != id);
                        if (localSelectedLeaderIds.length === 0) {
                            localSelectedLeaderIds = [id];
                            e.target.checked = true;
                        }
                    }
                    renderLeaders();
                });
            });
        };

        const renderStasisInfo = () => {
            const infoBox = document.getElementById('create-group-stasis-info');
            if (!infoBox || !stasisData) return;
            
            const stasisLvl = parseInt(document.getElementById('group-stasis').value) || 1;
            const isModulated = document.getElementById('group-modulated').value === 'true';
            
            const levelData = stasisData.stasis_levels.find(l => l.level === stasisLvl);
            if (!levelData) return;
            
            const stats = levelData.monster_stats;
            const rates = isModulated ? levelData.modulated : levelData.no_modulated;
            
            const rarityImageMap = {
                'rarity.common': 1,
                'rarity.rare': 2,
                'rarity.mythical': 3,
                'rarity.legendary': 4,
                'rarity.relic': 5,
                'rarity.souvenir': 6,
                'rarity.epic': 7
            };

            const keysToRender = [...levelData.loot_rarity_keys];
            let currentDungeonLevel = 0;
            // Attempt to read the dungeon level from the global or local scope object if it exists
            try { currentDungeonLevel = parseInt(selectedDungeon?.min_lvl) || parseInt(selectedDungeon?.level) || 0; } catch(e) {}
            
            if (stasisData.special_rules && currentDungeonLevel >= stasisData.special_rules.legendary_threshold && stasisLvl >= 3) {
                if (!keysToRender.includes(stasisData.special_rules.legendary_key)) {
                    keysToRender.push(stasisData.special_rules.legendary_key);
                }
            }

            keysToRender.sort((a,b) => (rarityImageMap[a] || 0) - (rarityImageMap[b] || 0));

            const newRarityHtml = keysToRender.map(k => `
                <div style="display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(0,0,0,0.3); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
                    <img src="${CONFIG.BASE_PATH}/assets/rarity/${rarityImageMap[k] || 1}.png" style="width: 12px; height: 12px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));">
                    <span style="color: ${rarityColors[k] || '#FFF'}; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.8);">${i18n.t(k) || k}</span>
                </div>
            `).join('');
            
            if (!infoBox.querySelector('#stasis-diff-name')) {
                infoBox.innerHTML = `
                    <div id="stasis-diff-name" style="font-size: 13px; font-weight: bold; color: ${levelData.color || 'var(--accent)'}; text-shadow: 0 0 2px rgba(0,0,0,0.8); border-bottom: 1px solid var(--card-border); padding-bottom: 4px; margin-bottom: 4px; text-align: center; text-transform: uppercase;">
                        ${i18n.t(levelData.difficulty_key) || levelData.difficulty_key}
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Vida:</span>
                        <span id="stasis-diff-hp" style="font-family: var(--font-mono); font-weight: bold; color: ${levelData.color || '#FFF'}; text-shadow: 0 0 1px rgba(0,0,0,0.5);">${stats.hp}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Daño:</span>
                        <span id="stasis-diff-dmg" style="font-family: var(--font-mono); font-weight: bold; color: ${levelData.color || '#FFF'}; text-shadow: 0 0 1px rgba(0,0,0,0.5);">${stats.damage}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
                        <span style="color: var(--text-dim);">Drop/XP:</span>
                        <span id="stasis-diff-xp" style="font-family: var(--font-mono); font-weight: bold; color: ${levelData.color || 'var(--success)'}; text-shadow: 0 0 1px rgba(0,0,0,0.5);">${rates.xp_drop_rate}</span>
                    </div>
                    <div id="stasis-diff-rarities" style="margin-top: 8px; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; font-size: 9px; color: var(--text-dim);">
                        ${newRarityHtml}
                    </div>
                `;
            } else {
                const diffNameEl = infoBox.querySelector('#stasis-diff-name');
                diffNameEl.textContent = i18n.t(levelData.difficulty_key) || levelData.difficulty_key;
                diffNameEl.style.color = levelData.color || 'var(--accent)';

                const hpEl = infoBox.querySelector('#stasis-diff-hp');
                hpEl.textContent = stats.hp;
                hpEl.style.color = levelData.color || '#FFF';

                const dmgEl = infoBox.querySelector('#stasis-diff-dmg');
                dmgEl.textContent = stats.damage;
                dmgEl.style.color = levelData.color || '#FFF';

                const xpEl = infoBox.querySelector('#stasis-diff-xp');
                xpEl.textContent = rates.xp_drop_rate;
                xpEl.style.color = levelData.color || 'var(--success)';

                const raritiesEl = infoBox.querySelector('#stasis-diff-rarities');
                if (raritiesEl.innerHTML !== newRarityHtml) {
                    raritiesEl.innerHTML = newRarityHtml;
                }
            }
            
            const stasisSelect = document.getElementById('group-stasis');
            if (stasisSelect && levelData.color) {
                stasisSelect.style.color = levelData.color;
                stasisSelect.style.textShadow = '0 0 2px rgba(0,0,0,0.8)';
            }
        };

        document.getElementById('group-server').addEventListener('change', renderLeaders);
        document.getElementById('group-stasis').addEventListener('change', renderStasisInfo);
        document.getElementById('group-modulated').addEventListener('change', renderStasisInfo);
        
        renderLeaders();
        renderStasisInfo();

        const showError = (msg) => {
            const errDiv = document.getElementById('modal-inline-error');
            if (errDiv) {
                errDiv.innerHTML = msg;
                errDiv.style.display = 'block';
                setTimeout(() => errDiv.style.display = 'none', 4000);
            }
        };

        document.getElementById('modal-cancel-custom').onclick = () => Modal.close();

        document.getElementById('btn-next-page').onclick = async () => {
            if (!selectedDungeon) {
                showError(i18n.t("lfg.dungeon_req"));
                return;
            }
            document.getElementById('modal-page-1').style.display = 'none';
            document.getElementById('modal-page-2').style.display = 'block';

            const f1 = document.getElementById('footer-page-1');
            const f2 = document.getElementById('footer-page-2');
            if (f1 && f2) {
                f1.style.display = 'none';
                f2.style.display = 'flex';
            }
        };

        document.getElementById('btn-prev-page').onclick = () => {
            document.getElementById('modal-page-2').style.display = 'none';
            document.getElementById('modal-page-1').style.display = 'block';
            
            const f1 = document.getElementById('footer-page-1');
            const f2 = document.getElementById('footer-page-2');
            if (f1 && f2) {
                f2.style.display = 'none';
                f1.style.display = 'flex';
            }
        };

        // Extract footers to outer modal container
        const modalRoot = document.getElementById('create-group-form')?.closest('.modal-content');
        const cardBody = modalRoot?.querySelector('.card-body');
        const f1 = document.getElementById('footer-page-1');
        const f2 = document.getElementById('footer-page-2');

        if (modalRoot && cardBody && f1 && f2) {
            f1.style.margin = '0';
            f2.style.margin = '0';
            f2.style.display = 'none';
            modalRoot.appendChild(f1);
            modalRoot.appendChild(f2);
            cardBody.style.marginBottom = '0';
            cardBody.style.paddingBottom = '20px';
        }

        document.getElementById('btn-confirm-create').onclick = async () => {
            const languages = Array.from(document.querySelectorAll('input[name="chat-langs"]:checked')).map(el => el.value);
            if (languages.length === 0) {
                showError(i18n.t("lfg.chat_lang_req") || "Debes seleccionar al menos un idioma para el chat.");
                return;
            }

            const rolesNeeded = Array.from(document.querySelectorAll('input[name="roles-needed"]:checked')).map(el => el.value);
            
            let leaderId = localSelectedLeaderIds.length > 0 ? localSelectedLeaderIds[0] : (myCharacters[0]?.id || null);
            let leader = myCharacters.find(c => c.id == leaderId);
            
            const dmgType = document.getElementById('group-dmg-type').value;
            const elements = Array.from(document.querySelectorAll('.element-card.selected')).map(el => el.dataset.value);
            const isModulated = document.getElementById('group-modulated').value === 'true';
            const title = document.getElementById('group-title').value.trim();
            const missionOnly = document.getElementById('group-mission-only').value === 'true';
            const requiresMechanics = document.getElementById('group-requires-mechanics').value === 'true';

            let finalCharacters = localSelectedLeaderIds.map(id => myCharacters.find(c => c.id == id)).filter(Boolean);

            if (editingGroup) {
                const originalGroupData = editingGroup.data || editingGroup;
                const myCharIds = new Set(myCharacters.map(c => String(c.id)));
                
                // Keep characters that aren't mine
                const existingOthers = (originalGroupData.members || originalGroupData.characters || []).filter(member => !myCharIds.has(String(member.id)));
                
                if (localSelectedLeaderIds.length === 0) {
                    // I selected no characters. If I am just an admin editing, keep original.
                    leaderId = originalGroupData.leaderCharacterId || (originalGroupData.characters && originalGroupData.characters[0]?.id) || null;
                    leader = { id: leaderId }; // Minimal stub to prevent crash
                } else {
                    if (finalCharacters.length === 0 && leader) finalCharacters = [leader];
                }
                
                finalCharacters = [...finalCharacters, ...existingOthers];
            } else {
                if (finalCharacters.length === 0 && leader) finalCharacters = [leader];
            }

            if (!leaderId) {
                showError(i18n.t("lfg.leader_req") || "Error determinando líder.");
                return;
            }

            const groupData = {
                leaderCharacterId: leader.id || leaderId,
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
                characterIds: finalCharacters.map(c => c.id),
                character_ids: finalCharacters.map(c => c.id),
                maxMembers: selectedDungeon.players || 6,
                capacity: selectedDungeon.players || 6
            };

            try {
                if (editingGroup) {
                    await API.updateGroup(editingGroup.id, groupData);
                    await Modal.info(i18n.t("lfg.group_updated_ok") || "¡Grupo actualizado!");
                } else {
                    const newGroup = await API.createGroup(groupData);
                    await Modal.info(i18n.t("lfg.group_created_ok"));
                }
                Modal.close();
                if (onSuccess) {
                    onSuccess();
                } else {
                    if (window.location.pathname.includes('finder')) {
                        window.location.reload();
                    } else {
                        Router.navigateTo('/');
                    }
                }
            } catch (err) {
                showError((i18n.t('lfg.error_prefix') || 'Error: ') + err.message);
            }
        };

        // Inicializar el buscador de mazmorras dentro del modal
        DungeonSelector.init('create-dungeon-selector', (dungeon) => {
            selectedDungeon = dungeon;
            const bannerImg = document.querySelector('#create-group-banner img');
            if (bannerImg) {
                bannerImg.src = `${CONFIG.BASE_PATH}/assets/mazmos/${dungeon.id}.png`;
            }
            renderStasisInfo();
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
                        <img src="${CONFIG.BASE_PATH}/assets/classes/emote/${paddedId}${gender}.png" class="emote-mini">
                        <span>${char.name} (Lvl ${char.level})</span>
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
        const missionOnly = data.missionOnly === true;
        const requiresMechanics = data.requiresMechanics === true;
        const groupLangs = data.language ? (Array.isArray(data.language) ? data.language : [data.language]) : (data.languages || ['ES', 'EN', 'FR', 'PT']);
        
        const myCharacters = await API.getMyCharacters();
        const dungeons = await API.getDungeons();
        await API.getClasses();

        let stasisData = null;
        try {
            const res = await fetch(`${CONFIG.BASE_PATH}/assets/data/stasis.json`);
            if (res.ok) stasisData = await res.json();
        } catch(e) { console.error("Could not load stasis logic", e); }

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

        const pendingCharIds = new Set();
        pendingForThisGroup.forEach(r => {
            let charIds = r.character_id || r.characterId;
            try { charIds = JSON.parse(charIds); } catch(e) { charIds = [charIds]; }
            charIds.forEach(id => pendingCharIds.add(cleanId(id)));
        });

        // FAIL-SAFE: Si el backend ya nos envió solicitudes pendientes en el objeto del grupo
        if (group.userPendingRequests && group.userPendingRequests.length > 0) {
            group.userPendingRequests.forEach(req => {
                let charIds = req.character_id || req.characterId;
                try { charIds = JSON.parse(charIds); } catch(e) { charIds = [charIds]; }
                charIds.forEach(id => pendingCharIds.add(cleanId(id)));
            });
        } else if (group.userPendingRequest) {
            let charIds = group.userPendingRequest.character_id || group.userPendingRequest.characterId;
            try { charIds = JSON.parse(charIds); } catch(e) { charIds = [charIds]; }
            charIds.forEach(id => pendingCharIds.add(cleanId(id)));
        }

        const isRubilax = String(server).toLowerCase() === 'rubilax';
        const userDataStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
        const user = window.currentUser || (userDataStr ? JSON.parse(userDataStr) : null);
        const myMemberCount = user ? members.filter(mx => String(mx.user_id || mx.userId) === String(user.id)).length : 0;
        
        if (!isRubilax && skipToSelection) {
            // Check Mono Account limits if skipToSelection is triggered directly 
            if (myMemberCount > 0 || pendingCharIds.size > 0) {
                Modal.info(i18n.t('lfg.mono_limit_reached') || 'El modo héroes no está disponible en este servidor. Ya tienes una solicitud o personaje.', i18n.t('app.error'));
                return;
            }
        }

        // Resolve modulated level if needed
        const dungeon = dungeons.find(d => d.id == dungeonId);
        const groupLevel = (isModulated && dungeon && dungeon.modulated) ? dungeon.modulated : data.level;

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

        const stasisHtml = (() => {
            if (!stasisData) return '';
            const levelData = stasisData.stasis_levels.find(l => l.level === parseInt(stasis));
            if (!levelData) return '';
            const stats = levelData.monster_stats;
            const rates = isModulated ? levelData.modulated : levelData.no_modulated;
            
            const rarityImageMap = { 'rarity.common': 1, 'rarity.rare': 2, 'rarity.mythical': 3, 'rarity.legendary': 4, 'rarity.relic': 5, 'rarity.souvenir': 6, 'rarity.epic': 7 };
            const rarityColors = { 'rarity.common': '#FFFFFF', 'rarity.rare': '#00FF00', 'rarity.mythical': '#FF8000', 'rarity.legendary': '#F4D330', 'rarity.relic': '#B541FF', 'rarity.souvenir': '#55FFFF', 'rarity.epic': '#FF00FF' };

            const keysToRender = [...levelData.loot_rarity_keys];
            let currentDungeonLevel = parseInt(dungeon?.min_lvl || dungeon?.level) || 0;
            if (stasisData.special_rules && currentDungeonLevel >= stasisData.special_rules.legendary_threshold && stasis >= 3) {
                if (!keysToRender.includes(stasisData.special_rules.legendary_key)) keysToRender.push(stasisData.special_rules.legendary_key);
            }
            keysToRender.sort((a,b) => (rarityImageMap[a] || 0) - (rarityImageMap[b] || 0));

            const newRarityHtml = keysToRender.map(k => `
                <div style="display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(0,0,0,0.3); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
                    <img src="${CONFIG.BASE_PATH}/assets/rarity/${rarityImageMap[k] || 1}.png" style="width: 12px; height: 12px; filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));">
                    <span style="color: ${rarityColors[k] || '#FFF'}; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.8);">${i18n.t(k) || k}</span>
                </div>
            `).join('');

            return `
                <div style="background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 4px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 8px; justify-content: center; margin-top: 15px;">
                    <div style="font-size: 13px; font-weight: bold; color: ${levelData.color || 'var(--accent)'}; text-shadow: 0 0 2px rgba(0,0,0,0.8); border-bottom: 1px solid var(--card-border); padding-bottom: 4px; margin-bottom: 4px; text-align: center; text-transform: uppercase;">
                        ${i18n.t(levelData.difficulty_key) || levelData.difficulty_key}
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Vida:</span>
                        <span style="font-family: var(--font-mono); font-weight: bold; color: ${levelData.color || '#FFF'}; text-shadow: 0 0 1px rgba(0,0,0,0.5);">${stats.hp}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-dim);">Daño:</span>
                        <span style="font-family: var(--font-mono); font-weight: bold; color: ${levelData.color || '#FFF'}; text-shadow: 0 0 1px rgba(0,0,0,0.5);">${stats.damage}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
                        <span style="color: var(--text-dim);">Drop/XP:</span>
                        <span style="font-family: var(--font-mono); font-weight: bold; color: ${levelData.color || 'var(--success)'}; text-shadow: 0 0 1px rgba(0,0,0,0.5);">${rates.xp_drop_rate}</span>
                    </div>
                    <div style="margin-top: 8px; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; font-size: 9px; color: var(--text-dim);">
                        ${newRarityHtml}
                    </div>
                </div>
            `;
        })();

        const renderStep1 = () => `
                <div class="group-hero-banner" style="height: 160px;">
                    <img src="${CONFIG.BASE_PATH}/assets/mazmos/${dungeonId}.png" class="hero-img" onerror="this.src='${CONFIG.BASE_PATH}/assets/backgrounds/default_dungeon.jpg'">
                    <div class="hero-overlay">
                        <div class="hero-main-info">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span class="srv-badge srv-${server.toLowerCase()}">${server}</span>
                                ${groupTitle ? `<span style="font-size: 14px; font-weight: bold; color: var(--accent); background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 4px; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${groupTitle}</span>` : ''}
                            </div>
                            <h2 style="margin: 0; font-size: 28px;">${dungeonName[lang] || dungeonName['es'] || '...'}</h2>
                        </div>
                    </div>
                </div>

                <div class="group-detail-body">
                    <div class="detail-column main-side">
                        <h4 class="detail-subtitle" data-i18n="lfg.current_members">${i18n.t('lfg.current_members')}</h4>
                        <div class="member-list-detailed" style="margin-bottom: 20px;">
                            ${members.map(m => CharacterCard.renderCompact(m, isModulated ? groupLevel : null)).join('')}
                        </div>

                        <div class="roles-needed-section" style="margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
                            <label class="label-tech" data-i18n="lfg.roles_sought">${i18n.t('lfg.roles_sought')}</label>
                            <div class="roles-big-list" style="justify-content: flex-start;">
                                ${rolesNeeded.map(role => `
                                    <div class="role-requirement-item">
                                        <img src="${CONFIG.BASE_PATH}/assets/roles/${role}.png" class="role-icon-big">
                                        <span data-i18n="roles.${role}">${i18n.t('roles.' + role)}</span>
                                    </div>
                                `).join('')}
                                
                                <div class="tech-spec-row" style="display: flex; gap: 10px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; width: 100%;">
                                    <div class="role-requirement-item">
                                        <img src="${CONFIG.BASE_PATH}/assets/element/${groupDmgType}.png" class="role-icon-big">
                                        <span data-i18n="dmg_types.${groupDmgType}">${i18n.t('dmg_types.' + groupDmgType)}</span>
                                    </div>
                                    ${groupElements.map(el => `
                                        <div class="role-requirement-item">
                                            <img src="${CONFIG.BASE_PATH}/assets/element/${el}.png" class="role-icon-big">
                                            <span data-i18n="elements.${el}">${i18n.t('elements.' + el)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
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
                            
                            <div class="spec-item">
                                <label class="label-tech" data-i18n="lfg.mission_only" style="font-size: 8px;">${i18n.t('lfg.mission_only') || 'Mision'}</label>
                                <span class="spec-val" style="color: ${missionOnly ? '#ffd700' : 'var(--text-dim)'};">${missionOnly ? i18n.t('ui.yes') : i18n.t('ui.no')}</span>
                            </div>
                            <div class="spec-item" style="grid-column: span 2;">
                                <label class="label-tech" data-i18n="lfg.requires_mechanics" style="font-size: 8px;">${i18n.t('lfg.requires_mechanics') || 'Mecanicas'}</label>
                                <span class="spec-val" style="color: ${requiresMechanics ? '#ff4d4d' : 'var(--text-dim)'};">${requiresMechanics ? i18n.t('ui.yes') : i18n.t('ui.no')}</span>
                            </div>
                        </div>

                        <div class="tech-specs-grid" style="margin-top: 15px;">
                            <div class="spec-item" style="grid-column: span 3; text-align: center; border-bottom: none;">
                                <label class="label-tech" data-i18n="lfg.chat_lang">${i18n.t('lfg.chat_lang') || 'Idiomas'}</label>
                                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 8px;">
                                    ${groupLangs.map(l => {
                                        const flags = { 'PT': 'br', 'ES': 'es', 'EN': 'us', 'FR': 'fr' };
                                        return `<img src="https://flagcdn.com/w80/${flags[l] || 'un'}.png" style="width: 20px; border-radius: 2px;" title="${l}">`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        ${stasisHtml}
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
                                <div class="js-selection-badge" style="display: none; position: absolute; top: 10px; right: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 10px; z-index: 10; letter-spacing: 1px;"></div>
                            </div>
                        `;
                    }).join('') : `<div style="text-align:center; color: var(--text-dim); padding: 30px;">${i18n.t('lfg.no_chars_avail')}</div>`}
                </div>
                <input type="hidden" id="selected-char-id" value="">
            </div>
        `;
        };


        const initSelectionHandlers = () => {
            let selectedIds = [];
            const isRubilax = String(server).toLowerCase() === 'rubilax';

            const updateBadges = () => {
                document.querySelectorAll('.btn-char-select').forEach(card => {
                    const id = card.dataset.id;
                    const badgeEl = card.querySelector('.js-selection-badge');
                    if (!badgeEl) return;
                    
                    const selIndex = selectedIds.indexOf(id);
                    if (selIndex === 0) {
                        badgeEl.style.display = 'block';
                        badgeEl.style.background = 'rgba(230, 126, 34, 0.2)';
                        badgeEl.style.color = '#e67e22';
                        badgeEl.style.border = '1px solid rgba(230, 126, 34, 0.4)';
                        badgeEl.innerText = (i18n.t('lfg.main_char') || 'Principal').toUpperCase();
                    } else if (selIndex > 0) {
                        badgeEl.style.display = 'block';
                        badgeEl.style.background = 'rgba(46, 204, 113, 0.2)';
                        badgeEl.style.color = '#2ecc71';
                        badgeEl.style.border = '1px solid rgba(46, 204, 113, 0.4)';
                        badgeEl.innerText = (i18n.t('lfg.hero_char') || 'Héroe').toUpperCase();
                    } else {
                        badgeEl.style.display = 'none';
                    }
                });
            };

            document.querySelectorAll('.btn-char-select').forEach(card => {
                card.onclick = () => {
                    const id = card.dataset.id;
                    if (isRubilax) {
                        if (selectedIds.includes(id)) {
                            selectedIds = selectedIds.filter(v => v !== id);
                            card.classList.remove('selected');
                        } else {
                            if (selectedIds.length >= 3) return; // limit to 3 heroes max
                            selectedIds.push(id);
                            card.classList.add('selected');
                        }
                    } else {
                        document.querySelectorAll('.btn-char-select').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        selectedIds = [id];
                    }
                    document.getElementById('selected-char-id').value = JSON.stringify(selectedIds);
                    updateBadges();
                };
            });
        };

        const initialStep = skipToSelection ? '2' : '1';
        Modal.open(i18n.t("ui.request_join"), initialStep === '2' ? renderStep2() : renderStep1(), async () => {
            const mainBtn = document.getElementById('modal-confirm');
            
            if (mainBtn.dataset.step === '1') {
                if (!isRubilax && (myMemberCount > 0 || pendingCharIds.size > 0)) {
                    await Modal.info(i18n.t('lfg.mono_limit_reached') || 'El modo héroes no está disponible en este servidor. Ya tienes una solicitud o personaje.', i18n.t('app.error'));
                    Modal.close();
                    return false;
                }
                document.querySelector('.card-body').innerHTML = renderStep2();
                mainBtn.dataset.step = '2';
                mainBtn.innerText = i18n.t('ui.confirm');
                i18n.translatePage();
                document.querySelector('.card-body').scrollTop = 0;
                initSelectionHandlers();
                return false; 
            } else {
                let charIds = [];
                try {
                    charIds = JSON.parse(document.getElementById('selected-char-id').value || "[]");
                } catch (e) {
                    const rawVal = document.getElementById('selected-char-id').value;
                    if (rawVal) charIds = [rawVal];
                }

                if (charIds.length === 0) {
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

                    await API.request(`/lfg/${group.id}/join`, {
                        method: 'POST',
                        body: JSON.stringify({ characterId: charIds[0], characterIds: charIds })
                    });
                    const nameList = myCharacters.filter(c => charIds.includes(String(c.id))).map(c => c.name).join(', ');
                    await Modal.info(i18n.t('lfg.request_sent', { name: nameList }), i18n.t('lfg.request_sent_title'));
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
