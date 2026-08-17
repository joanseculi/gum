const SearchManager = (() => {
    let searchTimeout = null;

    function setupSearch(elements, callbacks) {
        const { searchInput, clearSearch, typeFilter, regionFilter, resultsList, resultCount, showAllBtn } = elements;
        const { onSearch, onSelectBusiness, onShowAll } = callbacks;

        searchInput.addEventListener('input', () => {
            clearSearch.style.display = searchInput.value ? 'flex' : 'none';
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                onSearch(searchInput.value, typeFilter.value, regionFilter.value);
            }, 150);
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch.style.display = 'none';
            onSearch('', typeFilter.value, regionFilter.value);
            searchInput.focus();
        });

        typeFilter.addEventListener('change', () => {
            onSearch(searchInput.value, typeFilter.value, regionFilter.value);
        });

        regionFilter.addEventListener('change', () => {
            onSearch(searchInput.value, typeFilter.value, regionFilter.value);
        });

        showAllBtn.addEventListener('click', () => {
            searchInput.value = '';
            typeFilter.value = '';
            regionFilter.value = '';
            clearSearch.style.display = 'none';
            onShowAll();
        });
    }

    function renderResults(businesses, resultsList, resultCount, selectedCode, onSelect) {
        resultCount.textContent = `${businesses.length} resultat${businesses.length !== 1 ? 's' : ''}`;

        if (businesses.length === 0) {
            resultsList.innerHTML = `
                <div class="empty-state">
                    <p class="empty-title">No s'han trobat negocis</p>
                    <p>Prova amb un altre terme de cerca.</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        businesses.forEach(b => {
            const card = document.createElement('div');
            card.className = 'result-card' + (b.codigo === selectedCode ? ' active' : '');
            card.dataset.codigo = b.codigo;

            const addressParts = [];
            if (b.direccion) addressParts.push(b.direccion);
            if (b.codigoPostal || b.poblacion) {
                addressParts.push([b.codigoPostal, b.poblacion].filter(Boolean).join(' '));
            }

            card.innerHTML = `
                <div class="result-card-name">${escapeHtml(b.nombre || 'Sense nom')}</div>
                <div class="result-card-type">${escapeHtml(b.tipo || 'Desconegut')}</div>
                <div class="result-card-address">${escapeHtml(addressParts.join(', ') || 'Sense adreça')}</div>
                ${b.telefono ? `<div class="result-card-phone">${escapeHtml(b.telefono)}</div>` : ''}
            `;

            card.addEventListener('click', () => onSelect(b));
            fragment.appendChild(card);
        });

        resultsList.innerHTML = '';
        resultsList.appendChild(fragment);
    }

    function renderLoading(resultsList) {
        resultsList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Carregant negocis...</p>
            </div>
        `;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showAllButton(showAllBtn, show) {
        showAllBtn.style.display = show ? 'inline' : 'none';
    }

    function scrollToResult(resultsList, codigo) {
        const card = resultsList.querySelector(`[data-codigo="${codigo}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    return {
        setupSearch, renderResults, renderLoading,
        showAllButton, scrollToResult
    };
})();
