function flatten(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' || typeof value === 'number') {
      result[newPrefix] = value;
    } else {
      flatten(value, newPrefix, result);
    }
  }
  return result;
}

export default flatten;
