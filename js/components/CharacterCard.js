import { i18n } from '../core/i18n.js';
import { API } from '../core/api.js';
import { CONFIG } from '../config.js';

const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};

export const CharacterCard = {
    render: (char, modulatedLevel = null) => {
        // Obtenemos los datos de la clase desde el JSON maestro
        const classData = API.getClassesSync()?.find(c => c.id === char.classId);
        const lang = i18n.currentLang;
        const className = classData ? classData.names[lang] : 'Unknown';
        
        // Determinar asset según género
        const genderKey = char.gender === 0 ? 'male' : 'female';
        const bodyImage = classData ? classData.assets[genderKey].body : '';
        const illustImage = classData ? classData.assets[genderKey].illustration : '';
        const emoteImage = classData ? classData.assets[genderKey].emote : '';

        // Lógica de nivel modulado: "245 (35)"
        const levelDisplay = (modulatedLevel && char.level > modulatedLevel) 
            ? `${char.level} <span class="modulated-lvl">(${modulatedLevel})</span>` 
            : char.level;

        return `
            <div class="card char-card-tech">
                <!-- Ilustración de Fondo -->
                <div class="char-banner">
                    <!-- Ilustración de fondo/lado -->
                    <!--<img src="${illustImage}" class="char-illust-side" draggable="false">-->
                    
                    <!-- Render del cuerpo centrado -->
                    <div class="char-render-container">
                        <img src="${bodyImage}" class="ak-breed-render ak-breed-direction-0" draggable="false" alt="${className}">
                    </div>

                    <div class="char-banner-overlay">
                        <span class="char-lvl-badge">
                            <span data-i18n="profile.level_short">${i18n.t('profile.level_short')}</span> ${levelDisplay}
                        </span>
                        <div class="char-class-info-banner">
                            <span class="char-class-name" id="char-class-${char.id}">${className}</span>
                            <img src="${emoteImage}" class="char-emote-banner" draggable="false">
                        </div>
                    </div>
                </div>

                <!-- Info Técnica -->
                <div class="char-content">
                    <div class="char-info-main">
                        <h3 class="char-name-text">${escapeHTML(char.name)}</h3>
                        <span class="char-server-text srv-${char.server.toLowerCase()}">${escapeHTML(char.server)}</span>
                    </div>

                    <div class="char-stats-mini">
                        <div class="char-roles">
                            <span class="label-tech" style="font-size: 8px;" data-i18n="roles.title">Roles</span>
                            <div class="roles-chips-container">
                                ${char.roles.map(role => `
                                    <img src="${CONFIG.BASE_PATH}/assets/roles/${role}.png" class="role-icon-mini" title="${i18n.t('roles.' + role)}">
                                `).join('')}
                            </div>
                        </div>

                        <div class="char-elements">
                            <span class="label-tech" style="font-size: 8px;" data-i18n="profile.elements_short">Elementos</span>
                            <div class="elements-chips-container">
                                ${char.elements.map(el => `
                                    <img src="${CONFIG.BASE_PATH}/assets/element/${el}.png" class="element-icon-mini" title="${i18n.t('elements.' + el)}">
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botones de Acción -->
                <div class="char-actions">
                    <button class="btn-icon btn-edit-char" data-id="${char.id}" title="${i18n.t('ui.edit')}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon btn-delete-char" data-id="${char.id}" title="${i18n.t('ui.delete')}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `;
    },
 
    /**
     * Versión compacta para listas (ej: dentro de un modal de grupo)
     */
    renderCompact: (char, modulatedLevel = null) => {
        const classData = API.getClassesSync()?.find(c => c.id === char.classId);
        const lang = i18n.currentLang;
        const className = classData ? classData.names[lang] : 'Unknown';
        const paddedId = String(char.classId).padStart(2, '0');

        // Lógica de nivel modulado: "245 (35)"
        const levelDisplay = (modulatedLevel && char.level > modulatedLevel) 
            ? `${char.level} <span class="modulated-lvl">(${modulatedLevel})</span>` 
            : char.level;
 
        return `
            <div class="compact-char-card" data-id="${char.id}">
                <div class="compact-char-left">
                    <img src="${CONFIG.BASE_PATH}/assets/classes/emote/${paddedId}${char.gender}.png" class="emote-mini" title="${className}">
                    <div class="compact-info-col">
                        <span class="compact-name">${escapeHTML(char.name)}</span>
                        <span class="compact-lvl">${i18n.t('profile.level_short')} ${levelDisplay}</span>
                    </div>
                </div>
                <div class="char-roles-mini">
                    ${char.roles.map(role => `
                        <img src="${CONFIG.BASE_PATH}/assets/roles/${role}.png" class="role-icon-mini" title="${i18n.t('roles.' + role)}">
                    `).join('')}
                </div>
            </div>
        `;
    }
};