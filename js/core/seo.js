import { i18n } from './i18n.js';

/**
 * SEO Utility
 * Manages document title and meta tags for social media embeds and search discovery.
 */
export const SEO = {
    _defaultTags: {
        title: 'Wakfu LFG - Buscador de Grupos',
        description: 'Encuentra grupo para mazmorras en Wakfu de forma rápida y sencilla.',
        image: `${window.location.origin}/assets/ui/og_image.jpg`,
        url: window.location.origin
    },

    /**
     * Update title and meta tags based on page data
     * @param {Object} data - SEO data (title, description, image, etc.)
     */
    update(data = {}) {
        const title = data.title || i18n.t('ui.app_title') || this._defaultTags.title;
        const description = data.description || this._defaultTags.description;
        const image = data.image || this._defaultTags.image;
        const url = data.url || (window.location.origin + window.location.hash);

        // Update Document Title
        document.title = title;

        // Update standard meta tags
        this._setMeta('description', description);

        // Update OpenGraph (Discord / Facebook / LinkedIn)
        this._setMeta('og:title', title, 'property');
        this._setMeta('og:description', description, 'property');
        this._setMeta('og:image', image, 'property');
        this._setMeta('og:url', url, 'property');
        this._setMeta('og:type', 'website', 'property');

        // Update Twitter Cards
        this._setMeta('twitter:card', 'summary_large_image');
        this._setMeta('twitter:title', title);
        this._setMeta('twitter:description', description);
        this._setMeta('twitter:image', image);

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
    }
};
