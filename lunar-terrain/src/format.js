/** @typedef {import('./site/moonSite.js').LatLon} LatLon */

/**
 * @param {number} bytes
 * @returns {string} e.g. '21 MB', '1.6 GB'
 */
export function formatBytes(bytes) {
  const megabytes = bytes / (1024 * 1024)
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(1)} GB`
  }
  return megabytes >= 10 ? `${Math.round(megabytes)} MB` : `${megabytes.toFixed(1)} MB`
}

/**
 * @param {number} meters
 * @returns {string} e.g. '20 m', '7.6 km'
 */
export function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

/**
 * @param {LatLon} position
 * @returns {string} e.g. '89.67°S, 129.80°E'
 */
export function formatLatLon({ latitude, longitude }) {
  const east = ((longitude % 360) + 360) % 360
  return `${Math.abs(latitude).toFixed(2)}°${latitude < 0 ? 'S' : 'N'}, ${east.toFixed(2)}°E`
}
