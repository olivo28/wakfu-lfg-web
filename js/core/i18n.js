import { CONFIG } from '../config.js';

export const i18n = {
    currentLang: CONFIG.DEFAULT_LANG,
    translations: {},

    /**
     * Inicializa el sistema de idiomas
     */
    async init() {
        // 1. Detectar idioma: URL > LocalStorage > Navegador > Config Default
        const hashLang = this.getLangFromHash();
        const savedLang = localStorage.getItem(CONFIG.STORAGE_KEYS.LANG);
        const browserLang = navigator.language.split('-')[0];
        
        let langToLoad = hashLang || savedLang || browserLang;

        // Verificar si el idioma detectado está soportado
        if (!CONFIG.SUPPORTED_LANGS.includes(langToLoad)) {
            langToLoad = CONFIG.DEFAULT_LANG;
        }

        await this.setLanguage(langToLoad);
    },

    /**
     * Extrae el código de idioma del hash de la URL (ej: #/es/finder -> es)
     */
    getLangFromHash() {
        const hash = window.location.hash.slice(1); // Remover '#'
        if (!hash) return null;

        const parts = hash.split('/');
        // El primer elemento después del primer / suele ser el idioma
        // Ejemplo: /es/finder -> ["", "es", "finder"]
        const langCode = parts[1]; 
        
        if (CONFIG.SUPPORTED_LANGS.includes(langCode)) {
            return langCode;
        }
        return null;
    },

    /**
     * Cambia el idioma actual y recarga las traducciones en la UI
     */
    async setLanguage(lang) {
        if (!CONFIG.SUPPORTED_LANGS.includes(lang)) return;

        try {
            const response = await fetch(`./locales/${lang}.json`);
            this.translations = await response.json();
            this.currentLang = lang;
            
            // Persistencia y metadatos
            localStorage.setItem(CONFIG.STORAGE_KEYS.LANG, lang);
            document.documentElement.lang = lang;

            this.translatePage();
        } catch (error) {
            console.error(`Error cargando el idioma: ${lang}`, error);
        }
    },

    /**
     * Traduce todos los elementos con data-i18n en el documento
     */
    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (translation) {
                // Si es un input, traducimos el placeholder
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });
    },

    /**
     * Obtiene una traducción por su clave (soporta puntos: "nav.login")
     * Soporta interpolación: t("key", { count: 3 }) reemplazará {count} por 3.
     */
    t(key, params = {}) {
        let translation = key.split('.').reduce((obj, i) => (obj ? obj[i] : null), this.translations);

        if (!translation) return key;

        // Interpolación simple: reemplaza {variable} con params.variable
        Object.keys(params).forEach(param => {
            const regex = new RegExp(`{${param}}`, 'g');
            translation = translation.replace(regex, params[param]);
        });

        return translation;
    }
};