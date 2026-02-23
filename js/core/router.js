import { GroupFinderPage } from '../pages/GroupFinderPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { AuthPage } from '../pages/AuthPage.js';
import { DungeonListPage } from '../pages/DungeonListPage.js'; 
import { GroupDetailPage } from '../pages/GroupDetailPage.js'; // NEW
import { CONFIG } from '../config.js';
import { SEO } from './seo.js';
import { i18n } from './i18n.js';

const routes = {
    '/': GroupFinderPage,
    '/finder': GroupFinderPage,
    '/profile': ProfilePage,
    '/login': AuthPage,
    '/dungeons': DungeonListPage,
    '/group': GroupDetailPage
};

export const Router = {
    params: {}, 
    currentPath: '',

    init() {
        // Redirección si entran por ruta limpia (ej: /profile -> /#/profile)
        // Optimizamos para evitar redirecciones infinitas o incorrectas en subdirectorios (GitHub Pages)
        if (window.location.pathname !== '/' && !window.location.hash) {
            const path = window.location.pathname;
            
            // Si termina en / o parece un archivo (tiene punto), NO redirigimos al hash
            // ya que suele ser el index de la carpeta raíz o subcarpeta.
            if (!path.endsWith('/') && !path.includes('.')) {
                window.location.replace(`/#${path}${window.location.search}`);
                return;
            }
        }

        document.body.addEventListener('click', e => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                const targetPath = link.getAttribute('href');
                this.navigateTo(targetPath);
            }
        });

        window.addEventListener('hashchange', () => this.route());
        this.route();
    },

    navigateTo(path) {
        let cleanPath = path.replace(/^#+/, '');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

        const parts = cleanPath.split('/');
        const langCandidate = parts[1];

        // Si el path no tiene un prefijo de idioma válido, se lo añadimos
        if (!CONFIG.SUPPORTED_LANGS.includes(langCandidate)) {
            const currentLang = i18n.currentLang || localStorage.getItem(CONFIG.STORAGE_KEYS.LANG) || CONFIG.DEFAULT_LANG;
            cleanPath = `/${currentLang}${cleanPath}`;
        }

        window.location.hash = `#${cleanPath}`;
    },

    async route() {
        let fullHash = window.location.hash.slice(1) || '/';
        if (!fullHash.startsWith('/')) fullHash = '/' + fullHash;

        const parts = fullHash.split('#');
        const urlPart = parts[0].split('?')[0];
        const pathParts = urlPart.split('/');
        
        const lang = pathParts[1];
        
        // 1. Verificación de idioma en la URL
        if (!CONFIG.SUPPORTED_LANGS.includes(lang)) {
            // Si no hay idioma válido, redirigimos usando navigateTo que lo añadirá
            this.navigateTo(fullHash);
            return;
        }

        // 2. Sincronizar i18n si el idioma de la URL es distinto al actual
        if (i18n.currentLang !== lang) {
            await i18n.setLanguage(lang);
            // Actualizar Header para reflejar el cambio (banderas, links, etc)
            try {
                const { Header } = await import('../components/Header.js');
                await Header.update();
            } catch (e) { console.error(e); }
        }

        // 3. Determinar el path interno para el mapeo de rutas
        const internalPath = '/' + (pathParts[2] || '');
        
        const isSamePath = (this.currentPath === internalPath);
        const hasSubHash = parts.length > 1;
        this.currentPath = internalPath;

        // Extracción de parámetros dinámicos (ajustado para prefijo /lang/...)
        if (pathParts[2] === 'group' && pathParts[3]) {
            this.params.id = pathParts[3];
        } else {
            this.params.id = null;
        }

        let token = null;
        if (window.location.search.includes('token=')) {
            const urlParams = new URLSearchParams(window.location.search);
            token = urlParams.get('token');
        } else if (window.location.hash.includes('token=')) {
            // Check inside the hash as well, e.g. #?token=...
            const hashParts = window.location.hash.split('?');
            if (hashParts.length > 1) {
                const urlParams = new URLSearchParams('?' + hashParts[1]);
                token = urlParams.get('token');
            }
        }

        if (token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
            try {
                const { Header } = await import('../components/Header.js');
                await Header.update();
            } catch (e) {
                console.error("Error updating Header:", e);
            }
            this.navigateTo('/profile');
            return;
        }

        const page = routes[internalPath] || routes['/'];
        const appContainer = document.getElementById('app');
        
        // Si es el mismo path y solo cambió el hash secundario, NO limpiamos ni mostramos loader
        if (isSamePath && hasSubHash) {
            if (page.onHashChange) await page.onHashChange();
            
            // SEO Update on sub-hash change (optional but recommended for tab-system)
            if (page.getSEOData) {
                SEO.update(await page.getSEOData());
            }
            return;
        }

        if (internalPath === '/dungeons' || internalPath === '/' || internalPath.startsWith('/finder') || internalPath === '/profile' || internalPath === '/group') {
            document.body.classList.add('full-width-mode');
        } else {
            document.body.classList.remove('full-width-mode');
        }

        // Loader solo si cambiamos de página real
        appContainer.innerHTML = '<div class="initial-loader"><div class="wakfu-spinner"></div></div>';

        try {
            appContainer.innerHTML = await page.render();
            window.scrollTo(0, 0);
            
            // SEO Update
            // If the page has 'manualSEO', it will handle the update after its own async data is loaded
            if (!page.manualSEO) {
                if (page.getSEOData) {
                    SEO.update(await page.getSEOData());
                } else {
                    SEO.update();
                }
            }

            if (page.afterRender) await page.afterRender();
        } catch (error) {
            console.error("Error en router:", error);
            appContainer.innerHTML = `<div class="error-state">Error cargando la página: ${error.message}</div>`;
        }
    }
};
