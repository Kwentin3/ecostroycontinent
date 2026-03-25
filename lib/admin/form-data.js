export function getString(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

export function getStringArray(formData, key) {
  return formData.getAll(key).map((value) => String(value).trim()).filter(Boolean);
}

export function getBoolean(formData, key) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}
