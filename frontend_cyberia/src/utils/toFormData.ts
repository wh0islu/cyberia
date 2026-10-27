/**
 * Converts form data to FormData for submission to Django
 * (required when it contains a file: cover, poster, or photo).
 *
 * - File → anexado como arquivo
 * - arrays/objetos (sources, modules, items, tags…) → JSON em texto
 * - null/undefined → omitido
 *
 * In Django REST Framework, read JSON fields with json.loads()
 * or use a serializer with JSONField / a writable nested serializer.
 */
export function toFormData(data: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === "") continue;
    if (value instanceof File) fd.append(key, value);
    else if (typeof value === "object") fd.append(key, JSON.stringify(value));
    else fd.append(key, String(value));
  }
  return fd;
}
