import { CONFIG } from '../config.js';
import { i18n } from './i18n.js';

/**
 * SEO Utility
 * Manages document title and meta tags for social media embeds and search discovery.
 */
export const SEO = {
    _defaultTags: {
        title: 'Wakfu LFG - Buscador de Grupos',
        description: 'Encuentra grupo para mazmorras en Wakfu de forma rápida y sencilla.',
        image: `https://wakfu.pcnetfs.moe${CONFIG.BASE_PATH}/assets/ui/og_image.jpg`,
        url: `https://wakfu.pcnetfs.moe${CONFIG.BASE_PATH}`,
        keywords: 'wakfu, lfg, groups, dungeons, mmo, tactical',
        author: 'Antigravity'
    },

    locales: {
        'es': 'es_ES',
        'en': 'en_US',
        'fr': 'fr_FR',
        'pt': 'pt_BR'
    },

    /**
     * Update title and meta tags based on page data
     * @param {Object} data - SEO data (title, description, image, etc.)
     */
    update(data = {}) {
        const lang = i18n.currentLang || CONFIG.DEFAULT_LANG;
        const title = data.title || i18n.t('ui.app_title') || this._defaultTags.title;
        const description = data.description || this._defaultTags.description;
        const image = data.image || this._defaultTags.image;
        const url = data.url || (window.location.origin + window.location.pathname + window.location.search);
        const keywords = data.keywords || this._defaultTags.keywords;

        // Update Document Title
        document.title = title;

        // Update standard meta tags
        this._setMeta('description', description);
        this._setMeta('keywords', keywords);
        this._setMeta('author', this._defaultTags.author);
        this._setMeta('robots', 'index, follow');

        // Update OpenGraph (Discord / Facebook / LinkedIn)
        this._setMeta('og:title', title, 'property');
        this._setMeta('og:description', description, 'property');
        this._setMeta('og:image', image, 'property');
        this._setMeta('og:url', url, 'property');
        this._setMeta('og:type', 'website', 'property');
        this._setMeta('og:site_name', 'Wakfu LFG', 'property');
        this._setMeta('og:locale', this.locales[lang] || 'es_ES', 'property');
        this._setMeta('og:image:alt', title, 'property');

        // Update Twitter Cards
        this._setMeta('twitter:card', 'summary_large_image');
        this._setMeta('twitter:title', title);
        this._setMeta('twitter:description', description);
        this._setMeta('twitter:image', image);
        this._setMeta('twitter:image:alt', title);

        // Update Theme Color
        this._setMeta('theme-color', '#1e1e2d');

        // Update Canonical Link
        this._setLink('canonical', url);

        console.debug(`[SEO] Page metadata updated: ${title}`);
    },

    _setMeta(name, content, attr = 'name') {
        if (!content) return;
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    },

    _setLink(rel, href) {
        if (!href) return;
        let el = document.querySelector(`link[rel="${rel}"]`);
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', rel);
            document.head.appendChild(el);
        }
        el.setAttribute('href', href);
    }
};
