export const CONFIG = {
    APP_NAME: "Wakfu LFG",
    // BASE_PATH dinámico: detectamos si estamos en GitHub Pages (subdir) o root
    BASE_PATH: (window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/wakfu-lfg-web')) 
        ? '/wakfu-lfg-web' 
        : '',
    
    // URL de tu API Node.js (Backend)
    API_URL: "https://wakfu.pcnetfs.moe",
    
    // Endpoint de login directo de tu API
    DISCORD_LOGIN: "https://wakfu.pcnetfs.moe/auth/discord",

    // Reemplaza esto con el ID de tu aplicación en el Discord Developer Portal
    DISCORD_CLIENT_ID: "1450604810670833705",

    // URL donde Discord enviará el código (Debe estar en tu Panel de Discord)
    REDIRECT_URI: "https://wakfu.pcnetfs.moe/auth/discord/callback",
    
    SUPPORTED_LANGS: ['es', 'en', 'fr', 'pt'],
    DEFAULT_LANG: 'es',

    SERVERS: ['Ogrest', 'Rubilax', 'Pandora'],

    LEVEL_BRACKETS: [
        { min: 6, max: 20 }, { min: 21, max: 35 }, { min: 36, max: 50 },
        { min: 51, max: 65 }, { min: 66, max: 80 }, { min: 81, max: 95 },
        { min: 96, max: 110 }, { min: 111, max: 125 }, { min: 126, max: 140 },
        { min: 141, max: 155 }, { min: 156, max: 170 }, { min: 171, max: 185 },
        { min: 186, max: 200 }, { min: 201, max: 215 }, { min: 216, max: 230 },
        { min: 231, max: 245 }
    ],

    ROLES: ['tank', 'healer', 'damage', 'support'],
    DMG_TYPES: ['melee', 'distance'],
    ELEMENTS: ['earth', 'fire', 'air', 'water'],

    STORAGE_KEYS: {
        AUTH_TOKEN: 'lfg_token',
        USER_DATA: 'lfg_user',
        SETTINGS: 'lfg_settings',
        LANG: 'lfg_lang',
        TRANSLATIONS: 'lfg_translations',
        THEME: 'lfg_theme'
    }
};