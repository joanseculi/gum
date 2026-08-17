const RoutingManager = (() => {
    let currentRouteMode = null;

    function requestUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalització no disponible'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                error => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error('Permís de localització denegat'));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('Ubicació no disponible'));
                            break;
                        case error.TIMEOUT:
                            reject(new Error('Temps d\'espera exhaurit'));
                            break;
                        default:
                            reject(new Error('Error desconegut de localització'));
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
            );
        });
    }

    function calculateRoute(startLat, startLng, endLat, endLng, mode) {
        const profileMap = {
            car: 'driving',
            bike: 'cycling',
            foot: 'walking'
        };

        const profile = profileMap[mode] || 'driving';
        const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

        return fetch(url)
            .then(r => {
                if (!r.ok) throw new Error('Error del servei de routing');
                return r.json();
            })
            .then(data => {
                if (!data.routes || data.routes.length === 0) {
                    throw new Error('No s\'ha trobat cap ruta');
                }

                const route = data.routes[0];
                const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
                const distance = formatDistance(route.distance);
                const duration = formatDuration(route.duration);

                return { coords, distance, duration, profile };
            });
    }

    function formatDistance(meters) {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    }

    function formatDuration(seconds) {
        if (seconds < 60) return 'Menys d\'1 minut';
        if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
        const h = Math.floor(seconds / 3600);
        const m = Math.round((seconds % 3600) / 60);
        return `${h}h ${m}min`;
    }

    function getTransportLabel(mode) {
        const labels = { car: 'Cotxe', bike: 'Bicicleta', foot: 'A peu' };
        return labels[mode] || mode;
    }

    return { requestUserLocation, calculateRoute, getTransportLabel, formatDistance, formatDuration };
})();
