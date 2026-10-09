/**
 * @typedef {Object} DataSource - Where a guide's data comes from, as its publisher asks to be credited
 * @property {string} name - The product
 * @property {string} provider - Who publishes it
 * @property {string} url - The product's page
 * @property {string} citation - As the source asks to be cited
 * @property {string} [terms] - Use terms, only when the source states them
 */

const PGDA = 'NASA Goddard Space Flight Center, Planetary Geodesy Data Archive (PGDA)'
const DIVINER = 'LRO Diviner team, University of California, Los Angeles'

/** @type {Record<string, DataSource>} */
export const DATA_SOURCES = {
  'lola-gdr': {
    name: 'LRO LOLA Gridded Data Records (LRO-L-LOLA-4-GDR-V1.0)',
    provider: 'NASA Planetary Data System, Geosciences Node; LOLA team, NASA Goddard Space Flight Center',
    url: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm',
    citation: 'Smith, D.E., et al., LRO LOLA Gridded Data Records, LRO-L-LOLA-4-GDR-V1.0, NASA Planetary Data System.',
  },
  'pgda-illumination': {
    name: 'Lunar Polar Illumination',
    provider: PGDA,
    url: 'https://pgda.gsfc.nasa.gov/products/69',
    citation:
      'Mazarico, E., et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography, Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030.',
  },
  'pgda-south-pole': {
    name: 'A New View of the Lunar South Pole from LOLA (20 m products)',
    provider: PGDA,
    url: 'https://pgda.gsfc.nasa.gov/products/90',
    citation: 'Barker, M.K., et al. (2023), Planetary Science Journal 4, 183, doi:10.3847/PSJ/acf3e1.',
  },
  'pgda-north-pole': {
    name: 'Large-Scale Roughness Properties of the Lunar Poles (north pole 20 m products)',
    provider: PGDA,
    url: 'https://pgda.gsfc.nasa.gov/products/98',
    citation:
      'Barker, M.K., et al. (2025), Large-Scale Roughness Properties of the Lunar North and South Polar Regions as Measured by the Lunar Orbiter Laser Altimeter (LOLA), Planetary Science Journal 6, 83, doi:10.3847/PSJ/adbc9d; data doi:10.60903/gsfcpgda-lola-poles.',
  },
  'diviner-seasonal': {
    name: 'Seasonal Polar Temperatures on the Moon',
    provider: DIVINER,
    url: 'https://luna1.diviner.ucla.edu/~jpierre/diviner/level4_polar/',
    citation:
      'Williams, J.-P., et al. (2019), Seasonal polar temperatures on the Moon, Journal of Geophysical Research: Planets 124, 2505-2521, doi:10.1029/2019JE006028.',
  },
  'diviner-ice': {
    name: 'Ice storage maps from time-dependent temperatures',
    provider: DIVINER,
    url: 'https://luna1.diviner.ucla.edu/~jpierre/diviner/level4_polar/',
    citation:
      'Schorghofer, N., and Williams, J.-P. (2020), Mapping of ice storage processes on the Moon with time-dependent temperatures, Planetary Science Journal 1, 54, doi:10.3847/PSJ/abb6ff.',
  },
  'usgs-ice-favorability': {
    name: 'Moon Ice Favorability Index, South and North Pole, 591 m',
    provider: 'USGS Astrogeology Science Center',
    url: 'https://astrogeology.usgs.gov/search/map/moon_ice_favorability_index_south_pole_591mp',
    citation:
      'Cannon, K.M., and Britt, D.T. (2020), A geologic model for lunar ice deposits at mining scales, Icarus 347, 113778, doi:10.1016/j.icarus.2020.113778.',
    terms: 'Please cite Cannon and Britt 2020.',
  },
  'iau-nomenclature': {
    name: 'Gazetteer of Planetary Nomenclature',
    provider: 'IAU Working Group for Planetary System Nomenclature (WGPSN), USGS Astrogeology Science Center',
    url: 'https://planetarynames.wr.usgs.gov/',
    citation: 'Gazetteer of Planetary Nomenclature, International Astronomical Union (IAU) Working Group for Planetary System Nomenclature (WGPSN).',
  },
  'lroc-anthropogenic': {
    name: 'Anthropogenic Features on the Moon',
    provider: 'Lunar Reconnaissance Orbiter Camera (LROC) team, Arizona State University',
    url: 'https://data.lroc.im-ldi.com/lroc/view_rdr/SHAPEFILE_ANTHROPOGENIC_OBJECTS',
    citation:
      'Wagner, R.V., Nelson, D.M., Plescia, J.B., Robinson, M.S., Speyerer, E.J., and Mazarico, E. (2017), Coordinates of anthropogenic features on the Moon, Icarus 283, 92-103, doi:10.1016/j.icarus.2016.05.011.',
  },
  'usgs-geology': {
    name: 'Unified Geologic Map of the Moon, 1:5M, 2020',
    provider: 'USGS Astrogeology Science Center',
    url: 'https://astrogeology.usgs.gov/search/map/Moon/Geology/Unified_Geologic_Map_of_the_Moon_GIS_v2',
    citation:
      'Fortezzo, C.M., Spudis, P.D., and Harrel, S.L. (2020), Release of the Digital Unified Global Geologic Map of the Moon at 1:5,000,000-Scale, 51st Lunar and Planetary Science Conference, abstract 2760.',
    terms: 'CC0; please cite the authors.',
  },
}
