/**
 * @typedef {import('../catalog/catalog.js').ProductKind} ProductKind
 * @typedef {import('../catalog/catalog.js').SampleEncoding} SampleEncoding
 */

/**
 * @typedef {'terrain' | 'colormap' | 'shapes'} UploadMode - 'terrain' makes the heights of the ground,
 *   'colormap' a colour layer draped over that ground, 'shapes' polygon shapes through the rules import
 */

/**
 * @typedef {Object} ValueMark - A value worth marking on a colour scale, in the product's unit
 * @property {number} value
 * @property {string} meaning
 */

/**
 * @typedef {Object} DataGuide - One kind of lunar data and how to bring it into FieldTwin
 * @property {string} id
 * @property {string} title
 * @property {UploadMode} uploadAs
 * @property {ProductKind} [productKind] - The catalog products a 'terrain' or 'colormap' guide offers
 * @property {string} [shapeDataset] - The SHAPE_DATASETS entry a 'shapes' guide builds its files from
 * @property {string} what - What the file's values are
 * @property {string} useFor - What it helps decide at a site
 * @property {string} [unitSymbol] - Shown after values, e.g. '°'
 * @property {string} [coverageNote] - Limits of the data worth knowing before downloading
 * @property {ValueMark[]} [marks]
 * @property {string[]} sources - DATA_SOURCES the guide's files come from
 */

/** @type {DataGuide[]} */
export const DATA_GUIDES = [
  {
    id: 'terrain',
    sources: ['lola-gdr'],
    title: 'Terrain',
    productKind: 'elevation',
    uploadAs: 'terrain',
    what: 'Heights of the ground above the Moon’s 1,737.4 km reference sphere, from LRO’s laser altimeter (LOLA).',
    useFor: 'The ground of the project: assets sit on it, and every colour layer below is draped over it.',
  },
  {
    id: 'slope',
    sources: ['lola-gdr'],
    title: 'Slope',
    productKind: 'slope',
    uploadAs: 'colormap',
    what: 'Surface slope in degrees, computed from the LOLA laser heights.',
    useFor: 'Where a lander can touch down and where rovers and crews can drive or walk.',
    unitSymbol: '°',
    marks: [
      { value: 5, meaning: 'gentle' },
      { value: 10, meaning: 'moderate' },
      { value: 15, meaning: 'steep' },
      { value: 20, meaning: 'very steep' },
      { value: 30, meaning: 'crater walls' },
    ],
  },
  {
    id: 'roughness',
    sources: ['lola-gdr'],
    title: 'Roughness',
    productKind: 'roughness',
    uploadAs: 'colormap',
    what: 'How much the ground varies in height within each pixel, in metres, from the spread of LOLA heights.',
    useFor: 'Spotting rough, blocky ground that the smooth terrain surface hides.',
    unitSymbol: ' m',
    coverageNote: 'The finest files are 40 m per pixel at the poles.',
  },
  {
    id: 'illumination',
    sources: ['pgda-illumination'],
    title: 'Sunlight',
    productKind: 'illumination',
    uploadAs: 'colormap',
    what: 'The average share of the Sun’s disc above the local horizon over an 18.6-year cycle, from 0 (never lit) to 1 (always fully lit), computed from the LOLA terrain (Mazarico et al.).',
    useFor: 'Solar power and thermal conditions: the best-lit rims and peaks near the poles are prime sites.',
    coverageNote: 'Polar regions only (poleward of 65°).',
    marks: [
      { value: 0.2, meaning: 'mostly dark' },
      { value: 0.5, meaning: 'lit half the time' },
      { value: 0.8, meaning: 'among the best-lit places' },
    ],
  },
  {
    id: 'earth-visibility',
    sources: ['pgda-illumination'],
    title: 'Earth visibility',
    productKind: 'earth-visibility',
    uploadAs: 'colormap',
    what: 'The share of time at least part of the Earth is above the local horizon, from 0 to 1 (Mazarico et al.).',
    useFor: 'Direct-to-Earth communication: where antennas can see the Earth, and for how long.',
    coverageNote: 'Polar regions only (poleward of 65°).',
    marks: [
      { value: 0, meaning: 'never in view' },
      { value: 0.5, meaning: 'half the time' },
      { value: 1, meaning: 'always in view' },
    ],
  },
  {
    id: 'shadow',
    sources: ['pgda-illumination', 'pgda-south-pole', 'pgda-north-pole'],
    title: 'Permanent shadow',
    productKind: 'shadow',
    uploadAs: 'colormap',
    what: 'Permanently shadowed regions: 1 where the Sun never shines directly, 0 elsewhere (Mazarico et al.; the 20 m south-pole file from Barker et al. 2023 and the 20 m north-pole file from Barker et al. 2025).',
    useFor: 'Cold traps where water ice can survive, and ground with no solar power at all.',
    coverageNote: 'Polar regions only (poleward of 65°, or 80° for the 20 m files).',
    marks: [
      { value: 0, meaning: 'sunlit at some time' },
      { value: 1, meaning: 'permanently shadowed' },
    ],
  },
  {
    id: 'temperature',
    sources: ['diviner-seasonal'],
    title: 'Temperature',
    productKind: 'temperature',
    uploadAs: 'colormap',
    what: 'Surface temperature in kelvin measured by LRO’s Diviner radiometer: the summer maximum or the winter minimum (Williams et al. 2019).',
    useFor: 'Thermal design of hardware, and where ice can last: water ice is stable below about 110 K.',
    unitSymbol: ' K',
    coverageNote: 'South pole only (poleward of 80°), at 240 m per pixel.',
    marks: [
      { value: 40, meaning: 'coldest traps' },
      { value: 110, meaning: 'water ice stable below' },
      { value: 250, meaning: 'sunlit ground' },
    ],
  },
  {
    id: 'ice-depth',
    sources: ['diviner-ice'],
    title: 'Ice table depth',
    productKind: 'ice-depth',
    uploadAs: 'colormap',
    what: 'The depth in metres below which water ice would be stable, from Diviner temperatures (Schorghofer and Williams 2020). Empty where ice isn’t stable within that model’s depth.',
    useFor: 'Where to drill or excavate for ice, and how deep.',
    unitSymbol: ' m',
    coverageNote: 'South pole only (poleward of 80°), at 240 m per pixel.',
    marks: [
      { value: 0, meaning: 'at the surface' },
      { value: 0.1, meaning: '10 cm down' },
      { value: 0.5, meaning: '50 cm down' },
    ],
  },
  {
    id: 'ice-favorability',
    sources: ['usgs-ice-favorability'],
    title: 'Ice favorability',
    productKind: 'ice-favorability',
    uploadAs: 'colormap',
    what: 'A predictive index from 0 to 1 of how favourable the ground is for mineable ice, from a geologic model of ice deposition and evolution (ice stability depth, micro cold traps, impact history), not from ice detections (Cannon and Britt 2020).',
    useFor: 'A first pass at ranking places to prospect for ice, older ground with ice close to the surface scoring highest.',
    coverageNote: 'Coarse: 591 m per pixel, poleward of 80°.',
  },
  {
    id: 'albedo',
    sources: ['lola-gdr'],
    title: 'Albedo',
    productKind: 'albedo',
    uploadAs: 'colormap',
    what: 'Surface brightness at the laser’s 1064 nm wavelength (normal albedo, 0 to 1).',
    useFor: 'Regional context: bright fresh craters and ejecta against older, darker regolith.',
    coverageNote: 'Coarse: 1 km per pixel at best, so it shows the region, not the site’s detail.',
  },
  {
    id: 'shot-count',
    sources: ['lola-gdr'],
    title: 'Measurement density',
    productKind: 'shot-count',
    uploadAs: 'colormap',
    what: 'The number of LOLA laser shots in each pixel of the terrain grid. Pixels with 0 had no shot: their height was filled in from the neighbours.',
    useFor: 'How far to trust the terrain: plan on measured ground rather than filled-in gaps.',
    marks: [
      { value: 0, meaning: 'no measurement, height filled in' },
      { value: 1, meaning: 'one shot' },
      { value: 5, meaning: 'well measured' },
    ],
  },
  {
    id: 'named-features',
    sources: ['iau-nomenclature'],
    title: 'Named features',
    uploadAs: 'shapes',
    shapeDataset: 'named-features',
    what: 'The official names of craters, mountains, valleys and landing sites (IAU Gazetteer of Planetary Nomenclature), as outlines of their size.',
    useFor: 'Finding your way and naming places in plans: the shapes carry the feature’s name and type.',
  },
  {
    id: 'landing-sites',
    sources: ['lroc-anthropogenic'],
    title: 'Landing sites',
    uploadAs: 'shapes',
    shapeDataset: 'landing-sites',
    what: 'Where landers, rovers, surface experiments and impact sites of past missions are, measured on LROC images (Apollo, Luna, Surveyor, Chang’e, Chandrayaan-3, SLIM, IM-1, IM-2, Blue Ghost, ...).',
    useFor: 'Keeping clear of earlier hardware, or planning a visit to it.',
    coverageNote: 'Luna 9 and Luna 13 are missing: their positions were never measured on LROC images.',
  },
  {
    id: 'geology',
    sources: ['usgs-geology'],
    title: 'Geologic units',
    uploadAs: 'shapes',
    shapeDataset: 'geology',
    what: 'The geologic units of the USGS Unified Geologic Map of the Moon (1:5,000,000), as polygons named after their unit and age, coloured as on the map and described with the map’s own unit descriptions. Each name ends with the map’s unit symbol, e.g. (pNbm): its first letters give the age, from youngest to oldest C Copernican, E Eratosthenian, I Imbrian, N Nectarian and pN pre-Nectarian; the rest gives the kind of unit, e.g. c crater, sc secondary craters, b basin, bm basin massif, t terra (highlands), p plains.',
    useFor: 'Regional context for science and resources: which crater, basin or plains deposits the site sits on.',
    coverageNote: 'Only the polar regions (poleward of 75°) are bundled, and the map is drawn at 1:5,000,000, so edges are placed to about a kilometre.',
  },
]

/**
 * The number FieldTwin reads for a value. When the file's scale and offset are lost on upload (e.g. the LOLA
 * JPEG 2000 files), that's the file's integer sample; otherwise it's the value itself.
 * @param {number} value - In the product's unit
 * @param {SampleEncoding} encoding
 * @returns {number}
 */
export function toSample(value, encoding) {
  return isEncoded(encoding) ? Math.round((value - encoding.offset) / encoding.scale) : value
}

/**
 * @param {SampleEncoding} encoding
 * @returns {boolean} Whether FieldTwin's raw samples differ from the real values
 */
export function isEncoded(encoding) {
  return encoding.scale !== 1 || encoding.offset !== 0
}
