import { i18n } from './core/i18n.js';
import { Router } from './core/router.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { Theme } from './core/theme.js';
import { Socket } from './core/Socket.js';
import { NotificationSystem } from './core/notifications.js';

// Función auxiliar para renderizar el Header de forma segura
const refreshHeader = async () => {
    const headerContainer = document.getElementById('main-header');
    if (headerContainer) {
        headerContainer.innerHTML = await Header.render();
        // Volvemos a atar los eventos (menú móvil, login, etc.)
        if (Header.afterRender) await Header.afterRender();
    }
};

const init = async () => {
    try {
        // 1. Inicializar Idiomas y Tema
        await i18n.init();
        Theme.init();
        Socket.init();

        // 2. Renderizar Header (Primera vez)
        await refreshHeader();

        // 3. Renderizar Footer
        const footerContainer = document.getElementById('main-footer');
        if (footerContainer) {
            footerContainer.innerHTML = await Footer.render();
            if (Footer.afterRender) await Footer.afterRender();
        }

        // 4. Iniciar el Enrutador
        Router.init();

        // 5. Traducir textos estáticos
        i18n.translatePage();

        // 6. Inicializar Sistema de Notificaciones (solo si hay usuario logueado)
        if (Header.getUserFromToken()) {
            await NotificationSystem.init();
        }

        // Escuchar cambios de navegación para actualizar el Header (Login/Logout)
        window.addEventListener('hashchange', async () => {
            await refreshHeader();
            // Re-init notifications if user just logged in
            if (Header.getUserFromToken() && NotificationSystem._unreadCount === 0 && NotificationSystem._notifications.length === 0) {
                await NotificationSystem.init();
            }
        });

        console.log("Mundo de los Doce cargado correctamente.");

    } catch (error) {
        console.error("Error crítico al iniciar la app:", error);
    }
};

document.addEventListener('DOMContentLoaded', init);
