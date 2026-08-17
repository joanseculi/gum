const MapManager = (() => {
    let map = null;
    let markerClusterGroup = null;
    let userMarker = null;
    let routeLine = null;
    const businessMarkers = {};

    function initMap() {
        map = L.map('map', {
            zoomControl: false
        }).setView([41.5, 1.5], 7);

        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            disableClusteringAtZoom: 16
        });
        map.addLayer(markerClusterGroup);

        return map;
    }

    function getMarkerColor(tipo) {
        if (!tipo) return '#64748b';
        const t = tipo.toLowerCase();
        if (t.includes('farm')) return '#10b981';
        if (t.includes('dental') || t.includes('dent')) return '#8b5cf6';
        if (t.includes('clin')) return '#0891b2';
        return '#f59e0b';
    }

    function getMarkerIcon(tipo) {
        const color = getMarkerColor(tipo);
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 12px; height: 12px;
                background: ${color};
                border: 2.5px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
            popupAnchor: [0, -8]
        });
    }

    function addBusinessMarkers(businesses, onSelect) {
        markerClusterGroup.clearLayers();
        Object.keys(businessMarkers).forEach(k => delete businessMarkers[k]);

        const validBounds = [];
        const icons = {};

        businesses.forEach(b => {
            if (b.lat === null || b.lng === null) return;

            const iconKey = b.tipo || 'default';
            if (!icons[iconKey]) {
                icons[iconKey] = getMarkerIcon(b.tipo);
            }

            const marker = L.marker([b.lat, b.lng], { icon: icons[iconKey] });

            const popupHtml = buildPopupHtml(b);
            marker.bindPopup(popupHtml, { maxWidth: 280, minWidth: 220 });

            marker.on('popupopen', () => {
                const detailBtn = document.getElementById(`detail-${b.codigo}`);
                const routeBtn = document.getElementById(`route-${b.codigo}`);
                if (detailBtn) {
                    detailBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = `./detail.html?id=${encodeURIComponent(b.codigo)}`;
                    });
                }
                if (routeBtn) {
                    routeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (onSelect) onSelect(b, 'route');
                    });
                }
            });

            marker._businessCode = b.codigo;
            markerClusterGroup.addLayer(marker);
            businessMarkers[b.codigo] = marker;
            validBounds.push([b.lat, b.lng]);
        });

        if (validBounds.length > 0) {
            map.fitBounds(validBounds, { padding: [40, 40] });
        }

        return validBounds.length;
    }

    function buildPopupHtml(b) {
        const addressParts = [b.direccion, b.codigoPostal ? `${b.codigoPostal} ${b.poblacion}` : b.poblacion].filter(Boolean);
        const address = addressParts.join(', ') || 'Sense adreça';

        return `
            <div class="marker-popup">
                <h3>${escapeHtml(b.nombre || 'Sense nom')}</h3>
                <div class="popup-type">${escapeHtml(b.tipo || 'Desconegut')}</div>
                <div class="popup-info">${escapeHtml(address)}</div>
                ${b.telefono ? `<div class="popup-info">${escapeHtml(b.telefono)}</div>` : ''}
                ${b.cadena ? `<div class="popup-info">${escapeHtml(b.cadena)}</div>` : ''}
                <div class="popup-actions">
                    <a href="./detail.html?id=${encodeURIComponent(b.codigo)}" class="popup-btn popup-btn-detail" id="detail-${b.codigo}">Veure informació</a>
                    <a href="#" class="popup-btn popup-btn-route" id="route-${b.codigo}">Com arribar</a>
                </div>
            </div>
        `;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function focusBusiness(business) {
        if (business.lat === null || business.lng === null) return false;

        map.setView([business.lat, business.lng], 16, { animate: true });

        const marker = businessMarkers[business.codigo];
        if (marker) {
            markerClusterGroup.zoomToShowLayer(marker, () => {
                marker.openPopup();
            });
        }
        return true;
    }

    function highlightBusiness(business) {
        Object.values(businessMarkers).forEach(m => {
            const el = m.getElement();
            if (el) el.style.opacity = '0.5';
        });

        const marker = businessMarkers[business.codigo];
        if (marker) {
            const el = marker.getElement();
            if (el) el.style.opacity = '1';
        }
    }

    function clearHighlight() {
        Object.values(businessMarkers).forEach(m => {
            const el = m.getElement();
            if (el) el.style.opacity = '1';
        });
    }

    function setUserLocation(lat, lng) {
        if (userMarker) {
            map.removeLayer(userMarker);
        }

        const icon = L.divIcon({
            className: 'user-marker',
            html: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        userMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
        userMarker.bindPopup('<b>La vostra ubicació</b>');
        return [lat, lng];
    }

    function getUserLocation() {
        if (!userMarker) return null;
        const ll = userMarker.getLatLng();
        return [ll.lat, ll.lng];
    }

    function drawRoute(coords) {
        clearRoute();
        if (!coords || coords.length < 2) return;

        routeLine = L.polyline(coords, {
            color: '#0891b2',
            weight: 5,
            opacity: 0.8,
            dashArray: null,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
    }

    function clearRoute() {
        if (routeLine) {
            map.removeLayer(routeLine);
            routeLine = null;
        }
    }

    function resetView(businesses) {
        if (businesses && businesses.length > 0) {
            const valid = businesses.filter(b => b.lat !== null && b.lng !== null);
            if (valid.length > 0) {
                const bounds = valid.map(b => [b.lat, b.lng]);
                map.fitBounds(bounds, { padding: [40, 40] });
            }
        }
    }

    function getMap() { return map; }

    return {
        initMap, addBusinessMarkers, focusBusiness, highlightBusiness,
        clearHighlight, setUserLocation, getUserLocation,
        drawRoute, clearRoute, resetView, getMap
    };
})();
