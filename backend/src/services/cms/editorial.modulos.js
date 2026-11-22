// Los módulos del CMS con flujo editorial, todos con la misma forma para que se expongan con las mismas rutas
// (ver routes/cms.routes.js y controllers/cms/editorial.controller.js).
//
// Cada módulo define:
//   ruta      segmento de la URL: /api/cms/<ruta>
//   clave     nombre con el que su servicio devuelve el registro ("noticia", "documento"...)
//   entidad   (registro) => nombre de la entidad para las solicitudes de eliminación
//   listar    (esVistaAdmin) => lista (con esVistaAdmin=false, solo lo publicado: es lo que lee el portal)
//   crear / actualizar   (req) => resultado       (el CM pide con el campo "estado")
//   revisar   (req, { decision, motivo }) => resultado   (solo el Admin; decision: APROBAR | RECHAZAR)
//   eliminar  (req) => resultado
//   archivos  middleware de carga de archivos que usan crear y actualizar (o null)
//
// Los servicios todavía devuelven el registro bajo su propia clave; el controlador lo unifica en { message, data }.

import noticias from "./cms.noticia.service.js";
import documentos from "./cms.doc.service.js";
import profesionales from "./cms.profesional.service.js";
import especialidades from "./cms.especialidad.service.js";
import residencias from "./cms.residencia.service.js";
import capacitaciones from "./cms.capacitacion.service.js";
import {
  uploadImagenSingle,
  uploadImagenesArray,
  uploadDocumentoSingle,
  uploadResidenciaFiles,
  uploadCapacitacionFiles,
} from "../../middlewares/upload.middleware.js";

// Los servicios que todavía reciben { estado, rejectionReason } reciben la decisión en ese formato.
const comoEstado = ({ decision, motivo }) => ({ estado: decision, rejectionReason: motivo });

export const MODULOS_EDITORIALES = [
  {
    ruta: "noticias",
    clave: "noticia",
    entidad: () => "noticia",
    listar: (admin) => noticias.obtenerNoticias(admin),
    crear: (req) => noticias.crearNoticia(req.body, req.files || [], req.user),
    actualizar: (req) => noticias.actualizarNoticia(req.params.id, req.body, req.files || [], req.user),
    revisar: (req, d) => noticias.evaluarNoticia(req.params.id, comoEstado(d), req.user),
    eliminar: (req) => noticias.eliminarNoticia(req.params.id, { user: req.user }),
    archivos: uploadImagenesArray("imagenes", 10),
  },
  {
    ruta: "documentacion",
    clave: "documento",
    entidad: () => "documento",
    listar: (admin) => documentos.obtenerDocumentos(admin),
    crear: (req) => documentos.crearDocumento(req.body, req.file, req.user),
    actualizar: (req) => documentos.actualizarDocumento(req.params.id, req.body, req.file, req.user),
    revisar: (req, d) => documentos.evaluarDocumento(req.params.id, comoEstado(d), req.user),
    eliminar: (req) => documentos.eliminarDocumento(req.params.id, { user: req.user }),
    archivos: uploadDocumentoSingle("archivo"),
  },
  {
    ruta: "profesionales",
    clave: "profesional",
    entidad: () => "profesional",
    listar: (admin) => profesionales.obtenerProfesionales(admin),
    crear: (req) => profesionales.crearProfesional(req.body, req.file, req.user),
    actualizar: (req) => profesionales.actualizarProfesional(req.params.id, req.body, req.file, req.user),
    revisar: (req, d) => profesionales.evaluarProfesional(req.params.id, comoEstado(d), req.user),
    eliminar: (req) => profesionales.eliminarProfesional(req.params.id, { user: req.user }),
    archivos: uploadImagenSingle("archivo"),
  },
  {
    // Especialidades y servicios comparten ruta; se distinguen con "esServicio" (en el cuerpo, o en la URL al eliminar).
    ruta: "especialidades",
    clave: "data",
    entidad: (registro) => (registro.esServicio ? "servicio" : "especialidad"),
    listar: (admin) => especialidades.obtenerEspecialidades(admin),
    crear: (req) => especialidades.crearEspecialidad({ ...req.body }, req.user),
    actualizar: (req) => especialidades.actualizarEspecialidad(req.params.id, { ...req.body }, req.user),
    revisar: (req, d) =>
      especialidades.evaluarEspecialidad(req.params.id, { ...comoEstado(d), esServicio: req.body.esServicio }, req.user),
    eliminar: (req) => especialidades.eliminarEspecialidad(req.params.id, req.query.esServicio, { user: req.user }),
    archivos: null,
  },
  {
    ruta: "residencias",
    clave: "residencia",
    entidad: () => "residencia",
    listar: (admin) => residencias.obtenerResidencias(admin),
    crear: (req) => residencias.crearResidencia(req.body, req.files || req.file, req.user),
    actualizar: (req) => residencias.actualizarResidencia(req.params.id, req.body, req.files || req.file, req.user),
    revisar: (req, d) => residencias.revisar(req.params.id, d, req.user),
    eliminar: (req) => residencias.eliminarResidencia(req.params.id, { user: req.user }),
    archivos: uploadResidenciaFiles,
  },
  {
    ruta: "capacitaciones",
    clave: "capacitacion",
    entidad: () => "capacitacion",
    listar: (admin) => (admin ? capacitaciones.obtenerCapacitaciones() : capacitaciones.obtenerCapacitacionesPublicas()),
    crear: (req) => capacitaciones.crearCapacitacion(req.body, req.files || req.file, req.user),
    actualizar: (req) => capacitaciones.actualizarCapacitacion(req.params.id, req.body, req.files || req.file, req.user),
    revisar: (req, d) => capacitaciones.revisar(req.params.id, d, req.user),
    eliminar: (req) => capacitaciones.eliminarCapacitacion(req.params.id, { user: req.user }),
    archivos: uploadCapacitacionFiles,
  },
];

export const MODULO_POR_RUTA = Object.fromEntries(MODULOS_EDITORIALES.map((m) => [m.ruta, m]));
