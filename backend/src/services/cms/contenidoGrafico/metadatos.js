// Los metadatos de cada bloque se guardan como JSON en contenido_grafico.descripcion.

/**
 * Extrae metadatos estructurados almacenados en `contenido_grafico.descripcion`.
 */
export function parsearMetadatosDescripcion(rawDesc) {
  if (!rawDesc || typeof rawDesc !== "string") return {};
  try {
    const parsed = JSON.parse(rawDesc);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Si fuera texto plano heredado, se ignora como JSON
  }
  return {};
}
