import { CONFIG } from '../config.js';
import { i18n } from '../core/i18n.js';

export const AuthPage = {
    getSEOData: () => ({
        title: `${i18n.t('auth.title')} | Wakfu LFG`,
        description: 'Inicia sesión con Discord para empezar a buscar o crear grupos en Wakfu.'
    }),

    render: async () => {
        // Logo aleatorio (Saltando el 17 que no existe)
        const validIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18];
        const randomId = validIds[Math.floor(Math.random() * validIds.length)];

        return `
            <div class="auth-container fade-in">
                <div class="card auth-card technical-card">
                    <div class="auth-header">
                        <img src="assets/classes/icons/${randomId}.png" class="auth-logo icon-technical">
                        <h1 class="auth-title" data-i18n="auth.title"></h1>
                        <div class="auth-subtitle-line">
                            <span class="line"></span>
                            <p class="auth-subtitle" data-i18n="auth.subtitle"></p>
                            <span class="line"></span>
                        </div>
                    </div>
                    
                    <div class="auth-body">
                        <p class="auth-description" data-i18n="auth.description"></p>
                        
                        <div class="auth-features">
                            <div class="feature-item">
                                <span class="accent-dot"></span>
                                <span data-i18n="auth.feature_chars"></span>
                            </div>
                            <div class="feature-item">
                                <span class="accent-dot"></span>
                                <span data-i18n="auth.feature_groups"></span>
                            </div>
                            <div class="feature-item">
                                <span class="accent-dot"></span>
                                <span data-i18n="auth.feature_notif"></span>
                            </div>
                        </div>
                    </div>

                    <div class="auth-footer">
                        <button id="btn-discord-login" class="btn btn-discord btn-full">
                            <span data-i18n="auth.login_btn"></span>
                        </button>
                        <a href="#/" data-link class="btn-back" data-i18n="auth.back_link"></a>
                    </div>
                </div>
            </div>
        `;
    },

    afterRender: async () => {
        // Traducir dinámicamente
        i18n.translatePage();

        document.getElementById('btn-discord-login')?.addEventListener('click', () => {
            // EVITAMOS usar callback.html porque algunos servidores (como Live Server) eliminan la extensión .html
            // y al hacer la redirección interna pierden los parámetros de consulta (?token=...)
            // Mejor usamos la raíz, donde el Router de la SPA capturará el token.
            const returnUrl = window.location.href.split('?')[0].split('#')[0];
            
            console.log("Return URL generada:", returnUrl); 
            
            const loginUrl = `${CONFIG.API_URL.replace('/api', '')}/auth/discord`; 
            window.location.href = `${loginUrl}?returnUrl=${encodeURIComponent(returnUrl)}`;
        });
    }
};