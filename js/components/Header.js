import { CONFIG } from '../config.js';
import { API } from '../core/api.js';
import { i18n } from '../core/i18n.js';
import { Router } from '../core/router.js';
import { NotificationSystem } from '../core/notifications.js';

export const Header = {
    languages: [
        { code: 'es', icon: 'https://flagcdn.com/w80/es.png', label: 'Español' },
        { code: 'en', icon: 'https://flagcdn.com/w80/us.png', label: 'English' },
        { code: 'fr', icon: 'https://flagcdn.com/w80/fr.png', label: 'Français' },
        { code: 'pt', icon: 'https://flagcdn.com/w80/br.png', label: 'Português' },
    ],

    // Decodificador de Token JWT
    getUserFromToken: () => {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("JWT Error:", e);
            return null;
        }
    },

    // Refresca el Header en el DOM
    update: async () => {
        const container = document.getElementById('main-header');
        if (container) {
            container.innerHTML = await Header.render();
            await Header.afterRender();
        }
    },

    render: async () => {
        const user = Header.getUserFromToken();
        const currentLangCode = i18n.currentLang || CONFIG.DEFAULT_LANG;
        const currentLang = Header.languages.find(l => l.code === currentLangCode);
        
        // Generar ID aleatorio de forma segura
        const validIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18];
        const randomId = validIds[Math.floor(Math.random() * validIds.length)];

        return `
            <nav class="nav-container">
                <div class="nav-logo">
                    <a href="/" data-link class="logo-text">
                        <img src="assets/classes/icons/${randomId}.png" alt="Logo" class="logo-img icon-technical">
                        <span>${CONFIG.APP_NAME}</span>
                    </a>
                </div>

                <div class="nav-right">
                    <ul class="nav-links" id="nav-menu">
                        <li><a href="/" data-link data-i18n="nav.find_group"></a></li>
                        <li><a href="/dungeons" data-link data-i18n="nav.dungeons"></a></li>
                        <li><a href="/profile" data-link data-i18n="nav.my_profile"></a></li>
                        
                        <li class="lang-custom-container">
                            <button class="lang-active-btn" id="lang-menu-btn">
                                <img src="${currentLang.icon}" class="flag-img">
                            </button>
                            <div class="lang-dropdown" id="lang-dropdown">
                                ${Header.languages.map(l => `
                                    <div class="lang-option ${l.code === currentLangCode ? 'active' : ''}" data-lang="${l.code}">
                                        <img src="${l.icon}"> <span>${l.label}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </li>

                        ${user ? `
                        </li>
                        ` : ''}

                        ${user ? NotificationSystem.renderBell() : ''}

                        <li class="auth-section">
                            ${user ? `
                                <div class="user-pill-tech">
                                    <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" 
                                         class="nav-avatar" onerror="this.src='assets/classes/icons/8.png'">
                                    <span class="nav-username">${user.username}</span>
                                    <button id="btn-logout" class="logout-mini" title="${i18n.t('nav.logout')}">×</button>
                                </div>
                            ` : `
                                <a href="/login" class="btn btn-accent" data-link>
                                    <span data-i18n="nav.login"></span>
                                </a>
                            `}
                        </li>
                    </ul>
                    <button class="mobile-menu-btn" id="mobile-toggle"><span></span><span></span><span></span></button>
                </div>
            </nav>
        `;
    },

    afterRender: async () => {
        // --- 1. Lógica de Idiomas ---
        const langBtn = document.getElementById('lang-menu-btn');
        const langDropdown = document.getElementById('lang-dropdown');
        
        if (langBtn) {
            langBtn.addEventListener('click', (e) => { 
                e.stopPropagation();
                // Mutual exclusion: close notif dropdown if open
                document.getElementById('notif-dropdown')?.classList.remove('show');
                langDropdown.classList.toggle('show'); 
            });
        }
        
        window.addEventListener('click', () => langDropdown?.classList.remove('show'));

        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.onclick = async () => {
                langDropdown?.classList.remove('show');
                await i18n.setLanguage(opt.dataset.lang);
                // Re-render header to update flag icon
                await Header.update();
                // Re-render the full current page so dynamic cards update too
                await Router.route();
            };
        });

        // --- 2. Lógica de Logout (CORREGIDA) ---
        // Verificamos si el botón existe antes de asignar el evento
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.onclick = () => {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
                Header.update();
                Router.navigateTo('/');
            };
        }

        // --- 3. Menú Móvil ---
        const mobileToggle = document.getElementById('mobile-toggle');
        if (mobileToggle) {
            mobileToggle.onclick = () => {
                document.getElementById('nav-menu').classList.toggle('active');
            };
        }

        // Traducir elementos inyectados
        i18n.translatePage();

        // Bind notification bell events
        NotificationSystem.afterRender();
    }
};