export const Footer = {
    render: async () => {
        return `
            <div class="footer-content">
                <p>&copy; ${new Date().getFullYear()} - Wakfu LFG</p>
                <p>Prototipo para la comunidad de Wakfu</p>
            </div>
        `;
    }
};