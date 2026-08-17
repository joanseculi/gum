const App = (() => {
    let state = {
        businesses: [],
        filteredBusinesses: [],
        selectedBusiness: null,
        userLocation: null
    };

    function init() {
        if (!Auth.requireAuth()) return;

        setupUI();
        initializeMap();
        loadData();
        setupUserLocation();
    }

    function setupUI() {
        document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());

        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && e.target !== sidebarToggle && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        document.getElementById('locateBtn').addEventListener('click', () => {
            setupUserLocation(true);
        });

        SearchManager.setupSearch({
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            typeFilter: document.getElementById('typeFilter'),
            regionFilter: document.getElementById('regionFilter'),
            resultsList: document.getElementById('resultsList'),
            resultCount: document.getElementById('resultCount'),
            showAllBtn: document.getElementById('showAllBtn')
        }, {
            onSearch: handleSearch,
            onSelectBusiness: handleSelectBusiness,
            onShowAll: handleShowAll
        });

        setupRoutePanel();
    }

    function initializeMap() {
        MapManager.initMap();
    }

    function loadData() {
        SearchManager.renderLoading(document.getElementById('resultsList'));

        DataManager.loadODS()
            .then(businesses => {
                state.businesses = businesses;
                state.filteredBusinesses = [...businesses];

                const count = MapManager.addBusinessMarkers(businesses, handleSelectBusiness);
                SearchManager.renderResults(
                    state.filteredBusinesses,
                    document.getElementById('resultsList'),
                    document.getElementById('resultCount'),
                    null,
                    handleSelectBusiness
                );
                SearchManager.showAllButton(document.getElementById('showAllBtn'), false);

                handleDeepLink();
            })
            .catch(error => {
                console.error('Error carregant dades:', error);
                document.getElementById('resultsList').innerHTML = `
                    <div class="empty-state">
                        <p class="empty-title">Error de càrrega</p>
                        <p>No s'han pogut carregar les dades.<br>Comprova que el fitxer Mapa.ods existeixi.</p>
                    </div>
                `;
                document.getElementById('resultCount').textContent = 'Error de càrrega';
            });
    }

    function handleSearch(query, typeFilter, regionFilter) {
        state.filteredBusinesses = DataManager.searchBusinesses(
            state.businesses, query, typeFilter, regionFilter
        );

        const hasFilter = query || typeFilter || regionFilter;
        SearchManager.showAllButton(document.getElementById('showAllBtn'), hasFilter);

        MapManager.addBusinessMarkers(state.filteredBusinesses, handleSelectBusiness);
        SearchManager.renderResults(
            state.filteredBusinesses,
            document.getElementById('resultsList'),
            document.getElementById('resultCount'),
            state.selectedBusiness ? state.selectedBusiness.codigo : null,
            handleSelectBusiness
        );
    }

    function handleSelectBusiness(business, action) {
        state.selectedBusiness = business;

        if (action === 'route') {
            showRoutePanel(business);
            return;
        }

        const focused = MapManager.focusBusiness(business);
        if (focused) {
            MapManager.highlightBusiness(business);
        }

        SearchManager.renderResults(
            state.filteredBusinesses,
            document.getElementById('resultsList'),
            document.getElementById('resultCount'),
            business.codigo,
            handleSelectBusiness
        );

        SearchManager.scrollToResult(document.getElementById('resultsList'), business.codigo);

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    function handleShowAll() {
        state.selectedBusiness = null;
        state.filteredBusinesses = [...state.businesses];

        MapManager.clearHighlight();
        MapManager.clearRoute();
        MapManager.addBusinessMarkers(state.filteredBusinesses, handleSelectBusiness);
        MapManager.resetView(state.filteredBusinesses);

        SearchManager.renderResults(
            state.filteredBusinesses,
            document.getElementById('resultsList'),
            document.getElementById('resultCount'),
            null,
            handleSelectBusiness
        );
        SearchManager.showAllButton(document.getElementById('showAllBtn'), false);
        hideRoutePanel();
    }

    function setupUserLocation(manual) {
        RoutingManager.requestUserLocation()
            .then(loc => {
                state.userLocation = loc;
                MapManager.setUserLocation(loc.lat, loc.lng, manual);
            })
            .catch(err => {
                if (manual) {
                    const msg = document.getElementById('resultCount');
                    msg.textContent = 'Ubicació no disponible';
                    setTimeout(() => {
                        msg.textContent = `${state.filteredBusinesses.length} resultat${state.filteredBusinesses.length !== 1 ? 's' : ''}`;
                    }, 3000);
                }
            });
    }

    function setupRoutePanel() {
        document.getElementById('closeRoute').addEventListener('click', () => {
            hideRoutePanel();
            MapManager.clearRoute();
            MapManager.clearHighlight();
        });

        document.querySelectorAll('.transport-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                calculateRoute(mode);
            });
        });
    }

    function showRoutePanel(business) {
        const panel = document.getElementById('routePanel');
        const dest = document.getElementById('routeDestination');
        const info = document.getElementById('routeInfo');
        const error = document.getElementById('routeError');

        panel.style.display = 'block';
        dest.textContent = business.nombre || 'Negoci seleccionat';
        info.style.display = 'none';
        error.style.display = 'none';

        document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));

        if (!state.userLocation) {
            error.textContent = 'No tens ubicació activada. Prem el botó "Ubicació" per activar-la.';
            error.style.display = 'block';
        }
    }

    function hideRoutePanel() {
        document.getElementById('routePanel').style.display = 'none';
    }

    function handleDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const shouldRoute = params.get('route') === 'true';

        if (id) {
            const business = state.businesses.find(b => b.codigo === id);
            if (business) {
                handleSelectBusiness(business);
                if (shouldRoute) {
                    setTimeout(() => showRoutePanel(business), 500);
                }
                window.history.replaceState({}, '', './index.html');
            }
        }
    }

    function calculateRoute(mode) {
        const info = document.getElementById('routeInfo');
        const error = document.getElementById('routeError');
        info.style.display = 'none';
        error.style.display = 'none';

        if (!state.userLocation) {
            error.textContent = 'No tens ubicació activada. Prem el botó "Ubicació" per activar-la.';
            error.style.display = 'block';
            return;
        }

        if (!state.selectedBusiness || state.selectedBusiness.lat === null) {
            error.textContent = 'El negoci seleccionat no té coordenades disponibles.';
            error.style.display = 'block';
            return;
        }

        info.textContent = 'Calculant ruta...';
        info.style.display = 'block';

        RoutingManager.calculateRoute(
            state.userLocation.lat, state.userLocation.lng,
            state.selectedBusiness.lat, state.selectedBusiness.lng,
            mode
        ).then(route => {
            MapManager.drawRoute(route.coords);
            info.innerHTML = `
                <strong>${RoutingManager.getTransportLabel(mode)}</strong><br>
                Distància: ${route.distance}<br>
                Temps estimat: ${route.duration}
            `;
            info.style.display = 'block';
        }).catch(err => {
            error.textContent = err.message || 'No s\'ha pogut calcular la ruta.';
            error.style.display = 'block';
            info.style.display = 'none';
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
