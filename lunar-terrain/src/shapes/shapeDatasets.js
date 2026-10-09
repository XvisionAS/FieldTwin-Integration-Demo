import { geologyShapes, pointFeatureShapes, projectShapes } from './siteShapes.js'

/**
 * @typedef {import('./siteShapes.js').ProjectedShape} ProjectedShape
 * @typedef {import('./siteShapes.js').ProjectPositions} ProjectPositions
 * @typedef {import('./siteShapes.js').ShapeImport} ShapeImport
 * @typedef {import('./siteShapes.js').ColorRules} ColorRules
 * @typedef {import('./sources/iauNomenclature.js').PointDataset} PointDataset
 * @typedef {import('./sources/unifiedGeology.js').GeologyDataset} GeologyDataset
 * @typedef {import('../site/moonSite.js').Site} Site
 * @typedef {import('../site/moonSite.js').ViewBox} ViewBox
 */

/**
 * @typedef {Object} ShapeContext - What turning a dataset into shapes needs besides the site
 * @property {ViewBox} viewBox - The view, in the project CRS
 * @property {ProjectPositions} project
 */

/**
 * @typedef {Object} ShapeDatasetEntry - A bundled dataset and how to turn it into shapes for a site
 * @property {() => Promise<PointDataset | GeologyDataset>} load - Loaded on first use, so the app starts without it
 * @property {(dataset: PointDataset | GeologyDataset, site: Site, context: ShapeContext) => Promise<ProjectedShape[]>} toShapes
 *   - Each entry pairs `load` with the matching kind of dataset
 * @property {ShapeImport} shapeImport
 * @property {(dataset: PointDataset | GeologyDataset, shapes: ProjectedShape[]) => ColorRules} [colorRules]
 *   - Colours for the shapes in the view, by attribute value
 * @property {string} fileName - Base name of the downloaded files
 */

/**
 * @param {PointDataset} dataset
 * @param {Site} site
 * @param {ShapeContext} context
 * @returns {Promise<ProjectedShape[]>}
 */
const pointShapes = (dataset, site, { project }) => projectShapes(pointFeatureShapes(dataset.features, site), project)

/**
 * @param {GeologyDataset} dataset
 * @param {Site} site
 * @param {ShapeContext} context
 * @returns {Promise<ProjectedShape[]>}
 */
const unitShapes = (dataset, site, { viewBox, project }) => geologyShapes(dataset, site, viewBox, project)

/**
 * The map's own colour for each unit in the view, e.g. #4E3A37 for 'pNbm' (pre-Nectarian basin massif).
 * @param {GeologyDataset} dataset
 * @param {ProjectedShape[]} shapes
 * @returns {ColorRules}
 */
const unitColors = (dataset, shapes) => {
  const units = [...new Set(shapes.map((shape) => String(shape.attributes?.unit)))].sort()
  return {
    attribute: 'unit',
    colors: units.map((unit) => ({
      value: unit,
      label: `${unit}: ${dataset.legend[unit].name}`,
      color: dataset.legend[unit].color,
    })),
  }
}

/** @type {Record<string, ShapeDatasetEntry>} */
export const SHAPE_DATASETS = {
  'named-features': {
    load: async () => (await import('./data/namedFeatures.json')).default,
    toShapes: pointShapes,
    shapeImport: {
      configurationId: 'lunar-data-guide:iau-named-features',
      name: 'IAU named features',
      tag: 'IAU named features',
    },
    fileName: 'iau-named-features',
  },
  'landing-sites': {
    load: async () => (await import('./data/landingSites.json')).default,
    toShapes: pointShapes,
    shapeImport: {
      configurationId: 'lunar-data-guide:landing-sites',
      name: 'Landing sites',
      tag: 'Landing sites',
    },
    fileName: 'landing-sites',
  },
  geology: {
    load: async () => (await import('./data/geology.json')).default,
    toShapes: unitShapes,
    colorRules: unitColors,
    shapeImport: {
      configurationId: 'lunar-data-guide:geologic-units',
      name: 'Geologic units',
      tag: 'Geologic units',
    },
    fileName: 'geologic-units',
  },
}
