import { CONFIG } from '../config.js';
import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';
import { GroupCard } from '../components/GroupCard.js';
import { Header } from '../components/Header.js';
import { Router } from '../core/router.js';

export const GroupFinderPage = {
    allGroups: [],
    selectedDungeon: null,
    myCharIds: new Set(),
    
    getSEOData: () => {
        const dung = GroupFinderPage.selectedDungeon;
        const lang = i18n.currentLang;
        const baseTitle = i18n.t('home.title');
        
        if (dung) {
            const dName = dung.name[lang] || dung.name['es'];
            return {
                title: `${dName} - ${baseTitle} | ${i18n.t('ui.brand')}`,
                description: i18n.t('lfg.seo_desc', { 
                    dungeon: dName, 
                    level: dung.min_lvl, 
                    leader: 'Wakfu' 
                }),
                image: `${window.location.href.split('#')[0]}assets/mazmos/${dung.id}.png`
            };
        }

        return {
            title: `${baseTitle} | ${i18n.t('ui.brand')}`,
            description: i18n.t('home.subtitle') || 'Busca y únete a grupos para mazmorras en Wakfu.'
        };
    },

    render: async () => {
        return `
            <div class="page-container finder-page-layout fade-in">
                <!-- Sidebar de Filtros -->
                <aside class="finder-sidebar">
                    <div class="sidebar-header">
                        <h2 data-i18n="home.title">Explorador</h2>
                        <p class="text-dim-mini" data-i18n="home.subtitle"></p>
                    </div>
                    
                    <div class="filter-group">
                        <label class="label-tech" data-i18n="home.filter_server"></label>
                        <select id="filter-server" class="input-tech">
                            <option value="all" data-i18n="ui.all"></option>
                            ${CONFIG.SERVERS.map(srv => `<option value="${srv}">${srv.toUpperCase()}</option>`).join('')}
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="filters.search"></label>
                        <input type="text" id="group-search" class="input-tech" placeholder="${i18n.t('filters.placeholder_group_search')}" autocomplete="off">
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="home.filter_lvl">NIVEL</label>
                        <select id="filter-level" class="input-tech">
                            <option value="all" data-i18n="ui.any"></option>
                            ${CONFIG.LEVEL_BRACKETS.map(b => `<option value="${b.min}">${b.min} - ${b.max}</option>`).join('')}
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="filters.membership">ESTADO</label>
                        <select id="filter-membership" class="input-tech">
                            <option value="all" data-i18n="ui.all"></option>
                            <option value="joined" data-i18n="filters.with_groups"></option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="filters.type">TIPO</label>
                        <select id="filter-type" class="input-tech">
                            <option value="all" data-i18n="ui.all"></option>
                            <option value="dungeon" data-i18n="dungeons.dungeon"></option>
                            <option value="breach" data-i18n="dungeons.breach"></option>
                        </select>
                    </div>

                    <div class="filter-group search-dungeon">
                        <label class="label-tech" data-i18n="dungeons.dungeon">MAZMORRA</label>
                        <div id="main-dungeon-selector"></div>
                        <div id="selected-dungeon-badge" class="selected-dung-badge hide"></div>
                    </div>

                    <div class="sidebar-footer" style="margin-top: auto; padding-top: 20px;">
                        <button class="btn btn-accent btn-block" id="btn-create-group">
                            <span data-i18n="home.btn_create_group"></span>
                        </button>
                    </div>
                </aside>

                <!-- Contenido Principal -->
                <main class="finder-main-content">
                    <div id="groups-list" class="groups-grid">
                        <div class="initial-loader">
                            <div class="wakfu-spinner"></div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    },

    afterRender: async () => {
        const listContainer = document.getElementById('groups-list');
        const filterLevel = document.getElementById('filter-level');
        const filterServer = document.getElementById('filter-server');
        const searchInput = document.getElementById('group-search');

        // Check for 'dungeon' param in URL
        const getHashParam = (param) => {
            const hash = window.location.hash;
            if (hash.includes('?')) {
                const params = new URLSearchParams(hash.split('?')[1]);
                return params.get(param);
            }
            return null;
        };

        const preSelectedDungeonId = getHashParam('dungeon');

        // Reset state strictly
        if (!preSelectedDungeonId) {
            GroupFinderPage.selectedDungeon = null;
        }

        const fetchGroups = async () => {
            try {
                const [response, dungeons, myChars] = await Promise.all([
                    API.getGroups(),
                    API.getDungeons(),
                    Header.getUserFromToken() ? API.getMyCharacters().catch(() => []) : Promise.resolve([])
                ]);

                // Guardar IDs de personajes del usuario para checks de membresía
                GroupFinderPage.myCharIds = new Set(myChars.map(c => String(c.id)));
                // Inyectar en GroupCard para que render() pueda usarlos sin import circular
                GroupCard.setMyCharIds(myChars.map(c => c.id));

                const rawGroups = Array.isArray(response) ? response : (response.groups || []);
                
                // Corregir niveles modulados dinámicamente
                GroupFinderPage.allGroups = rawGroups.map(group => {
                    const data = group.data || group;
                    const dungeon = dungeons.find(d => d.id == data.dungeonId);
                    
                    if (data.difficulty?.is_modulated && dungeon && dungeon.modulated) {
                        data.level = dungeon.modulated;
                    }
                    if (dungeon) {
                        data.capacity = dungeon.players;
                        data.isDungeon = dungeon.isDungeon;
                    }
                    return group;
                });

                applyFilters();
            } catch (err) {
                console.error("Error fetching groups:", err);
                if (listContainer) {
                    listContainer.innerHTML = `<div class="empty-state"><p>${i18n.t('ui.error_load')}</p></div>`;
                }
            }
        };

        window.fetchGroups = fetchGroups; // Expose for refresh()
        
        // --- SOCKET REAL-TIME ---
        const { Socket } = await import('../core/Socket.js');
        Socket.off('group_list_update');
        Socket.on('group_list_update', async (data) => {
            console.log("🌎 [Finder] Global group list updated via Socket:", data.type);
            await GroupFinderPage.refresh();
        });

        const normalize = (str) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        };
 
        const applyFilters = () => {
            const minLvl = filterLevel.value === 'all' ? 0 : parseInt(filterLevel.value);
            const query = normalize(searchInput.value.trim());
            const lang = i18n.currentLang;
            const filterMbrValue = document.getElementById('filter-membership')?.value || 'all';
            const filterType = document.getElementById('filter-type')?.value || 'all';
            
            const currentActor = Header.getUserFromToken();
            const currUserId = currentActor ? String(currentActor.id) : null;

            const filtered = GroupFinderPage.allGroups.filter(group => {
                const data = group.data || group;
                const members = data.members || [];
                
                const server = filterServer.value;
                const matchServer = server === 'all' || data.server === server;
                const matchLevel = minLvl === 0 || (data.level >= minLvl && data.level <= minLvl + 14);
                
                // Filtro de membrecía: comparar por character IDs (no por user account)
                let matchMember = true;
                const myCharIds = GroupFinderPage.myCharIds || new Set();
                const userInGroup = members.some(m => m && myCharIds.has(String(m.id || m.charId)));
                // isLeader: account-level check (leader_id es ID de cuenta)
                const isLeader = currUserId && (
                    String(group.leader_id) === currUserId ||
                    String(data.leader_id) === currUserId
                );
                const hasJoined = userInGroup || isLeader;

                if (filterMbrValue === 'joined') matchMember = hasJoined;
                else if (filterMbrValue === 'not_joined') matchMember = !hasJoined;

                let matchName = true;
                if (GroupFinderPage.selectedDungeon) {
                    matchName = data.dungeonId == GroupFinderPage.selectedDungeon.id;
                }

                let matchSearch = true;
                if (query) {
                    const titleMatch = normalize(data.title || "").includes(query);
                    const memberMatch = members.some(m => normalize(m.name || "").includes(query));
                    matchSearch = titleMatch || memberMatch;
                }
 
                const matchType = filterType === 'all' 
                    || (filterType === 'dungeon' && data.isDungeon !== false)
                    || (filterType === 'breach' && data.isDungeon === false);

                return matchServer && matchLevel && matchName && matchSearch && matchMember && matchType;
            });
            
            // ... (rest of applyFilters)
 
            if (listContainer) {
                listContainer.innerHTML = filtered.length > 0 
                    ? filtered.map(g => GroupCard.render(g)).join('')
                    : `<div class="empty-state"><p data-i18n="ui.no_results"></p></div>`;
                
                // Update Badge UI
                const badge = document.getElementById('selected-dungeon-badge');
                if (badge) {
                    const dungeon = GroupFinderPage.selectedDungeon;
                    if (dungeon) {
                        const dName = dungeon.name[lang] || dungeon.name['es'];
                        badge.innerHTML = `
                            <img src="assets/mazmos/${dungeon.id}.png" class="dung-badge-icon" onerror="this.src='assets/classes/icons/8.png'">
                            <span>${dName} (Lvl ${dungeon.min_lvl})</span>
                            <button class="btn-clear-badge" id="clear-dung-badge">&times;</button>
                        `;
                        badge.classList.remove('hide');
                        
                        document.getElementById('clear-dung-badge').onclick = () => {
                            GroupFinderPage.selectedDungeon = null;
                            const input = document.querySelector('#main-dungeon-selector input');
                            if (input) input.value = '';
                            
                            // Limpiar URL sin recargar (SPA)
                            if (window.location.hash.includes('?')) {
                                const newHash = window.location.hash.split('?')[0];
                                history.replaceState(null, null, newHash);
                            }
                            
                            applyFilters();
                        };
                    } else {
                        badge.classList.add('hide');
                    }
                }

                // Attach click listeners to join buttons reliably using data-id
                listContainer.querySelectorAll('.btn-join-tech').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const groupId = btn.dataset.id;
                        const group = filtered.find(g => g.id == groupId);
                        if (group) GroupFinderPage.openJoinModal(group);
                    };
                });

                // Botones de editar
                listContainer.querySelectorAll('.btn-edit-tech').forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        const groupId = btn.dataset.id;
                        const group = filtered.find(g => g.id == groupId);
                        if (group) LFGModals.openEditGroupModal(group);
                    };
                });
 
                i18n.translatePage();
            }
        };
 
        filterLevel.addEventListener('change', applyFilters);
        filterServer.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', applyFilters);
        document.getElementById('filter-membership').addEventListener('change', applyFilters);
        document.getElementById('filter-type')?.addEventListener('change', applyFilters);
 
        // Fetch initially
        fetchGroups();

        // Initialize DungeonSelector for main search
        const { DungeonSelector } = await import('../components/DungeonSelector.js');
        const { LFGModals } = await import('../components/LFGModals.js');

        DungeonSelector.init('main-dungeon-selector', (dungeon) => {
            GroupFinderPage.selectedDungeon = dungeon;
            applyFilters();
        });

        // Set localized placeholder after init
        const mainInput = document.querySelector('#main-dungeon-selector .dung-input');
        if (mainInput) mainInput.placeholder = i18n.t('filters.placeholder_search');

        // Create group event
        document.getElementById('btn-create-group')?.addEventListener('click', () => {
            LFGModals.openCreateGroupModal();
        });
 
        // Populate search input with dungeon name if param exists
        if (preSelectedDungeonId) {
             const currentPath = window.location.hash;
             API.getDungeons().then(dungeons => {
                 // Verify we are still on a path that expects THIS dungeon
                 if (window.location.hash !== currentPath) return;

                 const dungeon = dungeons.find(d => d.id == preSelectedDungeonId);
                 if (dungeon) {
                     GroupFinderPage.selectedDungeon = dungeon;
                     applyFilters();
                 }
             });
        }
    },

    openJoinModal: (group) => {
        import('../components/LFGModals.js').then(m => m.LFGModals.openJoinModal(group, false, () => {
            // Callback opcional si queremos refrescar al cerrar el modal exitosamente
            GroupFinderPage.refresh();
        }));
    },

    refresh: async () => {
        if (Router.currentPath !== '/' && Router.currentPath !== '/finder') return;
        console.log("🔄 [Finder] SPA Refreshing...");
        if (typeof window.fetchGroups === 'function') {
            await window.fetchGroups();
        }
    }
};
