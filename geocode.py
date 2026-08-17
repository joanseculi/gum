#!/usr/bin/env python3
"""
Geocodificador offline per a SalutMap.

Llegeix Mapa.ods, geocodia els negocis sense coordenades,
i guarda lat/lng a les columnes O i P.

Ús:
    pip install odfpy requests
    python geocode.py

Executar sempre que s'afegeixin negocis nous a Mapa.ods.
El script és incremental: només geocodia negocis sense coordenades.
"""

import sys
import time
import requests
from odf.opendocument import load
from odf.table import Table, TableRow, TableCell
from odf.text import P

ODS_PATH = 'Mapa.ods'
NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
NOMINATIM_DELAY = 1.1

# Column indices (0-based)
COL_CODIGO = 1      # B
COL_DIRECCION = 7   # H
COL_LAT = 14        # O
COL_LNG = 15        # P
COL_CP = 10         # K
COL_POBLACION = 11  # L

HEADERS = {
    'User-Agent': 'SalutMapGeocoder/1.0 (projecte-educatiu)',
    'Accept-Language': 'ca'
}

# Common Spanish/Catalan street abbreviations -> full name
ABBREVIATIONS = {
    r'\bCL\.?\b': 'Carrer',
    r'\bC/\.?\b': 'Carrer',
    r'\bC\.?\s': 'Carrer ',
    r'\bAV\.?\b': 'Avinguda',
    r'\bAVDA\.?\b': 'Avinguda',
    r'\bPL\.?\b': 'Placa',
    r'\bPZA\.?\b': 'Placa',
    r'\bPG\.?\b': 'Passeig',
    r'\bPTGE\.?\b': 'Passatge',
    r'\bTR\.?\b': 'Travessera',
    r'\bRD\.?\b': 'Ronda',
    r'\bPLA\.?\b': 'Placa',
}

import re


def normalize_address(raw_address):
    """Normalize address for Nominatim: expand abbreviations, fix case."""
    addr = raw_address.strip()

    # Expand abbreviations
    for pattern, replacement in ABBREVIATIONS.items():
        addr = re.sub(pattern, replacement, addr, flags=re.IGNORECASE)

    # Remove extra periods and clean spaces
    addr = re.sub(r'\.', '', addr)
    addr = re.sub(r'\s+', ' ', addr).strip()

    # Title case (but keep numbers as-is)
    words = addr.split()
    normalized = []
    for w in words:
        if w.isdigit() or re.match(r'^\d', w):
            normalized.append(w)
        else:
            normalized.append(w.capitalize())
    addr = ' '.join(normalized)

    return addr


def get_cell_text(cell):
    """Extract plain text from an ODS cell."""
    paragraphs = cell.getElementsByType(P)
    if not paragraphs:
        return ''
    parts = []
    for p in paragraphs:
        if p.firstChild:
            parts.append(str(p.firstChild.data) if hasattr(p.firstChild, 'data') else str(p.firstChild))
    return ' '.join(parts).strip()


def set_cell_text(cell, value):
    """Set plain text in an ODS cell, clearing existing content."""
    for child in list(cell.childNodes):
        cell.removeChild(child)
    p = P(text=str(value))
    cell.addElement(p)


def get_cells_with_positions(row):
    """Get list of (column_index, cell) for all cells in the row.
    Handles numbercolumnsrepeated correctly."""
    cells = row.getElementsByType(TableCell)
    result = []
    col = 0
    for cell in cells:
        repeated = cell.getAttribute('numbercolumnsrepeated')
        rep_count = int(repeated) if repeated else 1
        result.append((col, cell, rep_count))
        col += rep_count
    return result, col


def set_column_value(row, target_col, value):
    """Set a value at target_col in the row. Handles repeated cells."""
    cell_list, total_cols = get_cells_with_positions(row)

    for col, cell, rep_count in cell_list:
        # Target is within this cell's range
        if col <= target_col < col + rep_count:
            before = target_col - col
            after = (col + rep_count) - target_col - 1

            # Get existing text to check if already has value
            existing = get_cell_text(cell)
            if existing and value == '':
                return  # Don't overwrite existing with empty

            if rep_count == 1:
                # Simple case: cell is exactly at target
                set_cell_text(cell, value)
                return
            else:
                # Need to split the repeated cell
                # Remove original cell
                row.removeChild(cell)

                # Insert cells before target (if any)
                if before > 0:
                    before_cell = TableCell()
                    before_cell.setAttribute('numbercolumnsrepeated', str(before))
                    row.addElement(before_cell)

                # Insert the target cell with value
                target_cell = TableCell()
                set_cell_text(target_cell, value)
                row.addElement(target_cell)

                # Insert cells after target (if any)
                if after > 0:
                    after_cell = TableCell()
                    after_cell.setAttribute('numbercolumnsrepeated', str(after))
                    row.addElement(after_cell)

                return

    # Target column doesn't exist - need to add cells to fill gap
    gap = target_col - total_cols
    if gap > 0:
        gap_cell = TableCell()
        gap_cell.setAttribute('numbercolumnsrepeated', str(gap))
        row.addElement(gap_cell)

    # Now add the target cell
    target_cell = TableCell()
    set_cell_text(target_cell, value)
    row.addElement(target_cell)


def build_address(row):
    """Build address for geocoding: just address + postal code + city."""
    cell_list, _ = get_cells_with_positions(row)
    cells_dict = {}
    for col, cell, rep in cell_list:
        if rep == 1:
            cells_dict[col] = get_cell_text(cell)

    parts = []
    direccion = cells_dict.get(COL_DIRECCION, '')
    cp = cells_dict.get(COL_CP, '')
    poblacion = cells_dict.get(COL_POBLACION, '')

    if direccion:
        parts.append(direccion)
    if cp:
        parts.append(cp)
    if poblacion:
        parts.append(poblacion)

    return ', '.join(parts)


def build_normalized_address(row):
    """Build and normalize address for geocoding."""
    raw = build_address(row)
    return normalize_address(raw)


def geocode(address):
    """Query Nominatim with multiple address variations."""
    # Build multiple query variations
    normalized = normalize_address(address)
    parts = [p.strip() for p in address.split(',')]

    queries = []
    # Full normalized address
    queries.append(normalized)
    # Address + CP + city (without street number if present)
    if len(parts) >= 2:
        queries.append(f"{parts[0]}, {parts[-1]}")
    # Just street + city
    if len(parts) >= 3:
        queries.append(f"{parts[0]}, {parts[-1]}")
    # Normalized without number
    no_number = re.sub(r',?\s*\d+\s*$', '', normalized)
    if no_number != normalized:
        queries.append(no_number)

    seen = set()
    for q in queries:
        q = q.strip()
        if not q or q in seen:
            continue
        seen.add(q)
        try:
            resp = requests.get(
                NOMINATIM_URL,
                params={'format': 'json', 'q': q, 'limit': 1},
                headers=HEADERS,
                timeout=10
            )
            resp.raise_for_status()
            data = resp.json()
            if data and len(data) > 0:
                return float(data[0]['lat']), float(data[0]['lon'])
        except Exception as e:
            print(f"  Error: {e}")
        time.sleep(NOMINATIM_DELAY)

    return None, None


def main():
    print(f"Carregant {ODS_PATH}...")
    try:
        doc = load(ODS_PATH)
    except Exception as e:
        print(f"Error carregant l'ODS: {e}")
        sys.exit(1)

    spreadsheet = doc.spreadsheet
    tables = spreadsheet.getElementsByType(Table)
    if not tables:
        print("No s'ha trobat cap full de calcul.")
        sys.exit(1)

    sheet = tables[0]
    rows = sheet.getElementsByType(TableRow)

    if len(rows) < 2:
        print("El full es buit o nomes te capcalera.")
        sys.exit(0)

    geocoded_count = 0
    skipped_count = 0
    failed_count = 0
    total = len(rows) - 1

    print(f"Processant {total} files...\n")

    for i, row in enumerate(rows[1:], start=1):
        cell_list, _ = get_cells_with_positions(row)
        cells_dict = {}
        for col, cell, rep in cell_list:
            if rep == 1:
                cells_dict[col] = cell

        # Get codigo
        codigo_cell = cells_dict.get(COL_CODIGO)
        if not codigo_cell:
            continue
        codigo = get_cell_text(codigo_cell)
        if not codigo:
            continue

        # Check existing lat/lng
        lat_cell = cells_dict.get(COL_LAT)
        lng_cell = cells_dict.get(COL_LNG)

        existing_lat = get_cell_text(lat_cell) if lat_cell else ''
        existing_lng = get_cell_text(lng_cell) if lng_cell else ''

        if existing_lat and existing_lng:
            skipped_count += 1
            continue

        address = build_address(row)
        if not address or len(address) < 5:
            print(f"[{i}/{total}] {codigo}: Sense adreca, saltant...")
            failed_count += 1
            continue

        print(f"[{i}/{total}] {codigo}: {address[:60]}...", end=' ')

        lat, lng = geocode(address)

        if lat is not None and lng is not None:
            set_column_value(row, COL_LAT, f"{lat:.8f}")
            set_column_value(row, COL_LNG, f"{lng:.8f}")
            geocoded_count += 1
            print(f"-> {lat:.6f}, {lng:.6f}")
        else:
            failed_count += 1
            print("-> No trobat")

        time.sleep(NOMINATIM_DELAY)

    print(f"\nResum:")
    print(f"  Geocodificats: {geocoded_count}")
    print(f"  Ja tenien coord: {skipped_count}")
    print(f"  Fallits: {failed_count}")

    print(f"\nDesant {ODS_PATH}...")
    try:
        doc.save(ODS_PATH)
        print("Desat correctament!")
    except Exception as e:
        print(f"Error desant: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
