export function getString(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

export function getStringArray(formData, key) {
  return formData.getAll(key).map((value) => String(value).trim()).filter(Boolean);
}

export function getBoolean(formData, key) {
  const rawValue = formData.get(key);

  if (typeof rawValue !== "string") {
    return false;
  }

  const value = rawValue.trim().toLowerCase();
  return value === "on" || value === "true" || value === "yes" || value === "1";
}
