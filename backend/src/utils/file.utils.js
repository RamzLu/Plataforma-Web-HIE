import crypto from "node:crypto";

/**
 * Mapa de tipos MIME permitidos por categoría hacia su extensión canónica segura
 * y las extensiones de entrada aceptadas.
 * Nota de seguridad (V6): Se excluyen explícitamente .svg, .html, .xml y scripts
 * para impedir XSS almacenado al servir archivos desde Supabase Storage.
 */
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": { canonicalExt: "jpg", exts: ["jpg", "jpeg"] },
  "image/png": { canonicalExt: "png", exts: ["png"] },
  "image/webp": { canonicalExt: "webp", exts: ["webp"] },
  "image/gif": { canonicalExt: "gif", exts: ["gif"] },
};

export const ALLOWED_DOCUMENT_TYPES = {
  "application/pdf": { canonicalExt: "pdf", exts: ["pdf"] },
  "application/msword": { canonicalExt: "doc", exts: ["doc"] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    canonicalExt: "docx",
    exts: ["docx"],
  },
  "application/vnd.ms-excel": { canonicalExt: "xls", exts: ["xls"] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    canonicalExt: "xlsx",
    exts: ["xlsx"],
  },
  "application/vnd.ms-powerpoint": { canonicalExt: "ppt", exts: ["ppt"] },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    canonicalExt: "pptx",
    exts: ["pptx"],
  },
};

export const ALLOWED_VIDEO_TYPES = {
  "video/mp4": { canonicalExt: "mp4", exts: ["mp4"] },
  "video/webm": { canonicalExt: "webm", exts: ["webm"] },
};

export const ALL_ALLOWED_TYPES = {
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES,
};

const SAFE_EXTENSIONS = new Set(
  Object.values(ALL_ALLOWED_TYPES).flatMap((t) => t.exts)
);

/**
 * Extrae la extensión en minúsculas de un nombre de archivo de forma segura.
 */
export const extraerExtension = (originalName = "") => {
  if (typeof originalName !== "string") return "";
  const baseName = originalName.split(/[\\/]/).pop() || "";
  const parts = baseName.split(".");
  if (parts.length < 2) return "";
  return parts.pop().toLowerCase().trim();
};

/**
 * Verifica que los primeros bytes del buffer (magic bytes) coincidan con el tipo MIME declarado,
 * evitando que se suban archivos .html, .svg o scripts renombrados como .jpg o .pdf.
 */
export const validarFirmaArchivo = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;

  // Rechazo explícito de contenido textual ejecutable en navegador (HTML / SVG / XML / Script)
  const headText = buffer.subarray(0, 256).toString("utf8").trimStart().toLowerCase();
  if (
    headText.startsWith("<!doctype html") ||
    headText.startsWith("<html") ||
    headText.startsWith("<svg") ||
    headText.startsWith("<?xml") ||
    headText.startsWith("<script") ||
    headText.includes("<svg") ||
    headText.includes("<script")
  ) {
    return false;
  }

  switch (mimeType) {
    case "image/jpeg":
      // FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case "image/png":
      // 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );

    case "image/gif":
      // GIF87a o GIF89a
      return (
        buffer.length >= 6 &&
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) &&
        buffer[5] === 0x61
      );

    case "image/webp":
      // RIFF....WEBP
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );

    case "application/pdf":
      // %PDF-
      return buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";

    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.ms-powerpoint":
      // OLE2 Compound Document: D0 CF 11 E0 A1 B1 1A E1
      return (
        buffer.length >= 8 &&
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1
      );

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      // ZIP container (PK\x03\x04)
      return (
        buffer.length >= 4 &&
        buffer[0] === 0x50 &&
        buffer[1] === 0x4b &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      );

    case "video/mp4":
      // ISO Base Media File Format: bytes 4..7 == "ftyp"
      return buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";

    case "video/webm":
      // EBML Header: 1A 45 DF A3
      return (
        buffer[0] === 0x1a &&
        buffer[1] === 0x45 &&
        buffer[2] === 0xdf &&
        buffer[3] === 0xa3
      );

    default:
      return false;
  }
};

/**
 * Genera un nombre de archivo único criptográficamente seguro con extensión validada contra lista blanca.
 */
export const generarNombreUnico = (originalName, prefix = "file", mimeType = "") => {
  if (!originalName) return { nombreUnico: null, extension: null };

  const rawExt = extraerExtension(originalName);
  const typeInfo = mimeType ? ALL_ALLOWED_TYPES[mimeType] : null;

  let extension = null;
  if (typeInfo) {
    extension = typeInfo.canonicalExt;
  } else if (rawExt && SAFE_EXTENSIONS.has(rawExt)) {
    extension = rawExt === "jpeg" ? "jpg" : rawExt;
  }

  if (!extension) {
    const error = new Error(`Extensión o tipo de archivo no permitido: .${rawExt || "desconocido"}`);
    error.statusCode = 400;
    throw error;
  }

  const safePrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, "") || "file";
  const randomStr = crypto.randomBytes(8).toString("hex");
  const nombreUnico = `${safePrefix}_${Date.now()}_${randomStr}.${extension}`;

  return { nombreUnico, extension };
};
