import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';

export const DungeonSelector = {
    dungeons: [],

    /**
     * Inicializa el selector en un contenedor específico
     * @param {string|HTMLElement} container - ID del div o elemento donde se renderizará
     * @param {function} onSelect - Callback que recibe la mazmorra seleccionada
     * @param {object} preSelected - Objeto mazmorra para pre-seleccionar
     */
    init: async (container, onSelect, preSelected = null) => {
        const target = typeof container === 'string' ? document.getElementById(container) : container;
        if (!target) return;

        // Cargar datos si no están cargados
        if (DungeonSelector.dungeons.length === 0) {
            DungeonSelector.dungeons = await API.getDungeons() || [];
        }

        const lang = i18n.currentLang;

        target.innerHTML = `
            <div class="dung-selector-wrapper">
                <input type="text" class="input-tech dung-input" 
                       placeholder="${i18n.t('filters.placeholder_search')}" autocomplete="off">
                <div class="dung-results-list hide"></div>
            </div>
        `;

        const input = target.querySelector('.dung-input');
        const list = target.querySelector('.dung-results-list');

        // Aplicar pre-selección si existe
        if (preSelected) {
            input.value = preSelected.name[lang] || preSelected.name['es'];
            // Opcional: Trigger onSelect para que el padre sepa
            if (onSelect) onSelect(preSelected);
        }

        // Evento de búsqueda
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length < 2) {
                list.classList.add('hide');
                return;
            }

            const filtered = DungeonSelector.dungeons.filter(d => 
                (d.name[lang] || d.name['es']).toLowerCase().includes(query)
            ).slice(0, 8);

            if (filtered.length > 0) {
                list.innerHTML = filtered.map(d => `
                    <div class="dung-item" data-id="${d.id}">
                        <img src="${d.isDungeon === false ? 'assets/mazmos/default.png' : `assets/mazmos/${d.id}.png`}" class="dung-icon-mini" onerror="this.src='assets/classes/icons/8.png'">
                        <div class="dung-info">
                            <span class="dung-name">${d.name[lang] || d.name['es']}</span>
                            <span class="dung-meta">${i18n.t('ui.level').toUpperCase()} ${d.min_lvl}</span>
                        </div>
                    </div>
                `).join('');
                list.classList.remove('hide');
            } else {
                list.classList.add('hide');
            }
        });

        // Evento de selección
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.dung-item');
            if (item) {
                const id = parseInt(item.dataset.id);
                const dungeon = DungeonSelector.dungeons.find(d => d.id === id);
                
                input.value = dungeon.name[i18n.currentLang] || dungeon.name['es'];
                list.classList.add('hide');
                
                if (onSelect) onSelect(dungeon);
            }
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!target.contains(e.target)) list.classList.add('hide');
        });
    }
};
