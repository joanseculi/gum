const DataManager = (() => {
    const ODS_PATH = './Mapa.ods';

    function loadODS() {
        return fetch(ODS_PATH)
            .then(response => {
                if (!response.ok) throw new Error('No s\'ha pogut carregar Mapa.ods');
                return response.arrayBuffer();
            })
            .then(buffer => {
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                return parseRows(rows);
            });
    }

    function parseRows(rows) {
        if (rows.length < 2) return [];

        const businesses = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const codigo = cleanValue(row[1]);
            if (!codigo) continue;

            const lat = parseCoord(row[14]);
            const lng = parseCoord(row[15]);

            const business = {
                codigo: codigo,
                nombre: cleanValue(row[2]),
                tipo: cleanValue(row[3]),
                telefono: cleanValue(row[4]),
                cadena: cleanValue(row[5]),
                potencial: cleanValue(row[6]),
                direccion: cleanValue(row[7]),
                codigoPostal: cleanValue(row[10]),
                poblacion: cleanValue(row[11]),
                region: cleanValue(row[12]),
                pais: cleanValue(row[13]),
                lat: lat,
                lng: lng
            };

            businesses.push(business);
        }

        return businesses;
    }

    function cleanValue(val) {
        if (val === null || val === undefined) return '';
        return String(val).trim();
    }

    function parseCoord(val) {
        if (val === null || val === undefined || val === '') return null;
        const num = parseFloat(val);
        if (isNaN(num)) return null;
        if (num === 0) return null;
        return num;
    }

    function normalizeText(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function searchBusinesses(businesses, query, typeFilter, regionFilter) {
        let results = businesses;

        if (typeFilter) {
            results = results.filter(b => {
                const tipo = b.tipo.toLowerCase();
                if (typeFilter === 'Farmacia') return tipo.includes('farm');
                if (typeFilter === 'Clinica dental') return tipo.includes('dental') || tipo.includes('dent');
                if (typeFilter === 'Clinica') return tipo.includes('clin') && !tipo.includes('dental') && !tipo.includes('dent');
                if (typeFilter === 'Otro') return !tipo.includes('farm') && !tipo.includes('clin') && !tipo.includes('dental') && !tipo.includes('dent');
                return true;
            });
        }

        if (regionFilter) {
            results = results.filter(b => {
                const region = b.region.toLowerCase();
                return region.includes(regionFilter.toLowerCase());
            });
        }

        if (query && query.trim().length > 0) {
            const q = normalizeText(query);
            const terms = q.split(/\s+/).filter(t => t.length > 0);

            results = results.filter(b => {
                const searchable = normalizeText([
                    b.codigo, b.nombre, b.tipo, b.telefono,
                    b.cadena, b.direccion, b.codigoPostal,
                    b.poblacion, b.region, b.pais
                ].join(' '));
                return terms.every(term => searchable.includes(term));
            });
        }

        return results;
    }

    return { loadODS, searchBusinesses, normalizeText };
})();
