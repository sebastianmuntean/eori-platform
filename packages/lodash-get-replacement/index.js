/**
 * Replacement for deprecated lodash.get using modern JavaScript
 * This maintains the same API as lodash.get for compatibility with z-schema
 * 
 * Uses a simple iteration approach instead of optional chaining to maintain
 * compatibility with the exact behavior of lodash.get, including handling
 * of array indices and bracket notation in paths.
 */

/**
 * Gets the value at path of object. If the resolved value is undefined,
 * the defaultValue is returned in its place.
 * 
 * @param {object} object - The object to query
 * @param {string|Array} path - The path of the property to get
 * @param {*} defaultValue - The value returned for undefined resolved values
 * @returns {*} Returns the resolved value
 */
function get(object, path, defaultValue) {
  if (object == null) {
    return defaultValue;
  }

  // Handle empty path
  if (path === '' || (Array.isArray(path) && path.length === 0)) {
    return object === undefined ? defaultValue : object;
  }

  // Convert path to array if it's a string
  // Handle both dot notation and bracket notation (e.g., "a[0].b" or "a.0.b")
  let pathArray;
  if (Array.isArray(path)) {
    pathArray = path;
  } else {
    // Split by dots, but preserve bracket notation
    const str = String(path);
    pathArray = str
      .replace(/\[(\d+)\]/g, '.$1') // Convert [0] to .0
      .split('.')
      .filter(Boolean);
  }
  
  let result = object;
  
  for (const key of pathArray) {
    if (result == null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

module.exports = get;

? defaultValue : result;
}

module.exports = get;


