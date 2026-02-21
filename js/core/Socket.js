import { CONFIG } from '../config.js';
import { Header } from '../components/Header.js';

/**
 * Socket.js - Gestor de WebSockets (Socket.io)
 * Maneja la conexión, identificación del usuario y salas de grupos.
 */
export const Socket = {
    io: null,
    currentRoom: null,

    init() {
        if (this.io) return;

        console.log("🔌 [Socket] Iniciando conexión con:", CONFIG.API_URL);
        
        // Asumiendo que socket.io.min.js está cargado vía <script> en index.html
        if (typeof io === 'undefined') {
            console.error("❌ [Socket] socket.io.js no encontrado en el scope global.");
            return;
        }

        this.io = io(CONFIG.API_URL, {
            transports: ['websocket', 'polling']
        });

        this.io.on('connect', () => {
            console.log("✅ [Socket] Conectado con ID:", this.io.id);
            this.identify();
        });

        this.io.on('debug_echo', (msg) => {
            console.debug("💬 [Socket Debug]", msg);
        });
        // NOTE: new_notification is handled exclusively by NotificationSystem
    },

    identify() {
        if (!this.io) return;
        const user = Header.getUserFromToken();
        if (user && user.id) {
            console.log("👤 [Socket] Identificando usuario:", user.id);
            this.io.emit('identify', user.id);
        }
    },

    joinGroup(groupId) {
        if (!this.io || !groupId) return;
        if (this.currentRoom === groupId) return;
        
        this.leaveCurrentGroup();
        this.currentRoom = groupId;
        console.log("📡 [Socket] Uniéndose a sala de grupo:", groupId);
        this.io.emit('join_group', groupId);
    },

    leaveCurrentGroup() {
        if (!this.io || !this.currentRoom) return;
        console.log("📡 [Socket] Saliendo de sala de grupo:", this.currentRoom);
        this.io.emit('leave_group', this.currentRoom);
        this.currentRoom = null;
    },

    on(event, callback) {
        if (!this.io) return;
        this.io.on(event, callback);
    },

    off(event, callback) {
        if (!this.io) return;
        this.io.off(event, callback);
    }
};
