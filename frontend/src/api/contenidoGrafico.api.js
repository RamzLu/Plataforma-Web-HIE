import api from "./axiosConfig.js";
import keycloak from "../config/keycloak.js";

const buildAuthHeaders = (token) => {
  const resolvedToken =
    token || keycloak?.token || localStorage.getItem("token") || "";
  return resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {};
};

/**
 * Obtiene la lista de espacios gráficos fijos predefinidos en la base de datos (`GET /api/cms/contenido-grafico`).
 */
export const getContenidosGraficos = async () => {
  try {
    const response = await api.get("/cms/contenido-grafico");
    return response.data;
  } catch (error) {
    try {
      const fallback = await api.get("/cms/banners?modo=espacios");
      return fallback.data;
    } catch {
      throw error;
    }
  }
};

/**
 * Actualiza el arreglo de imágenes (carrusel), archivos recortados y metadatos de un espacio fijo (`PUT /api/cms/contenido-grafico/:id`).
 */
export const updateContenidoGrafico = async (id, payload, token) => {
  const headers = buildAuthHeaders(token);
  const formData = new FormData();

  formData.append("espacioKey", payload.espacioKey || String(id));
  formData.append("nombre", payload.nombre || payload.titulo || "");
  formData.append("descripcionEspacio", payload.descripcion || "");
  formData.append("tipo", payload.tipo || "Banner Principal");
  formData.append("ubicacion", payload.ubicacion || payload.tipo || "Banner Principal");
  formData.append("dimensiones", payload.dimensiones || "1920x1080px");
  formData.append("page", payload.page || payload.pagina || "Inicio");
  formData.append("estado", payload.estado || "APROBADO");
  formData.append(
    "activo",
    String(
      payload.activo !== undefined
        ? payload.activo
        : payload.estado === "APROBADO" || payload.estado === "PUBLICADO"
    )
  );
  if (payload.rejectionReason !== undefined && payload.rejectionReason !== null) {
    formData.append("rejectionReason", payload.rejectionReason);
  }

  const rawImagenes = Array.isArray(payload.imagenes) ? payload.imagenes : [];
  const cleanImagenes = rawImagenes.map((img, idx) => {
    const hasBinaryFile =
      img.fileObj &&
      (typeof File !== "undefined" && img.fileObj instanceof File
        ? true
        : typeof Blob !== "undefined" && img.fileObj instanceof Blob);

    if (hasBinaryFile) {
      formData.append(
        `imagen_${idx}`,
        img.fileObj,
        img.fileName || `imagen_${idx + 1}.jpg`
      );
    }

    return {
      id: img.id || `img-${id}-${idx + 1}`,
      url:
        img.url && !String(img.url).startsWith("blob:") ? String(img.url) : "",
      archivoId: hasBinaryFile ? null : img.archivoId || null,
      nombreArchivo: hasBinaryFile ? null : img.nombreArchivo || null,
      fileName: img.fileName || `imagen_${idx + 1}.jpg`,
      altText: img.altText || "",
      titulo: img.titulo || "",
      enlaceTexto: img.enlaceTexto || "",
      enlaceUrl: img.enlaceUrl || "",
    };
  });

  formData.append("imagenes", JSON.stringify(cleanImagenes));

  const targetId = payload.id || id;

  try {
    const response = await api.put(
      `/cms/contenido-grafico/${encodeURIComponent(targetId)}`,
      formData,
      { headers }
    );
    return response.data;
  } catch (error) {
    const fallback = await api.put(
      `/cms/banners/${encodeURIComponent(targetId)}`,
      formData,
      { headers }
    );
    return fallback.data;
  }
};

/**
 * Cambia el estado editorial (Aprobar / Rechazar con motivo) de un espacio gráfico (`PATCH /api/cms/contenido-grafico/:id/estado`).
 */
export const cambiarEstadoContenidoGrafico = async (
  id,
  { estado, rejectionReason = null },
  token
) => {
  const headers = buildAuthHeaders(token);
  const response = await api.patch(
    `/cms/contenido-grafico/${encodeURIComponent(id)}/estado`,
    { estado, rejectionReason },
    { headers }
  );
  return response.data;
};
