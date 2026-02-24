import { CONFIG } from '../config.js';

export const i18n = {
    currentLang: CONFIG.DEFAULT_LANG,
    translations: {},

    /**
     * Inicializa el sistema de idiomas
     */
    async init() {
        // 1. Detectar idioma: URL > LocalStorage > Navegador > Config Default
        const pathLang = this.getLangFromPath();
        const savedLang = localStorage.getItem(CONFIG.STORAGE_KEYS.LANG);
        const browserLang = navigator.language.split('-')[0];
        
        let langToLoad = pathLang || savedLang || browserLang;

        if (!CONFIG.SUPPORTED_LANGS.includes(langToLoad)) {
            langToLoad = CONFIG.DEFAULT_LANG;
        }

        // 2. Cargar INSTANTÁNEAMENTE desde caché si existe
        const cacheKey = `${CONFIG.STORAGE_KEYS.TRANSLATIONS}_${langToLoad}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                this.translations = JSON.parse(cached);
                this.currentLang = langToLoad;
                document.documentElement.lang = langToLoad;
                // Renderizado inmediato
                this.translatePage();
            } catch (e) {
                console.warn("i18n: Cache corrupto, se ignorará.");
            }
        }

        // 3. Cargar desde red para actualizar o si no hay caché
        if (this.currentLang === langToLoad && Object.keys(this.translations).length > 0) {
            this.setLanguage(langToLoad, true); // Background update
        } else {
            await this.setLanguage(langToLoad); // Blocking load
        }
    },

    /**
     * Extrae el código de idioma del path de la URL (ej: /es/finder -> es)
     */
    getLangFromPath() {
        let path = window.location.pathname;
        
        // Limpiamos el BASE_PATH si existe
        if (CONFIG.BASE_PATH && path.startsWith(CONFIG.BASE_PATH)) {
            path = path.replace(CONFIG.BASE_PATH, '');
        }
        
        if (!path.startsWith('/')) path = '/' + path;

        const parts = path.split('/');
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
    async setLanguage(lang, background = false) {
        if (!CONFIG.SUPPORTED_LANGS.includes(lang)) return;

        const loadTask = async () => {
            try {
                // Fetch con cache-busting sutil para asegurar frescura
                const response = await fetch(`./locales/${lang}.json?v=${Date.now()}`);
                const data = await response.json();
                
                const dataStr = JSON.stringify(data);
                const currentStr = JSON.stringify(this.translations);

                if (dataStr !== currentStr) {
                    this.translations = data;
                    this.currentLang = lang;
                    localStorage.setItem(`${CONFIG.STORAGE_KEYS.TRANSLATIONS}_${lang}`, dataStr);
                    localStorage.setItem(CONFIG.STORAGE_KEYS.LANG, lang);
                    document.documentElement.lang = lang;
                    this.translatePage();
                }
            } catch (error) {
                console.error(`i18n: Error cargando el idioma: ${lang}`, error);
            }
        };

        if (background) {
            loadTask();
        } else {
            await loadTask();
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