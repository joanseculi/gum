Sí. Et proposo que l’`AGENTS.md` deixi molt clar que és una **web estàtica vanilla HTML/CSS/JS**, que `Mapa.ods` és la font de dades, i que el mapa sigui realment interactiu. També hi inclouria una solució raonable per al login: en una web purament estàtica **no es pot protegir de veritat una contrasenya**, perquè qualsevol secret enviat al navegador és recuperable. Per tant, es pot implementar una autenticació client-side amb un hash, però cal deixar explícit que és una barrera d’accés, no seguretat real.

# AGENTS.md

## 1. Objectiu del projecte

Desenvolupar una aplicació web estàtica per consultar i localitzar negocis relacionats amb el sector sanitari, principalment:

* Farmàcies.
* Clíniques dentals.
* Clíniques.
* Centres sanitaris.
* Altres negocis similars.

Les dades corresponen a negocis de **Catalunya i Aragó** i es proporcionen mitjançant el fitxer:

```text
Mapa.ods
```

L'aplicació ha de permetre consultar tots els negocis sobre un mapa interactiu, cercar-los mitjançant un cercador en temps real i obtenir indicacions per arribar-hi.

El projecte serà una **web estàtica**, sense backend ni base de dades pròpia.

---

## 2. Tecnologies

Utilitzar únicament:

* HTML5
* CSS3
* JavaScript vanilla

No utilitzar frameworks frontend com:

* React
* Vue
* Angular
* Svelte

Tampoc utilitzar TypeScript.

Es poden utilitzar llibreries JavaScript externes quan siguin necessàries per al mapa o per llegir el fitxer ODS.

### Mapa

La interfície del mapa ha de ser similar a Google Maps, però no s'ha de dependre de Google Maps si això implica API keys o costos.

Es recomana utilitzar:

* Leaflet per al mapa interactiu.
* OpenStreetMap com a mapa base.
* Un servei de geocodificació per convertir les adreces en coordenades.
* Un servei de routing per calcular rutes.

Les dependències externes s'han d'utilitzar mitjançant CDN sempre que sigui possible, ja que el projecte serà una web estàtica.

---

# 3. Estructura del projecte

L'estructura recomanada és:

```text
/
├── index.html
├── login.html
├── detail.html
├── Mapa.ods
├── geocode.py
│
├── css/
│   ├── style.css
│   ├── login.css
│   └── detail.css
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── map.js
│   ├── search.js
│   ├── data.js
│   ├── routing.js
│   └── detail.js
│
└── assets/
    ├── icons/
    └── images/
```

Es pot modificar aquesta estructura si durant el desenvolupament es considera necessari, però s'ha de mantenir una separació clara entre:

* HTML
* CSS
* JavaScript
* Assets
* Dades

---

# 4. Fitxer Mapa.ods

El fitxer `Mapa.ods` és la font principal de dades.

Les columnes tenen el següent significat:

| Columna | Camp                       |
| ------- | -------------------------- |
| B       | Código                     |
| C       | Name - Razon social        |
| D       | Tipo                       |
| E       | Teléfono                   |
| F       | Cadena / agrupacion        |
| G       | Sunstar España - Potencial |
| H       | Dirección                  |
| I       | No s'utilitza              |
| J       | No s'utilitza              |
| K       | Cód. postal                |
| L       | Población                  |
| M       | Region                     |
| N       | País                       |
| O       | Latitud (generada offline) |
| P       | Longitud (generada offline)|

Les columnes I i J s'han d'ignorar completament.

Les columnes O i P contenen les coordenades geogràfiques generades pel script `geocode.py`.

Els camps s'han de convertir internament a una estructura JavaScript similar a:

```javascript
{
    codigo: "...",
    nombre: "...",
    tipo: "...",
    telefono: "...",
    cadena: "...",
    potencial: "...",
    direccion: "...",
    codigoPostal: "...",
    poblacion: "...",
    region: "...",
    pais: "...",
    lat: 41.3851,
    lng: 2.1734
}
```

---

# 5. Lectura de Mapa.ods

La web ha de carregar `Mapa.ods` automàticament.

No s'ha de convertir manualment el fitxer ODS a JSON abans de publicar la web.

El JavaScript ha de ser capaç de:

1. Carregar `Mapa.ods`.
2. Llegir el full de càlcul.
3. Identificar les columnes.
4. Ignorar I i J.
5. Llegir lat/lng de les columnes O i P.
6. Crear els objectes de negoci.
7. Preparar les dades per a la cerca.
8. Mostrar els negocis al mapa.

Es pot utilitzar una llibreria com SheetJS/xlsx si permet llegir ODS correctament en el navegador.

Cal gestionar correctament:

* Camps buits.
* Telèfons buits.
* Codis postals amb zeros inicials.
* Caràcters especials.
* Accents.
* Majúscules/minúscules.
* Files incompletes.

---

# 6. Geolocalització dels negocis

El fitxer ODS no conté coordenades geogràfiques.

Per tant, cada negoci haurà de tenir:

```text
latitude
longitude
```

per poder representar-lo sobre el mapa.

La geolocalització s'ha de basar en:

```text
Dirección + Cód. postal + Población + Region + País
```

Per exemple:

```text
Carrer Major 10, 08001, Barcelona, Catalunya, España
```

## Important

No s'ha de fer una petició de geocodificació cada vegada que l'usuari obre la web.

La geocodificació massiva pot generar problemes de:

* Rendiment.
* Límit de peticions.
* Rate limiting.
* Disponibilitat del servei.
* Temps de càrrega.

Per tant, s'ha de dissenyar una estratègia de cache.

Preferiblement:

```text
Mapa.ods
    ↓
Geocodificació
    ↓
Coordenades
    ↓
Cache local / fitxer auxiliar
    ↓
Mapa
```

Si és necessari crear un fitxer auxiliar, es pot generar:

```text
data/businesses.json
```

amb les dades ja geocodificades.

No obstant això, `Mapa.ods` continua sent la font original de dades.

---

# 7. Pantalla de Login

La primera pantalla que ha de veure l'usuari és:

```text
login.html
```

Ha de contenir:

* Logo/títol de l'aplicació.
* Camp d'usuari.
* Camp de password.
* Botó "Entrar".
* Missatge d'error si les credencials no són correctes.

Les credencials inicials són:

```text
Usuari: admin
Password: Jet82Hi9
```

## IMPORTANT: seguretat

El projecte és una web estàtica i no existeix backend.

Per tant, **NO és possible protegir realment una contrasenya secreta en una aplicació purament client-side**.

No s'ha de fer:

```javascript
if (password === "Jet82Hi9") {
    ...
}
```

Ni tampoc:

```javascript
const PASSWORD = "Jet82Hi9";
```

La contrasenya no pot aparèixer en text pla dins de cap fitxer JavaScript.

En lloc d'això, s'ha d'utilitzar una autenticació basada en hash.

La contrasenya inicial s'ha de transformar en un hash criptogràfic, preferiblement SHA-256 mitjançant Web Crypto API.

Exemple conceptual:

```text
Jet82Hi9
    ↓
SHA-256
    ↓
hash
```

Al navegador només s'ha d'emmagatzemar el hash.

El procés de login serà:

```text
Usuari introdueix password
        ↓
SHA-256(password)
        ↓
Comparar amb hash emmagatzemat
        ↓
Coincideix?
   ┌────┴────┐
   │         │
  Sí        No
   │         │
 entrar    error
```

### Important

A l'`AGENTS.md` s'ha de considerar aquest sistema com una **autenticació bàsica client-side**, no com un sistema de seguretat real.

Qualsevol persona amb accés als fitxers de la web podria analitzar el codi i, eventualment, modificar-lo.

Si en el futur es necessita seguretat real, s'haurà d'afegir un backend o un sistema d'autenticació extern.

---

# 8. Sessió

Després d'un login correcte, guardar l'estat de sessió al navegador.

Es pot utilitzar:

```javascript
sessionStorage
```

per exemple:

```text
authenticated = true
```

No s'ha de guardar mai la password.

Quan l'usuari accedeixi directament a:

```text
index.html
```

sense haver iniciat sessió, s'ha de redirigir a:

```text
login.html
```

També s'ha d'incloure un botó:

```text
Tancar sessió
```

que elimini la sessió i torni a `login.html`.

---

# 9. Layout principal

La pàgina principal ha de tenir una interfície dividida en dues zones:

```text
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
├───────────────────┬─────────────────────────────────────┤
│                   │                                     │
│                   │                                     │
│   SIDEBAR         │              MAPA                   │
│                   │                                     │
│   Cerca           │                                     │
│                   │                                     │
│   Resultats       │                                     │
│                   │                                     │
│                   │                                     │
├───────────────────┴─────────────────────────────────────┤
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Sidebar

A l'esquerra.

Ha de contenir:

* Cercador.
* Resultats.
* Informació del nombre de resultats.
* Possibles filtres.
* Botó per tornar a mostrar tots els negocis.
* Botó de localització de l'usuari.
* Opcions de ruta quan s'ha seleccionat un negoci.

## Mapa

A la dreta.

Ha d'ocupar la major part de la pantalla.

En dispositius petits, el layout ha de convertir-se en responsive.

---

# 10. Mapa inicial

Quan l'usuari entra a l'aplicació:

1. Carregar les dades.
2. Carregar el mapa.
3. Mostrar tots els negocis disponibles.
4. Ajustar el zoom perquè els negocis siguin visibles.
5. Intentar obtenir la ubicació actual de l'usuari.

El mapa inicial ha de mostrar **tots els negocis per defecte**.

No s'ha d'obligar l'usuari a fer una cerca abans de veure els negocis.

---

# 11. Localització de l'usuari

La web ha d'intentar obtenir la ubicació actual mitjançant:

```javascript
navigator.geolocation
```

Quan l'usuari doni permís, mostrar:

* La posició actual.
* Un marcador diferenciat.
* Opcionalment un cercle indicant la precisió.

La ubicació de l'usuari no s'ha de guardar al servidor.

Si l'usuari denega el permís:

* No s'ha de produir cap error fatal.
* El mapa ha de continuar funcionant.
* S'ha de mostrar un missatge informatiu.

Exemple:

```text
No s'ha pogut obtenir la vostra ubicació.
Podeu activar la localització del navegador per obtenir rutes.
```

---

# 12. Cerca en temps real

El cercador ha de funcionar en **live search**.

Cada vegada que l'usuari escrigui un caràcter, els resultats s'han d'actualitzar.

Exemple:

```text
farm
```

ha de poder trobar:

```text
Farmàcia X
Farmacia Y
Farmàcia Central
```

La cerca no ha de dependre únicament del nom.

S'ha de cercar com a mínim en:

* Código
* Name - Razon social
* Tipo
* Teléfono
* Cadena / agrupacion
* Dirección
* Cód. postal
* Población
* Region
* País

La cerca ha de ser:

* Case insensitive.
* Accent insensitive.
* Tolerant a majúscules/minúscules.
* Ràpida.

Per exemple:

```text
barcelona
```

ha de trobar:

```text
Barcelona
BARCELONA
barcelona
```

I una cerca sense accents hauria de poder trobar textos amb accents.

Es pot implementar una normalització mitjançant:

```javascript
normalize("NFD")
```

i eliminació dels diacrítics.

---

# 13. Resultats del cercador

Els resultats s'han de mostrar immediatament al sidebar.

Cada resultat ha de mostrar informació resumida:

```text
Farmàcia Exemple
Farmàcia
08001 Barcelona

Carrer Exemple, 10
93 XXX XX XX
```

En fer clic en un resultat:

1. El mapa s'ha de centrar en el negoci.
2. Fer zoom.
3. Destacar el marcador.
4. Obrir el popup.

Els resultats han de poder fer-se servir sense necessitat d'interactuar directament amb el mapa.

---

# 14. Marcadors

Cada negoci s'ha de representar amb un marcador.

Es pot utilitzar un sistema d'icones diferent segons `Tipo`.

Exemple:

```text
Farmàcia       → icona farmàcia
Clínica dental → icona dent
Clínica        → icona salut
Altres         → icona genèrica
```

Si no és possible diferenciar-los fàcilment, utilitzar una icona comuna però mantenir una llegenda visual.

---

# 15. Popup del negoci

En fer clic sobre un marcador s'ha de mostrar un popup.

El popup ha de mostrar com a mínim:

```text
Nom del negoci

Tipus
Adreça
Codi postal + població
Telèfon
Cadena / agrupació
Potencial

[Veure informació]
[Com arribar]
```

El popup no ha de mostrar tota la informació si això perjudica la usabilitat.

---

# 16. Pàgina de detall

Quan l'usuari faci clic a:

```text
Veure informació
```

s'ha d'obrir una nova pàgina:

```text
detail.html?id=CODIGO
```

La pàgina ha de mostrar tota la informació disponible del negoci.

Exemple:

```text
Farmàcia Exemple

Código: 12345

Tipo:
Farmàcia

Teléfono:
93 XXX XX XX

Cadena / agrupacion:
...

Sunstar España - Potencial:
...

Dirección:
...

Cód. postal:
...

Población:
...

Region:
Catalunya

País:
España
```

També ha d'incloure:

* Mapa petit amb la ubicació.
* Botó "Tornar al mapa".
* Botó "Com arribar".
* Telèfon clicable en dispositius mòbils.

---

# 17. Rutes

La funcionalitat principal del mapa és permetre calcular una ruta des de la ubicació actual de l'usuari fins al negoci.

Quan s'ha seleccionat un negoci, mostrar:

```text
Com arribar
```

I permetre seleccionar:

```text
🚗 Cotxe
🚲 Bicicleta
🚶 A peu
```

La ruta ha de mostrar:

* Distància.
* Temps estimat.
* Traçat sobre el mapa.
* Punt d'origen.
* Punt de destinació.

S'ha de seleccionar la ruta adequada segons el mitjà de transport.

No s'ha d'intentar implementar un motor de routing propi.

Utilitzar un servei de routing compatible amb el mapa.

La implementació ha d'estar encapsulada a:

```text
js/routing.js
```

Això permetrà canviar el proveïdor de routing en el futur sense modificar la resta de l'aplicació.

---

# 18. Ubicació manual

Si la geolocalització no està disponible, s'ha de permetre que l'usuari pugui definir l'origen de la ruta d'una altra manera.

Com a mínim, el sistema ha de gestionar correctament el cas en què no existeixi una ubicació actual.

No mostrar una ruta falsa.

---

# 19. Filtre lateral

A més del cercador, el sidebar ha d'estar preparat per incorporar filtres.

Inicialment es recomana implementar:

### Tipus

```text
Tots
Farmàcies
Clíniques dentals
Clíniques
Altres
```

### Regió

Permetre filtrar per:

```text
Catalunya
Aragó
```

I, si les dades ho permeten, per província o població.

Els filtres s'han de combinar amb el cercador.

Exemple:

```text
Cerca: farmàcia
Regió: Catalunya
```

només ha de mostrar farmàcies de Catalunya que coincideixin amb la cerca.

---

# 20. Rendiment

El nombre de negocis pot ser elevat.

Per tant:

* No recrear tot el mapa cada vegada que es fa una cerca.
* No recrear tots els marcadors si no és necessari.
* Utilitzar `LayerGroup` o `MarkerCluster` quan el volum de punts ho justifiqui.
* La cerca s'ha de fer sobre una estructura de dades en memòria.
* Evitar múltiples accessos al DOM.
* Utilitzar debounce si es fan peticions externes.
* No fer geocodificació repetida.

Si hi ha molts punts, utilitzar clustering de marcadors.

---

# 21. Disseny visual

La web ha de tenir un aspecte modern i professional.

No s'ha de crear una interfície que sembli una aplicació antiga basada en Bootstrap per defecte.

Utilitzar:

* CSS modern.
* Variables CSS.
* Gradients subtils.
* Cards.
* Border radius.
* Ombres suaus.
* Espaiat consistent.
* Tipografia moderna.
* Icones.
* Microinteraccions.
* Hover states.
* Transicions suaus.

La paleta de colors ha de transmetre:

* Salut.
* Tecnologia.
* Confiança.
* Modernitat.

Evitar colors excessivament saturats.

Es pot utilitzar una combinació de:

```text
blau
turquesa
verd
blanc
gris fosc
```

amb gradients moderns.

---

# 22. Responsive design

La web ha de funcionar correctament en:

* Desktop.
* Laptop.
* Tablet.
* Smartphone.

En desktop:

```text
Sidebar esquerre + mapa dret
```

En mòbil es pot transformar en:

```text
Mapa
↓
Sidebar / resultats
```

o utilitzar un sidebar flotant/desplegable.

El mapa ha de continuar sent usable en pantalles tàctils.

---

# 23. Accessibilitat

Respectar bones pràctiques d'accessibilitat:

* Labels per als inputs.
* Focus visible.
* Navegació amb teclat.
* Contrast suficient.
* Botons amb noms descriptius.
* No dependre únicament del color per transmetre informació.
* `aria-label` quan sigui necessari.
* Missatges d'error accessibles.

---

# 24. Gestió d'errors

La web ha de gestionar errors sense quedar bloquejada.

Casos mínims:

### Mapa.ods no disponible

Mostrar:

```text
No s'han pogut carregar les dades.
```

### ODS incorrecte

Mostrar:

```text
El fitxer de dades no té el format esperat.
```

### Geolocalització denegada

Continuar funcionant sense ubicació.

### Servei de routing no disponible

Mostrar:

```text
No s'ha pogut calcular la ruta.
```

### Negoci sense coordenades

Mostrar la informació del negoci però indicar que no es pot representar correctament sobre el mapa.

---

# 25. Estat de l'aplicació

L'estat de l'aplicació ha d'estar centralitzat.

Per exemple:

```javascript
const appState = {
    businesses: [],
    filteredBusinesses: [],
    selectedBusiness: null,
    userLocation: null,
    map: null,
    markers: null,
    route: null
};
```

Evitar variables globals innecessàries.

---

# 26. Separació de responsabilitats

Cada fitxer JavaScript ha de tenir una responsabilitat clara.

### auth.js

Login, logout i sessió.

### data.js

Lectura i transformació de `Mapa.ods`.

### map.js

Inicialització i gestió del mapa i marcadors.

### search.js

Cerca, filtres i resultats.

### routing.js

Geolocalització i rutes.

### detail.js

Pàgina de detall.

### app.js

Inicialització general i coordinació dels components.

No posar tota la lògica de l'aplicació en un únic `script.js`.

---

# 27. URL i identificació dels negocis

Cada negoci ha de tenir una identificació estable basada en:

```text
Código
```

La pàgina de detall ha de poder rebre:

```text
detail.html?id=12345
```

El JavaScript ha de localitzar el negoci corresponent a partir d'aquest identificador.

No utilitzar el nom com a identificador principal.

---

# 28. Seguretat

Encara que sigui una web estàtica:

* No utilitzar `eval()`.
* No injectar HTML procedent directament de les dades sense sanititzar.
* Preferir `textContent` en lloc de `innerHTML` quan sigui possible.
* Validar els paràmetres de URL.
* No guardar passwords.
* No posar secrets o API keys privades al JavaScript.
* No exposar tokens privats.

Qualsevol API key que sigui necessària per a un servei client-side s'ha de considerar pública.

---

# 29. HTTPS

La web s'ha de poder publicar mitjançant HTTPS.

La geolocalització del navegador requereix un context segur.

Per tant, la versió de producció s'ha de servir amb:

```text
HTTPS
```

---

# 30. GitLab / Github Pages

El projecte està pensat per poder publicar-se en:

```text
GitLab Pages
Github Pages
```

No s'ha de requerir un servidor backend per executar la web.

El projecte ha de funcionar després de publicar els fitxers estàtics.

Si cal una fase de build, aquesta ha de ser opcional i senzilla.

---

# 31. Compatibilitat amb GitLab Pages

No assumir que l'aplicació s'executarà necessàriament a:

```text
https://domini.com/
```

També pot executar-se sota un subpath de GitLab / Github Pages.

Per tant, evitar URLs absolutes innecessàries com:

```text
/js/app.js
```

Preferir:

```text
./js/app.js
```

i gestionar correctament les rutes relatives.

---

# 32. Experiència d'usuari

El flux principal ha de ser:

```text
LOGIN
  ↓
MAPA
  ↓
Tots els negocis visibles
  ↓
Usuari permet localització
  ↓
Usuari cerca negoci
  ↓
Resultats actualitzats en temps real
  ↓
Selecciona negoci
  ↓
Mapa centra el negoci
  ↓
Popup
  ├── Veure informació
  └── Com arribar
          ↓
      Cotxe / Bici / A peu
          ↓
        Ruta
```

Aquest flux ha de ser ràpid i intuïtiu.

---

# 33. Loading states

Durant operacions que poden trigar:

* Lectura de l'ODS.
* Geocodificació.
* Càrrega del mapa.
* Obtenció de localització.
* Càlcul de ruta.

Mostrar un indicador de càrrega.

Exemple:

```text
Carregant negocis...
```

No deixar una pantalla aparentment bloquejada sense feedback.

---

# 34. Cerca sense resultats

Quan no existeixin coincidències:

```text
No s'han trobat negocis.

Prova amb un altre terme de cerca.
```

No deixar el mapa en un estat inconsistent.

---

# 35. Botó "Mostrar tots"

El sidebar ha d'incloure una acció semblant a:

```text
Mostrar tots
```

que:

1. Elimini la cerca.
2. Restableixi els filtres.
3. Mostri tots els negocis.
4. Actualitzi els marcadors.
5. Ajusti el mapa per mostrar-los.

---

# 36. Inicialització del mapa

L'ordre recomanat és:

```text
Comprovar autenticació
        ↓
Carregar HTML
        ↓
Inicialitzar mapa
        ↓
Carregar Mapa.ods
        ↓
Processar dades
        ↓
Geolocalitzar / recuperar coordenades
        ↓
Crear marcadors
        ↓
Mostrar tots els negocis
        ↓
Obtenir ubicació de l'usuari
```

Els errors d'una fase no han d'impedir necessàriament que la resta de l'aplicació funcioni.

---

# 37. Qualitat del codi

El codi ha de ser:

* Clar.
* Modular.
* Mantenible.
* Comentat només quan sigui necessari.
* Sense duplicació innecessària.
* Amb noms de variables descriptius.
* Amb funcions petites i específiques.

Evitar:

```javascript
function doEverything() {
    ...
}
```

Preferir:

```javascript
loadBusinesses();
initializeMap();
setupSearch();
renderBusinessList();
updateMarkers();
```

---

# 38. No fer

No implementar:

* Backend propi.
* Base de dades.
* PHP.
* Node.js necessari en producció.
* React.
* Vue.
* Angular.
* Password en text pla.
* API keys privades al repositori.
* Google Maps amb una API key obligatòria si es pot evitar.
* Geocodificació repetida en cada visita.

---

# 39. Prioritats d'implementació

Implementar en aquest ordre:

### Fase 1

* Estructura HTML.
* CSS.
* Login.
* Lectura de `Mapa.ods`.
* Script `geocode.py` per geocodificar offline.

### Fase 2

* Mapa Leaflet.
* Marcadors.
* Popup.
* Visualització de tots els negocis.

### Fase 3

* Cercador live.
* Resultats.
* Filtres.
* Selecció de negoci.

### Fase 4

* Geolocalització de l'usuari.
* Pàgina de detall.
* Routing.
* Cotxe / bicicleta / a peu.

### Fase 5

* Responsive.
* Animacions.
* Millores visuals.
* Clustering.
* Optimització.

### Fase 6

* Proves.
* Gestió d'errors.
* Revisió d'accessibilitat.
* Preparació per GitLab Pages.

---

# 40. Criteris d'acceptació

La implementació es considerarà correcta quan:

* [ ] La web mostri una pantalla de login abans d'accedir al mapa.
* [ ] L'usuari `admin` pugui iniciar sessió amb la password definida.
* [ ] La password no aparegui en text pla dins del JavaScript.
* [ ] `Mapa.ods` es pugui carregar des del navegador.
* [ ] Les columnes I i J siguin ignorades.
* [ ] Tots els negocis disponibles apareguin al mapa inicialment.
* [ ] Cada negoci tingui un marcador.
* [ ] El marcador mostri un popup amb informació.
* [ ] El cercador funcioni en temps real.
* [ ] La cerca funcioni per nom, adreça, CP, telèfon, població, tipus, etc.
* [ ] La cerca sigui tolerant a majúscules i accents.
* [ ] Els resultats del sidebar siguin seleccionables.
* [ ] En seleccionar un negoci el mapa s'hi centri.
* [ ] Existeixi una pàgina de detall del negoci.
* [ ] La ubicació de l'usuari es pugui obtenir amb el navegador.
* [ ] Es pugui calcular una ruta.
* [ ] Es pugui escollir cotxe, bicicleta o a peu.
* [ ] La web sigui responsive.
* [ ] La web tingui un disseny modern.
* [ ] La web funcioni com a web estàtica.
* [ ] La web sigui compatible amb GitLab Pages.
* [ ] Els errors de càrrega de dades no provoquin una pantalla en blanc.
* [ ] No hi hagi secrets privats ni passwords en text pla al repositori.

---

# 41. Principi general

L'objectiu no és simplement crear una taula amb negocis sobre un mapa.

L'aplicació ha de proporcionar una experiència semblant a:

```text
"Vull trobar una farmàcia/clínica concreta,
veure on és,
veure la seva informació
i saber com arribar-hi."
```

Per tant, la prioritat és:

1. **Mapa**
2. **Cerca ràpida**
3. **Informació del negoci**
4. **Localització de l'usuari**
5. **Routing**
6. **Experiència d'usuari**
7. **Disseny modern**
8. **Rendiment**
9. **Mantenibilitat**
