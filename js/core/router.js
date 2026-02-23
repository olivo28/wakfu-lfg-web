import { GroupFinderPage } from '../pages/GroupFinderPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { AuthPage } from '../pages/AuthPage.js';
import { DungeonListPage } from '../pages/DungeonListPage.js'; 
import { GroupDetailPage } from '../pages/GroupDetailPage.js'; // NEW
import { CONFIG } from '../config.js';
import { SEO } from './seo.js';

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
        // Aseguramos que no haya doble hash (limpiamos cualquier '#' al inicio)
        const cleanPath = path.replace(/^#+/, '');
        window.location.hash = `#${cleanPath}`;
    },

    async route() {
        const fullHash = window.location.hash.slice(1) || '/';
        const parts = fullHash.split('#');
        const pathParts = parts[0].split('?')[0].split('/');
        const path = '/' + (pathParts[1] || '');
        
        // --- OPTIMIZACIÓN SPA ---
        // Si el path base es el mismo y hay un sub-hash (ej: /profile#sended)
        // evitamos el flash del loader y el re-render total si la página ya está activa.
        const isSamePath = (this.currentPath === path);
        const hasSubHash = parts.length > 1;
        this.currentPath = path;

        // Extracción de parámetros dinámicos
        if (pathParts[1] === 'group' && pathParts[2]) {
            this.params.id = pathParts[2];
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

        const page = routes[path] || routes['/'];
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

        if (path === '/dungeons' || path === '/' || path.startsWith('/finder') || path === '/profile' || path === '/group') {
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
