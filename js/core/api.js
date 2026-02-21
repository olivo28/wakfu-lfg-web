import { CONFIG } from '../config.js';

let masterClassesCache = null;

export const API = {
    /**
     * Wrapper base para fetch con JWT
     */
    async request(endpoint, options = {}) {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        // Manejo de sesión expirada
        if (response.status === 401) {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
            window.location.hash = '#/login';
            return;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error en servidor' }));
            throw new Error(error.message || 'Error de red');
        }

        return response.json();
    },

    // ==========================================================================
    // 1. GESTIÓN DE PERSONAJES (Tabla: users_chars)
    // ==========================================================================
    
    // Obtener todos mis personajes
    getMyCharacters: () => API.request('/characters/me'),

    // Registrar nuevo personaje
    createCharacter: (charData) => API.request('/characters', {
        method: 'POST',
        body: JSON.stringify(charData)
    }),

    // Actualizar personaje
    updateCharacter: (id, charData) => API.request(`/characters/${id}`, {
        method: 'PUT',
        body: JSON.stringify(charData)
    }),

    // Eliminar personaje
    deleteCharacter: (id) => API.request(`/characters/${id}`, {
        method: 'DELETE'
    }),

    // ==========================================================================
    // 2. BUSCADOR DE GRUPOS (Tabla: lfg_data)
    // ==========================================================================

    // Obtener lista de grupos activos (opcional con filtros de servidor/nivel/estado)
    getGroups: (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return API.request(`/lfg?${query}`);
    },

    // Obtener detalle de un grupo específico
    getGroup: (id) => API.request(`/lfg/${id}`),

    // Publicar una oferta de grupo
    createGroup: (groupData) => API.request('/lfg', {
        method: 'POST',
        body: JSON.stringify(groupData)
    }),

    // Actualizar un grupo (Líder)
    updateGroup: (groupId, groupData) => API.request(`/lfg/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(groupData)
    }),

    // Cerrar un grupo (Líder)
    closeGroup: (groupId, completed = false) => API.request(`/lfg/${groupId}${completed ? '?completed=true' : ''}`, {
        method: 'DELETE'
    }),

    deleteGroup: (groupId, completed = false) => API.request(`/lfg/${groupId}${completed ? '?completed=true' : ''}`, {
        method: 'DELETE'
    }),

    getStats: () => API.request('/lfg/stats'),

    removeMember: (groupId, charId) => API.request(`/lfg/${groupId}/members/${charId}`, {
        method: 'DELETE'
    }),

    // ==========================================================================
    // 3. GESTIÓN DE SOLICITUDES (LFG)
    // ==========================================================================
    joinGroup: (groupId, characterId) => API.request(`/lfg/${groupId}/join`, {
        method: 'POST',
        body: JSON.stringify({ characterId })
    }),

    getSentRequests: () => API.request('/lfg/requests/sent'),

    getReceivedRequests: () => API.request('/lfg/requests/received'),

    processRequest: (requestId, decision) => API.request(`/lfg/requests/${requestId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision })
    }),

    // ==========================================================================
    // 4. NOTIFICACIONES
    // ==========================================================================
    getNotifications: () => API.request('/notifications'),

    markNotificationsRead: () => API.request('/notifications/mark-read', {
        method: 'POST'
    }),

    dismissNotification: (id) => API.request(`/notifications/${id}`, { method: 'DELETE' }),
    markNotificationAsRead: (id) => API.request(`/notifications/${id}/read`, { method: 'PATCH' }),

    cancelRequest: (id) => API.request(`/lfg/requests/${id}`, { method: 'DELETE' }),

    // ==========================================================================
    // 5. DATOS ESTÁTICOS
    // ==========================================================================
    getDungeons: () => fetch('./assets/data/mazmos.json').then(r => r.json()),
    
    getClasses: async () => {
        if (masterClassesCache) return masterClassesCache;
        const res = await fetch('./assets/data/clases.json');
        masterClassesCache = await res.json();
        return masterClassesCache;
    },

    getClassesSync: () => masterClassesCache
};