import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';
import { Router } from '../core/router.js';

export const DungeonListPage = {
    filters: {
        search: '',
        players: 'all',
        level: 'all',
        status: 'all',
        type: 'all', // 'all', 'dungeon', 'rift'
        sort: 'desc'  // 'desc' = highest level first, 'asc' = lowest first
    },

    getSEOData: () => ({
        title: `${i18n.t('dungeons.search')} | Wakfu LFG`,
        description: 'Explora todas las mazmorras de Wakfu y consulta grupos activos.'
    }),

    render: async () => {
        return `
            <div class="page-container dungeon-page-layout fade-in">
                <!-- Sidebar de Filtros -->
                <aside class="dungeon-sidebar">
                    <div class="sidebar-header">
                        <h2 data-i18n="dungeons.search"></h2>
                    </div>
                    
                    <div class="filter-group">
                        <label class="label-tech" for="dungeon-list-search" data-i18n="filters.name"></label>
                        <input type="text" id="dungeon-list-search" class="input-tech" data-i18n="filters.placeholder_search" autocomplete="off">
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="filters.players"></label>
                        <div class="filter-tags" id="filter-players">
                            <button class="filter-tag active" data-val="all" data-i18n="ui.all"></button>
                            <button class="filter-tag" data-val="3">${i18n.t('ui.players_count', {count: 3})}</button>
                            <button class="filter-tag" data-val="6">${i18n.t('ui.players_count', {count: 6})}</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="home.filter_lvl"></label>
                        <div class="filter-tags level-tags" id="filter-levels">
                            <button class="filter-tag active" data-val="all" data-i18n="ui.all"></button>
                            <button class="filter-tag" data-val="1-50">1 - 50</button>
                            <button class="filter-tag" data-val="51-100">51 - 100</button>
                            <button class="filter-tag" data-val="101-150">101 - 150</button>
                            <button class="filter-tag" data-val="151-200">151 - 200</button>
                            <button class="filter-tag" data-val="200-245">200 - 245</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="filters.status"></label>
                        <div class="filter-tags" id="filter-status">
                            <button class="filter-tag active" data-val="all" data-i18n="ui.all"></button>
                            <button class="filter-tag" data-val="active" data-i18n="filters.with_groups"></button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="filters.type">Tipo</label>
                        <div class="filter-tags" id="filter-type">
                            <button class="filter-tag active" data-val="all" data-i18n="ui.all"></button>
                            <button class="filter-tag" data-val="dungeon" data-i18n="dungeons.dungeon">Mazmorra</button>
                            <button class="filter-tag" data-val="rift" data-i18n="dungeons.breach">Brecha</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <label class="label-tech" data-i18n="filters.sort_level"></label>
                        <div class="filter-tags" id="filter-sort">
                            <button class="filter-tag active" data-val="desc">↓ ${i18n.t('filters.highest')}</button>
                            <button class="filter-tag" data-val="asc">↑ ${i18n.t('filters.lowest')}</button>
                        </div>
                    </div>
                </aside>

                <!-- Contenido Principal -->
                <main class="dungeon-main-content">
                    <div id="dungeons-grid" class="dungeons-grid">
                        <div class="initial-loader">
                            <div class="wakfu-spinner"></div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    },

    afterRender: async () => {
        const grid = document.getElementById('dungeons-grid');
        const searchInput = document.getElementById('dungeon-list-search');
        
        // --- SOCKET REAL-TIME ---
        const { Socket } = await import('../core/Socket.js');
        Socket.off('group_list_update');
        Socket.on('group_list_update', async () => {
            console.log("🌎 [Dungeons] Updating group counts via Socket");
            await DungeonListPage.refresh();
        });

        // Filter States
        let filters = DungeonListPage.filters;

        try {
            const [dungeons, groups, stats] = await Promise.all([
                API.getDungeons(),
                API.getGroups().catch(err => {
                    console.warn("Error fetching groups:", err);
                    return []; 
                }),
                API.getStats().catch(err => {
                    console.warn("Error fetching stats:", err);
                    return { created: 0, completed: 0, dungeons: {} };
                })
            ]);

            const rawGroups = groups || [];
            const activeGroups = Array.isArray(rawGroups) ? rawGroups : (rawGroups.groups || []);

            const groupsCount = {};
            activeGroups.forEach(g => {
                const data = g.data || g;
                const dId = data.dungeonId;
                if (dId) {
                    groupsCount[dId] = (groupsCount[dId] || 0) + 1;
                }
            });

            // Base list
            const baseDungeons = dungeons;

            const renderDungeons = () => {
                const lang = i18n.currentLang;
                
                const filtered = baseDungeons.filter(d => {
                    // 1. Search Name
                    const name = (d.name[lang] || d.name['es']).toLowerCase();
                    if (!name.includes(filters.search.toLowerCase())) return false;

                    // 2. Players
                    if (filters.players !== 'all') {
                        if (parseInt(filters.players) !== d.players) return false;
                    }

                    // 3. Level Range
                    if (filters.level !== 'all') {
                        const [min, max] = filters.level.split('-').map(Number);
                        if (d.min_lvl < min || d.min_lvl > max) return false;
                    }

                    // 4. Status (Active Groups)
                    if (filters.status === 'active') {
                        if (!groupsCount[d.id]) return false;
                    }

                    // 5. Type (Dungeon vs Rift)
                    if (filters.type === 'dungeon' && d.isDungeon === false) return false;
                    if (filters.type === 'rift' && d.isDungeon === true) return false;

                    return true;
                }).sort((a, b) => {
                    // Always put active groups first
                    const countA = groupsCount[a.id] || 0;
                    const countB = groupsCount[b.id] || 0;
                    if (countA !== countB) return countB - countA;
                    // Then sort by level order
                    return filters.sort === 'asc'
                        ? a.min_lvl - b.min_lvl
                        : b.min_lvl - a.min_lvl;
                });

                if (filtered.length === 0) {
                    grid.innerHTML = `<div class="empty-state"><p data-i18n="ui.no_results"></p></div>`;
                    i18n.translatePage();
                    return;
                }

                grid.innerHTML = filtered.map(d => {
                    const count = groupsCount[d.id] || 0;
                    const name = d.name[lang] || d.name['es'];
                    const hasGroupsClass = count > 0 ? 'active-groups' : '';
                    
                    // Extraer stats de esta mazmorra
                    const dStats = stats?.dungeons?.[d.id] || { created: 0, completed: 0 };

                    return `
                        <div class="dungeon-card ${hasGroupsClass}">
                            <div class="dungeon-image-wrapper">
                                <div class="dungeon-badges">
                                    <span class="badge-level">${i18n.t('ui.level')} ${d.min_lvl}</span>
                                    <span class="badge-modulated" title="${i18n.t('dungeons.mod_level')}"><i class="icon-modulated"></i> ${d.modulated}</span>
                                </div>
                                <img src="${d.isDungeon === false ? 'assets/mazmos/default.png' : `assets/mazmos/${d.id}.png`}" alt="${name}" loading="lazy" onerror="this.src='assets/images/placeholder_dungeon.png'">
                                ${count > 0 ? `
                                    <div class="active-badge animate-pulse">
                                        ${count === 1 
                                            ? i18n.t('dungeons.active_groups_singular') 
                                            : i18n.t('dungeons.active_groups_plural', { count: count })}
                                    </div>` : ''}
                            </div>
                            
                            <div class="dungeon-content">
                                <h3 class="dungeon-title">${name}</h3>
                                
                                <div class="dungeon-details">
                                    <div class="detail-new-row">
                                        <div class="detail-pill">👥 ${d.players}</div>
                                        <div class="detail-pill">🏰 ${d.isDungeon ? i18n.t('dungeons.dungeon') : i18n.t('dungeons.breach')}</div>
                                        
                                        <div class="dungeon-card-stats">
                                            <span class="d-stat" title="${i18n.t('stats.created_title')}">📘 ${dStats.created || 0}</span>
                                            <span class="d-stat success" title="${i18n.t('stats.completed_title')}">🏆 ${dStats.completed || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="dungeon-actions-row">
                                    <button class="btn btn-search-group ${count > 0 ? 'btn-accent' : 'btn-outline'}" data-id="${d.id}" style="flex: 2;">
                                        ${count > 0 ? i18n.t('dungeons.view_groups', {count}) : i18n.t('nav.find_group')}
                                    </button>
                                    <button class="btn btn-create-group-direct" data-id="${d.id}" title="${i18n.t('home.btn_create_group')}" style="flex: 1; min-width: 44px;">
                                        ➕
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                i18n.translatePage();
                
                // Eventos de botones
                document.querySelectorAll('.btn-search-group').forEach(btn => {
                    btn.onclick = () => {
                        const dungeonId = btn.dataset.id;
                        Router.navigateTo(`/finder?dungeon=${dungeonId}`);
                    };
                });

                document.querySelectorAll('.btn-create-group-direct').forEach(btn => {
                    btn.onclick = async () => {
                        const dungeonId = btn.dataset.id;
                        const dungeon = baseDungeons.find(d => d.id == dungeonId);
                        if (dungeon) {
                            const { LFGModals } = await import('../components/LFGModals.js');
                            LFGModals.openCreateGroupModal(dungeon);
                        }
                    };
                });
            };

            // Initial Render
            renderDungeons();

            // --- Event Listeners ---
            
            // Search
            searchInput.addEventListener('input', (e) => {
                filters.search = e.target.value;
                renderDungeons();
            });

            // Helper for Filter Tags
            const setupFilterTags = (containerId, filterKey) => {
                const container = document.getElementById(containerId);
                if(!container) return;
                const buttons = container.querySelectorAll('.filter-tag');
                
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Remove active class from siblings
                        buttons.forEach(b => b.classList.remove('active'));
                        // Add active to clicked
                        btn.classList.add('active');
                        // Update filter state
                        filters[filterKey] = btn.dataset.val;
                        renderDungeons();
                    });
                });
            };

            setupFilterTags('filter-players', 'players');
            setupFilterTags('filter-levels', 'level');
            setupFilterTags('filter-status', 'status');
            setupFilterTags('filter-type', 'type');
            setupFilterTags('filter-sort', 'sort');

        } catch (error) {
            console.error("Error loading dungeons:", error);
            grid.innerHTML = `<div class="error-message" data-i18n="ui.error_load"></div>`;
            i18n.translatePage();
        }
    },

    refresh: async () => {
        console.log("🔄 [Dungeons] SPA Refreshing...");
        if (Router.currentPath !== '/dungeons') return;
        const app = document.getElementById('app');
        if (!app) return;
        try {
            const html = await DungeonListPage.render();
            app.innerHTML = html;
            await DungeonListPage.afterRender();
        } catch (e) {
            console.error('[Dungeons] Refresh error:', e);
        }
    }
};
