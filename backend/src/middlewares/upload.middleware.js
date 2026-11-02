import multer from "multer";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  extraerExtension,
  validarFirmaArchivo,
} from "../utils/file.utils.js";

// Límites de tamaño por tipo de archivo
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB para imágenes
export const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15 MB para documentos
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB para videos de capacitación

const crearErrorArchivo = (mensaje, statusCode = 400) => {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
};

/**
 * Valida que el archivo cumpla con el mapa de tipos MIME y extensiones permitidas.
 */
const validarMimeYExtension = (file, allowedMap, etiquetaTipos) => {
  const mime = (file.mimetype || "").toLowerCase();
  const ext = extraerExtension(file.originalname);

  const typeConfig = allowedMap[mime];
  if (!typeConfig || !ext || !typeConfig.exts.includes(ext)) {
    throw crearErrorArchivo(
      `Tipo de archivo no permitido en "${file.fieldname}" (${file.originalname}). Formatos aceptados: ${etiquetaTipos}.`
    );
  }
};

/**
 * Traduce errores propios de Multer (tamaño, cantidad, campo inesperado) a HTTP 400 con mensaje claro.
 */
const formatearErrorMulter = (err, maxBytes) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      return crearErrorArchivo(`El archivo supera el tamaño máximo permitido (${maxMb} MB).`, 400);
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return crearErrorArchivo("Se superó la cantidad máxima de archivos permitidos.", 400);
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return crearErrorArchivo(`Campo de archivo no permitido o excedido: "${err.field || "desconocido"}".`, 400);
    }
    return crearErrorArchivo(`Error en la carga del archivo: ${err.message}`, 400);
  }
  return err;
};

/**
 * Envuelve un middleware de Multer para:
 * 1. Capturar MulterError y devolver 400.
 * 2. Aplanar req.files si proviene de .fields() para mantener compatibilidad con los servicios.
 * 3. Verificar la firma binaria (magic bytes) y límites específicos por campo una vez cargado el buffer.
 */
const ejecutarMulterConValidacion = (multerHandler, maxBytes, postValidator) => {
  return (req, res, next) => {
    multerHandler(req, res, (err) => {
      if (err) {
        return next(formatearErrorMulter(err, maxBytes));
      }

      try {
        // Si req.files es un objeto generado por .fields(), lo normalizamos a un array plano
        if (req.files && !Array.isArray(req.files) && typeof req.files === "object") {
          req.files = Object.values(req.files).flat();
        }

        const listaArchivos = [];
        if (req.file) listaArchivos.push(req.file);
        if (Array.isArray(req.files)) listaArchivos.push(...req.files);

        for (const file of listaArchivos) {
          if (! validarFirmaArchivo(file.buffer, file.mimetype)) {
            throw crearErrorArchivo(
              `El contenido real del archivo "${file.originalname}" no coincide con su formato declarado (${file.mimetype}) o contiene código no permitido.`
            );
          }
          if (postValidator) {
            postValidator(file);
          }
        }

        return next();
      } catch (validationErr) {
        return next(validationErr);
      }
    });
  };
};

// ─── 1. SUBIDA DE IMÁGENES (Banners, Contenido Gráfico, Profesionales, Autoridades, Noticias) ───

const imageFileFilter = (req, file, cb) => {
  try {
    validarMimeYExtension(file, ALLOWED_IMAGE_TYPES, "JPG, JPEG, PNG, WEBP, GIF");
    cb(null, true);
  } catch (err) {
    cb(err, false);
  }
};

export const uploadImagenSingle = (fieldName) => {
  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    fileFilter: imageFileFilter,
  }).single(fieldName);

  return ejecutarMulterConValidacion(uploader, MAX_IMAGE_SIZE);
};

export const uploadImagenesArray = (fieldName, maxCount = 10) => {
  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: maxCount },
    fileFilter: imageFileFilter,
  }).array(fieldName, maxCount);

  return ejecutarMulterConValidacion(uploader, MAX_IMAGE_SIZE);
};

// ─── 2. SUBIDA DE DOCUMENTOS (Documentación institucional) ───────────────────────

const documentFileFilter = (req, file, cb) => {
  try {
    validarMimeYExtension(
      file,
      ALLOWED_DOCUMENT_TYPES,
      "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX"
    );
    cb(null, true);
  } catch (err) {
    cb(err, false);
  }
};

export const uploadDocumentoSingle = (fieldName) => {
  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_DOCUMENT_SIZE, files: 1 },
    fileFilter: documentFileFilter,
  }).single(fieldName);

  return ejecutarMulterConValidacion(uploader, MAX_DOCUMENT_SIZE);
};

// ─── 3. SUBIDA EN RESIDENCIAS (Banner imagen + Documento adjunto, sin .any()) ────

const residenciaFileFilter = (req, file, cb) => {
  try {
    if (file.fieldname === "banner" || file.fieldname === "imagen") {
      validarMimeYExtension(file, ALLOWED_IMAGE_TYPES, "JPG, JPEG, PNG, WEBP, GIF");
      return cb(null, true);
    }
    if (file.fieldname === "documento" || file.fieldname === "archivo") {
      validarMimeYExtension(
        file,
        ALLOWED_DOCUMENT_TYPES,
        "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX"
      );
      return cb(null, true);
    }
    return cb(crearErrorArchivo(`Campo de archivo no permitido en residencias: "${file.fieldname}".`), false);
  } catch (err) {
    return cb(err, false);
  }
};

const residenciaUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: 2 },
  fileFilter: residenciaFileFilter,
}).fields([
  { name: "banner", maxCount: 1 },
  { name: "imagen", maxCount: 1 },
  { name: "documento", maxCount: 1 },
  { name: "archivo", maxCount: 1 },
]);

export const uploadResidenciaFiles = ejecutarMulterConValidacion(
  residenciaUploader,
  MAX_DOCUMENT_SIZE,
  (file) => {
    if ((file.fieldname === "banner" || file.fieldname === "imagen") && file.size > MAX_IMAGE_SIZE) {
      throw crearErrorArchivo("La imagen de banner no puede superar los 5 MB.");
    }
  }
);

// ─── 4. SUBIDA EN CAPACITACIONES (Banner imagen + Material multimedia/doc, sin .any()) ───

const CAPACITACION_MATERIAL_TYPES = {
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
};

const capacitacionFileFilter = (req, file, cb) => {
  try {
    if (file.fieldname === "banner" || file.fieldname === "imagen") {
      validarMimeYExtension(file, ALLOWED_IMAGE_TYPES, "JPG, JPEG, PNG, WEBP, GIF");
      return cb(null, true);
    }
    if (file.fieldname === "archivo" || file.fieldname === "material") {
      validarMimeYExtension(
        file,
        CAPACITACION_MATERIAL_TYPES,
        "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, WEBP, MP4, WEBM"
      );
      return cb(null, true);
    }
    return cb(crearErrorArchivo(`Campo de archivo no permitido en capacitaciones: "${file.fieldname}".`), false);
  } catch (err) {
    return cb(err, false);
  }
};

const capacitacionUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE, files: 2 },
  fileFilter: capacitacionFileFilter,
}).fields([
  { name: "banner", maxCount: 1 },
  { name: "imagen", maxCount: 1 },
  { name: "archivo", maxCount: 1 },
  { name: "material", maxCount: 1 },
]);

export const uploadCapacitacionFiles = ejecutarMulterConValidacion(
  capacitacionUploader,
  MAX_VIDEO_SIZE,
  (file) => {
    if ((file.fieldname === "banner" || file.fieldname === "imagen") && file.size > MAX_IMAGE_SIZE) {
      throw crearErrorArchivo("La imagen de portada/banner no puede superar los 5 MB.");
    }
    if (file.fieldname === "archivo" || file.fieldname === "material") {
      if (ALLOWED_IMAGE_TYPES[file.mimetype] && file.size > MAX_IMAGE_SIZE) {
        throw crearErrorArchivo("La imagen de material didáctico no puede superar los 5 MB.");
      }
      if (ALLOWED_DOCUMENT_TYPES[file.mimetype] && file.size > MAX_DOCUMENT_SIZE) {
        throw crearErrorArchivo("El documento de material didáctico no puede superar los 15 MB.");
      }
    }
  }
);
