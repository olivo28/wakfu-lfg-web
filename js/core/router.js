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
        // Manejo de clicks en links con [data-link]
        document.body.addEventListener('click', e => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                const targetPath = link.getAttribute('href');
                this.navigateTo(targetPath);
            }
        });

        // Evento para botones atrás/adelante del navegador
        window.addEventListener('popstate', () => this.route());
        
        // Primera carga
        this.route();
    },

    /**
     * Navega a una ruta sin recargar la página (History API)
     */
    navigateTo(path) {
        // Limpiamos el path de hashes accidentales de la migración
        let cleanPath = path.replace(/^#+/, '');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

        const parts = cleanPath.split('/');
        const langCandidate = parts[1];

        // Si el path no tiene un prefijo de idioma válido, se lo añadimos
        if (!CONFIG.SUPPORTED_LANGS.includes(langCandidate)) {
            const currentLang = i18n.currentLang || localStorage.getItem(CONFIG.STORAGE_KEYS.LANG) || CONFIG.DEFAULT_LANG;
            cleanPath = `/${currentLang}${cleanPath}`;
        }

        // URL Final incluyendo el BASE_PATH para GitHub Pages
        const finalUrl = `${CONFIG.BASE_PATH}${cleanPath}`;
        
        window.history.pushState(null, null, finalUrl);
        this.route();
    },

    /**
     * Procesa la URL actual y renderiza la vista correspondiente
     */
    async route() {
        let fullPath = window.location.pathname;
        
        // 1. Limpiar el BASE_PATH de la URL para procesar internamente
        if (CONFIG.BASE_PATH && fullPath.startsWith(CONFIG.BASE_PATH)) {
            fullPath = fullPath.replace(CONFIG.BASE_PATH, '');
        }
        if (!fullPath || fullPath === '') fullPath = '/';
        if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;

        // Separar Path de Query Params (?token=...)
        const urlParts = fullPath.split('?');
        const pathPart = urlParts[0];
        const queryString = urlParts[1] || '';
        
        const pathSegments = pathPart.split('/');
        const lang = pathSegments[1];
        
        // 1. Verificación de idioma en la URL
        if (!CONFIG.SUPPORTED_LANGS.includes(lang)) {
            // Si no hay idioma válido, redirigimos usando navigateTo que lo añadirá
            this.navigateTo(fullPath + (queryString ? '?' + queryString : ''));
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
        const internalPath = '/' + (pathSegments[2] || '');
        
        const isSamePath = (this.currentPath === internalPath);
        this.currentPath = internalPath;

        // Extracción de parámetros dinámicos (ajustado para prefijo /lang/...)
        if (pathSegments[2] === 'group' && pathSegments[3]) {
            this.params.id = pathSegments[3];
        } else {
            this.params.id = null;
        }

        // 4. Manejo de Tokens (Discord Login)
        let token = null;
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get('token');

        if (token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
            try {
                const { Header } = await import('../components/Header.js');
                await Header.update();
            } catch (e) {
                console.error("Error updating Header:", e);
            }
            // Limpiar URL eliminando el token de la barra de direcciones
            this.navigateTo('/profile');
            return;
        }

        const page = routes[internalPath] || routes['/'];
        const appContainer = document.getElementById('app');
        
        // En History API no solemos tener hash secundarios como /profile#settings
        // pero lo mantenemos por si el usuario usa anclas
        const hasSubHash = window.location.hash.length > 0;

        if (isSamePath && hasSubHash) {
            if (page.onHashChange) await page.onHashChange();
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
        appContainer.innerHTML = `
            <div class="initial-loader">
                <div class="wakfu-spinner"></div>
                <p>${i18n.t('ui.loading')}</p>
            </div>
        `;

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
