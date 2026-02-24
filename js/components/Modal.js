import { i18n } from '../core/i18n.js';

export const Modal = {
    /**
     * Abre un modal con contenido dinámico
     * @param {string} title - Título del modal
     * @param {string} content - HTML del cuerpo del modal
     * @param {function} onConfirm - Callback opcional para el botón principal
     * @param {string} className - Clase CSS adicional
     */
    open: (title, content, onConfirm = null, className = '') => {
        // Eliminar modal previo si existe
        const oldModal = document.getElementById('modal-root');
        if (oldModal) oldModal.remove();

        // Crear estructura del modal
        const modalHtml = `
            <div class="modal-overlay" id="modal-root">
                <div class="modal-content card ${className}">
                    <div class="card-header">
                        <span class="label-tech">${title}</span>
                        <button class="btn-close" id="modal-close">&times;</button>
                    </div>
                    <div class="card-body">
                        ${content}
                    </div>
                    ${onConfirm ? `
                        <div class="card-footer" style="padding: 15px; border-top: 1px solid var(--card-border); display: flex; justify-content: flex-end; gap: 10px;">
                            <button class="btn" id="modal-cancel">${i18n.t('ui.cancel')}</button>
                            <button class="btn btn-accent" id="modal-confirm">${i18n.t('ui.confirm')}</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Eventos de cierre
        const closeModal = () => document.getElementById('modal-root').remove();
        
        document.getElementById('modal-close').onclick = closeModal;
        document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
        
        // Cerrar al hacer click fuera
        document.getElementById('modal-root').onclick = (e) => {
            if (e.target.id === 'modal-root') closeModal();
        };

        // Evento de confirmación
        if (onConfirm) {
            document.getElementById('modal-confirm').onclick = () => {
                onConfirm();
            };
        }
    },

    close: () => {
        const modal = document.getElementById('modal-root');
        if (modal) modal.remove();
    },

    /**
     * Muestra un aviso informativo (reemplazo de alert)
     */
    info: (message, title = i18n.t("lfg.req_info"), className = "") => {
        return new Promise((resolve) => {
            Modal.open(title, `<div style="text-align: center; padding: 20px 0;">${message}</div>`, () => {
                Modal.close();
                resolve();
            }, "modal-alert " + className);
            
            const closeBtn = document.getElementById('modal-close');
            if (closeBtn) closeBtn.onclick = () => { Modal.close(); resolve(); };
            
            const cancelBtn = document.getElementById('modal-cancel');
            if (cancelBtn) cancelBtn.style.display = 'none';
        });
    },

    /**
     * Muestra un aviso de error
     */
    error: (message, title = "ERROR", className = "") => {
        return new Promise((resolve) => {
            Modal.open(title, `<div style="text-align: center; padding: 20px 0; color: #ff6b6b;">${message}</div>`, () => {
                Modal.close();
                resolve();
            }, "modal-alert modal-error-border " + className);
            
            const closeBtn = document.getElementById('modal-close');
            if (closeBtn) closeBtn.onclick = () => { Modal.close(); resolve(); };

            const cancelBtn = document.getElementById('modal-cancel');
            if (cancelBtn) cancelBtn.style.display = 'none';
        });
    },

    /**
     * Muestra un diálogo de confirmación (reemplazo de confirm)
     */
    confirm: (message, title = i18n.t("ui.confirm"), className = "") => {
        return new Promise((resolve) => {
            Modal.open(title, `<div style="text-align: center; padding: 20px 0;">${message}</div>`, () => {
                Modal.close();
                resolve(true);
            }, "modal-confirm " + className);

            const cancelBtn = document.getElementById('modal-cancel');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    Modal.close();
                    resolve(false);
                };
            }

            const closeBtn = document.getElementById('modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    Modal.close();
                    resolve(false);
                };
            }
        });
    }
};

// Global event listener to close modals with the Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) {
            const cancelBtn = document.getElementById('modal-cancel');
            const closeBtn = document.getElementById('modal-close');
            
            // Si hay botón de cancelar visible, actuamos como si lo pulsaran
            if (cancelBtn && cancelBtn.style.display !== 'none') {
                cancelBtn.click();
            } else if (closeBtn) {
                closeBtn.click();
            } else {
                Modal.close();
            }
        }
    }
});