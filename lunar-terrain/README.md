# Lunar Data Import Guide integration

A FieldTwin integration, docked as a Module Panel next to the 3D view, that guides users through the Moon data they can bring into a lunar project: terrain, slope, roughness, albedo and measurement density. For each kind it explains what the values are and what they help decide, lists the files covering the site with download links, and gives the step-by-step upload in FieldTwin. The terrain is uploaded as a 3D surface; the other kinds as Colormap layers draped over it. Design and status: `LUNAR_TERRAIN_INTEGRATION_PLAN.md` at the root of the FieldTwin monorepo.

This folder is self-contained, with no imports from the rest of the monorepo, so it can move to its own repository. It needs Node 22+.

## App

A static Svelte 4 app (Vite). FieldTwin sends it `loaded`. It then asks for the project CRS (`getProjectData`) and the 3D view (`getViewBox`), converts the view to Moon latitude/longitude with FieldTwin's projector, and lists, for the chosen kind of data, the catalog files covering it. The best fit comes first, with a download link and the upload steps. The guides themselves (texts, colour-scale marks) are in `src/guides/dataGuides.js`. Every guide names its sources (`src/guides/dataSources.js`: publisher, product page and the citation each publisher asks for), shown under "Where the data comes from", and the "About the data" page lists them all with the disclaimer. When adding a source, take its citation and terms from the publisher's own page, not from memory.

```sh
npm install
npm run dev     # then open http://localhost:5173/dev/host.html
npm run build   # static files in dist/, with relative paths so any folder of a static host works
```

- **`dev/host.html`** stands in for FieldTwin: it embeds the app and answers its messages for a lunar project. It needs a projector (by default a local container on port 18080; override with `?projector=<url>`). Other parameters: `crs`, `view`, `canEdit`, `css`, `theme`, described at the top of the file.
- **Adding it to an account:** open the integration's address directly in a browser (e.g. `http://localhost:5173/`). The page shows its manifest URL (`…/manifest.json`) with a copy button. In FieldTwin's admin app, open the account's Integrations, click **Download Manifest from Url**, paste it and submit. Inside FieldTwin the integration uses FieldTwin's own projector, so no container is needed.
- **The manifest** (`manifest/integrationManifest.js`) is served at `/manifest.json` by `npm run dev` and `npm run preview`, with the address it was requested at (or the `X-Forwarded-*` one behind a proxy) as its `url`. It sends CORS headers, because the admin app fetches it from another origin. It uses `useGET` and `noURLParams`, so the JWT only travels by message and never appears in a URL.
- **Static hosting:** `INTEGRATION_URL=https://host/path/ npm run build` also writes `dist/manifest.json` with that `url`. The static host must serve it with `Access-Control-Allow-Origin: *` (and answer the `OPTIONS` preflight) for "Download Manifest from Url" to work; otherwise use **Upload Manifest** with the file.
- **Hosted FieldTwin, integration on your machine:** Chrome asks the admin to allow access to the local network the first time the admin app fetches the manifest (and the iframe loads). Allow it. A local FieldTwin cluster on the same machine doesn't trigger this.
- **Code layout:** `src/host/` (messaging with FieldTwin: trusts only the embedding window and its origin), `src/site/` (view box to Moon site), `src/ranking/` (which files cover the site, best first), `src/guides/` (the kinds of data and their upload recipe), `src/components/`.

## Catalog

`src/catalog/catalog.json` lists every downloadable file with its kind, footprint, resolution, size and how its samples encode values (scale, offset, unit, missing-value marker). It is generated, and committed so the app can bundle it:

```sh
npm run build:catalog   # re-reads the live source listings (~6 s)
npm test
```

Sources live in `src/catalog/sources/`. Each source produces `CatalogProduct` entries (see `src/catalog/catalog.js`); to add one, write a source and add it to `SOURCES` in `scripts/build-catalog.js`.

### PDS LOLA (v1)

- **Files:** from `lola_gdr/{cylindrical,polar}/jp2/` on PDS Geosciences, as single-file JPEG 2000 downloads: elevation `ldem_*` (207), shot counts `ldec_*` (206), slope `ldsm_*`, roughness `ldrm_*` and albedo `ldam_*` (7 each). Suffixed variants (`ldsm_16_rg`, `ldrm_32_25`, `*_nn`) and the albedo counts `ldac_*` are skipped.
- **Sample encoding:** value = sample × scale + offset, read from the label's `COMPRESSED_FILE` object, or from its `UNCOMPRESSED_FILE` `IMAGE` object for the tiles, whose `COMPRESSED_FILE` gives none. The files are georeferenced on their own but carry neither the scale/offset (only in a side-car `_aux.xml`) nor the missing-value marker (only in the label), and a single-file upload sees neither. So heights need Z Scale 0.5 after upload, colour layers work in raw samples (the guide converts the useful values), and slope/roughness need NODATA −32768.
- **Tile longitudes:** the tiles' `_jp2.lbl` labels give longitudes shifted by 180°. The files themselves are georeferenced as their names say, so tile longitudes come from the file name.

### Polar value maps (fixed list)

`src/catalog/sources/polarRasters.js`: GeoTIFFs from NASA GSFC's PGDA (sunlight, Earth visibility and permanent shadow, Mazarico et al.; the 20 m shadow files from Barker et al. 2023 for the south pole and Barker et al. 2025 for the north pole), UCLA's Diviner polar maps (temperature, ice table depth) and USGS (ice favorability). The servers don't list their files (PGDA even answers HTTP 200 with an HTML page for a missing file), so this is a fixed list, measured with `gdalinfo` and HEAD requests. Unlike the LOLA JPEG 2000 files, these carry their scale and missing-value marker, or are floats with NaN for missing; FieldTwin's converter applies them, so users see real values and need no NODATA or conversion.

- **UCLA north-pole files are left out:** they are georeferenced on the south pole (latitude of origin −90), so they would land on the wrong pole. The north ice-table-depth file doesn't exist.
- **UCLA's server** uses an old TLS setup (static RSA key exchange, incomplete certificate chain): Chrome downloads fine, but Node, curl and GDAL need their certificate checks relaxed.

## Shapes

Vector datasets are imported as FieldTwin polygon shapes through **Import → Data from files using rules**. Their official downloads are global, can't be fetched by the browser (no CORS) and need preparing first, so they are prepared offline and bundled in `src/shapes/data/`, each loaded only when its guide opens:

```sh
npm run build:shapes   # needs Docker: GDAL reads the zipped shapefiles straight from their URLs
GDAL_IMAGE=gdal-base:latest npm run build:shapes   # use a local GDAL image instead of ghcr.io/osgeo/gdal
```

For the site in view, the guide then generates two files:

- **The shapes (`.geojson`)**, already in the project CRS, which the file declares (`crs` member). FieldTwin's importer then keeps the coordinates as they are; a GeoJSON without a `crs` is read as Earth WGS84 and silently misplaced.
- **The rules (`.rules.json`)**, a `futureon-rulesets` file: one polygon shape per feature, named after it, described (`setDescriptionAttribute`), tagged with its type and the dataset's tag. For the geologic units, a child ruleset per unit symbol in the view sets the map's colour (`setColor`), so the rules editor shows which colour goes with which unit. Descriptions and colours on shapes need the rules import changes of the `moon-crs` branch; older FieldTwin versions only accept descriptions on connections, staged assets and annotations, and have no `setColor` action. It uses no account-specific ids, so it works on any account. It has a fixed configuration id, so importing a newer file the same way updates the shapes made before. It must be loaded on the wizard's *Import options* step (*Choose import type → Create a new import* clears it).

The shapes come in flat (2D); the guide's "Select the imported shapes" button selects them by tag (`selectByTag`) so the user can tick **Stick To Bathymetry** on all of them at once.

### IAU named features

The IAU Gazetteer of Planetary Nomenclature points (`MOON_nomenclature_center_pts.zip`, 9,087 features): name, type, diameter and centre. Each feature near the site becomes a circle of its diameter; features without a size (e.g. landing site names, "Statio") get a 100 m marker, and features over 5 times the site's width (a mare around a small site) are left out.

### Landing sites

LROC's coordinates of anthropogenic features on the Moon (Wagner et al. 2017, `ANTHROPOGENIC_OBJECTS_180.ZIP`, 71 objects measured on NAC images), grouped as Lander, Rover, Surface experiment and Impact site. Luna 9 and 13 aren't in it: their positions were never measured on LROC images.

### Geologic units

The USGS Unified Geologic Map of the Moon v2 (1:5M, CC0) unit polygons, poleward of 75° only: the whole map is ~8 million vertices. The build clips both caps in Moon 2000 degrees, makes the one invalid polygon valid, explodes multi-part polygons and simplifies at ~150 m (43,000 vertices). Each polygon's id is its map feature's number (`source_fid`, the shapefile FID) and its part rank in that feature, so a rebuild keeps the ids of unchanged polygons. Units are named and coloured from the map's own description and colour tables (the data's `Iohs` is `Ios` in the description table). For a site in a cap, the guide reprojects the cap and clips the polygons to the view (`clipRingToBox`), keeping holes. The 214 MB zip is downloaded once into the cache folder.
