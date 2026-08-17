const DetailApp = (() => {
    function init() {
        if (!Auth.requireAuth()) return;

        const params = new URLSearchParams(window.location.search);
        const codigo = params.get('id');

        if (!codigo) {
            renderError('No s\'ha especificat cap negoci.');
            return;
        }

        DataManager.loadODS()
            .then(businesses => {
                const business = businesses.find(b => b.codigo === codigo);
                if (!business) {
                    renderError('No s\'ha trobat el negoci especificat.');
                    return;
                }

                document.title = `${business.nombre || 'Negoci'} - SalutMap`;
                renderDetail(business);
                renderMap(business);
            })
            .catch(err => {
                renderError('No s\'han pogut carregar les dades.');
            });
    }

    function renderDetail(b) {
        const container = document.getElementById('detailContent');
        const addressParts = [];
        if (b.direccion) addressParts.push(b.direccion);
        if (b.codigoPostal || b.poblacion) {
            addressParts.push([b.codigoPostal, b.poblacion].filter(Boolean).join(' '));
        }
        if (b.region) addressParts.push(b.region);
        if (b.pais) addressParts.push(b.pais);

        const fullAddress = addressParts.join(', ') || 'No disponible';

        container.innerHTML = `
            <div class="detail-card">
                <h1>${escapeHtml(b.nombre || 'Sense nom')}</h1>
                <div class="detail-type">${escapeHtml(b.tipo || 'Desconegut')}</div>

                <div class="detail-grid">
                    <div class="detail-field">
                        <span class="detail-label">Codi</span>
                        <span class="detail-value">${escapeHtml(b.codigo)}</span>
                    </div>

                    ${b.telefono ? `
                    <div class="detail-field">
                        <span class="detail-label">Telèfon</span>
                        <span class="detail-value">
                            <a href="tel:${escapeHtml(b.telefono)}">${escapeHtml(b.telefono)}</a>
                        </span>
                    </div>
                    ` : ''}

                    ${b.cadena ? `
                    <div class="detail-field">
                        <span class="detail-label">Cadena / Agrupació</span>
                        <span class="detail-value">${escapeHtml(b.cadena)}</span>
                    </div>
                    ` : ''}

                    ${b.potencial ? `
                    <div class="detail-field">
                        <span class="detail-label">Potencial</span>
                        <span class="detail-value">${escapeHtml(b.potencial)}</span>
                    </div>
                    ` : ''}

                    <div class="detail-field full-width">
                        <span class="detail-label">Adreça completa</span>
                        <span class="detail-value">${escapeHtml(fullAddress)}</span>
                    </div>

                    ${b.codigoPostal ? `
                    <div class="detail-field">
                        <span class="detail-label">Codi Postal</span>
                        <span class="detail-value">${escapeHtml(b.codigoPostal)}</span>
                    </div>
                    ` : ''}

                    ${b.poblacion ? `
                    <div class="detail-field">
                        <span class="detail-label">Població</span>
                        <span class="detail-value">${escapeHtml(b.poblacion)}</span>
                    </div>
                    ` : ''}

                    ${b.region ? `
                    <div class="detail-field">
                        <span class="detail-label">Regió</span>
                        <span class="detail-value">${escapeHtml(b.region)}</span>
                    </div>
                    ` : ''}

                    ${b.pais ? `
                    <div class="detail-field">
                        <span class="detail-label">País</span>
                        <span class="detail-value">${escapeHtml(b.pais)}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="detail-actions">
                    <a href="./index.html" class="detail-btn detail-btn-outline">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Tornar al mapa
                    </a>
                    <a href="./index.html?id=${encodeURIComponent(b.codigo)}&route=true" class="detail-btn detail-btn-success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Com arribar
                    </a>
                </div>
            </div>
        `;
    }

    function renderMap(business) {
        const mapEl = document.getElementById('detailMap');

        if (business.lat === null || business.lng === null) {
            mapEl.innerHTML = `
                <div class="no-location">
                    <p>No hi ha coordenades disponibles per aquest negoci.</p>
                </div>
            `;
            return;
        }

        const map = L.map('detailMap', {
            zoomControl: true,
            scrollWheelZoom: false
        }).setView([business.lat, business.lng], 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        const color = getMarkerColor(business.tipo);
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 28px; height: 36px;
                position: relative;
            ">
                <div style="
                    width: 28px; height: 28px;
                    background: ${color};
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                ">
                    <div style="
                        width: 10px; height: 10px;
                        background: white;
                        border-radius: 50%;
                        position: absolute;
                        top: 50%; left: 50%;
                        transform: translate(-50%, -50%) rotate(45deg);
                    "></div>
                </div>
            </div>`,
            iconSize: [28, 36],
            iconAnchor: [14, 36],
            popupAnchor: [0, -36]
        });

        L.marker([business.lat, business.lng], { icon })
            .addTo(map)
            .bindPopup(`<b>${escapeHtml(business.nombre || '')}</b>`)
            .openPopup();

        setTimeout(() => map.invalidateSize(), 100);
    }

    function getMarkerColor(tipo) {
        if (!tipo) return '#64748b';
        const t = tipo.toLowerCase();
        if (t.includes('farm')) return '#10b981';
        if (t.includes('dental') || t.includes('dent')) return '#8b5cf6';
        if (t.includes('clin')) return '#0891b2';
        return '#f59e0b';
    }

    function renderError(message) {
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-card" style="text-align:center;padding:48px 24px;">
                <p style="font-size:16px;color:var(--text-secondary);">${escapeHtml(message)}</p>
                <a href="./index.html" class="detail-btn detail-btn-primary" style="margin-top:20px;display:inline-flex;">
                    Tornar al mapa
                </a>
            </div>
        `;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => DetailApp.init());
