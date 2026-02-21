import { CONFIG } from '../config.js';

export const Theme = {
    currentTheme: 'theme-dark',

    /**
     * Inicializa el tema al cargar la aplicación
     */
    init() {
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (systemPrefersDark) {
            this.setTheme('theme-dark');
        } else {
            this.setTheme('theme-dark'); // Por defecto oscuro según la estética del proyecto
        }
    },

    /**
     * Alterna entre oscuro y claro
     */
    toggle() {
        const newTheme = this.currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
        this.setTheme(newTheme);
    },

    /**
     * Aplica el tema al body y lo guarda
     */
    setTheme(theme) {
        this.currentTheme = theme;
        
        // Removemos clases de temas anteriores
        document.body.classList.remove('theme-dark', 'theme-light');
        
        // Aplicamos la nueva
        document.body.classList.add(theme);
        
        // Guardamos preferencia
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
    }
};