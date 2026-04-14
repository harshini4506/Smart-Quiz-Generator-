const toPlain = (value) => {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(toPlain);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (typeof value.toObject === "function") {
      return toPlain(value.toObject());
    }
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "__v") continue;
      if (key === "_id") {
        result._id = String(item);
      } else {
        result[key] = toPlain(item);
      }
    }
    return result;
  }
  return value;
};

module.exports = { toPlain };
