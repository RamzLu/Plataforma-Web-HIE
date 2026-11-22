import { z } from "zod";
import {
  textoOpcional,
  textoObligatorio,
  booleano,
  fechaOpcional,
  idObligatorio,
  estadoPedido,
  exigirFechaSiProgramado,
} from "./comunes.js";

// Esquemas de lo que el CM manda al crear (POST) y editar (PUT) cada módulo, y de la revisión del Admin.
//
// Validan tipos, largos (los de la base), estados permitidos y fechas. Las reglas del flujo (qué pasa al
// publicar, archivar, etc.) siguen en los servicios. Los campos que no se mencionan acá pasan sin tocarse
// (z.looseObject): los servicios leen algunos que dependen del formulario (imágenes existentes, URLs...).
//
// Al crear, los campos obligatorios tienen que venir. Al editar solo se valida lo que venga.

const objeto = (forma) => z.looseObject(forma);
const siCrea = (crea, obligatorio, opcional) => (crea ? obligatorio : opcional.optional());

// ---------------------------------------------------------------- Noticias
const listaDeTextosEnJson = (etiqueta) =>
  z
    .string({ error: `${etiqueta} no es válido.` })
    .refine((valor) => {
      if (valor.trim() === "") return true;
      try {
        const parsed = JSON.parse(valor);
        return Array.isArray(parsed) && parsed.every((x) => typeof x === "string");
      } catch {
        return false;
      }
    }, `${etiqueta} no es válido.`)
    .nullish();

const noticia = (crea) =>
  objeto({
    titulo: siCrea(crea, textoObligatorio("El título", 200), textoObligatorio("El título", 200)),
    contenido: siCrea(crea, textoObligatorio("El contenido", 200000), textoOpcional("El contenido", 200000)),
    categoriaNombre: textoOpcional("La categoría", 100),
    estado: estadoPedido,
    fechaPublicacion: fechaOpcional("La fecha de publicación"),
    imagenesExistentes: listaDeTextosEnJson("La lista de imágenes existentes"),
  }).superRefine(exigirFechaSiProgramado());

// ---------------------------------------------------------------- Documentación
const documento = (crea) =>
  objeto({
    titulo: siCrea(crea, textoObligatorio("El título", 200), textoObligatorio("El título", 200)),
    descripcion: textoOpcional("La descripción", 5000),
    categoria: textoOpcional("La categoría", 100),
    estado: estadoPedido,
  });

// ---------------------------------------------------------------- Profesionales
const profesional = () =>
  objeto({
    nombre: textoObligatorio("El nombre", 100).optional(),
    apellido: textoObligatorio("El apellido", 100).optional(),
    matricula: textoOpcional("La matrícula", 50),
    cargo: textoOpcional("El cargo", 100),
    descripcion: textoOpcional("La descripción", 5000),
    especialidadId: idObligatorio("El área o especialidad"),
    esServicio: booleano("El tipo de área"),
    estado: estadoPedido,
    editor: textoOpcional("El editor", 150),
    editorNombre: textoOpcional("El editor", 150),
  });

const profesionalCrea = () =>
  profesional().extend({
    nombre: textoObligatorio("El nombre", 100),
    apellido: textoObligatorio("El apellido", 100),
  });

// ---------------------------------------------------------------- Especialidades y servicios
const requisitos = z
  .union(
    [
      z.string().max(20000, "Los requisitos no pueden superar los 20000 caracteres."),
      z.array(z.string().max(500, "Cada requisito no puede superar los 500 caracteres.")).max(100, "Hay demasiados requisitos."),
    ],
    { error: "Los requisitos no son válidos." }
  )
  .nullish();

const especialidad = (crea) =>
  objeto({
    nombre: siCrea(crea, textoObligatorio("El nombre", 150), textoObligatorio("El nombre", 150)),
    descripcion: textoOpcional("La descripción", 10000),
    ubicacion: textoOpcional("La ubicación", 1000),
    horarios: textoOpcional("Los horarios", 2000),
    requisitos,
    documentacionNecesaria: textoOpcional("La documentación necesaria", 10000),
    informacionDerivacion: textoOpcional("La información de derivación", 10000),
    esServicio: booleano("El tipo (especialidad o servicio)"),
    estado: estadoPedido,
    editor: textoOpcional("El editor", 150),
    editorNombre: textoOpcional("El editor", 150),
  });

// ---------------------------------------------------------------- Residencias
const residencia = (crea) =>
  objeto({
    nombre: siCrea(crea, textoObligatorio("El nombre", 200), textoObligatorio("El nombre", 200)),
    descripcion: textoOpcional("El resumen", 5000),
    categoria: textoOpcional("La categoría", 255),
    descripcionPrograma: textoOpcional("El programa académico", 50000),
    cupos: textoOpcional("Los cupos", 50),
    duracion: textoOpcional("La duración", 255),
    requisitos: textoOpcional("Los requisitos", 50000),
    reglamentoRotacion: textoOpcional("La leyenda de reglamento", 5000),
    convocatoria: textoOpcional("El estado de la convocatoria", 100),
    fechaInicio: fechaOpcional("La fecha de inicio"),
    fechaConvocatoria: fechaOpcional("La fecha límite de la convocatoria"),
    fechaPublicacion: fechaOpcional("La fecha de publicación"),
    estado: estadoPedido,
    activo: booleano("El campo activo"),
    eliminarBanner: booleano("Eliminar banner"),
    eliminarDocumento: booleano("Eliminar documento"),
    editor: textoOpcional("El editor", 150),
  }).superRefine(exigirFechaSiProgramado());

// ---------------------------------------------------------------- Capacitaciones
const MODALIDADES = ["Presencial", "Virtual", "Híbrida"];

const capacitacion = (crea) =>
  objeto({
    titulo: siCrea(crea, textoObligatorio("El título", 200), textoObligatorio("El título", 200)),
    descripcion: textoOpcional("La descripción", 10000),
    contenido: textoOpcional("El temario", 100000),
    temario: textoOpcional("El temario", 100000),
    modalidad: z
      .enum(MODALIDADES, { error: `La modalidad no es válida. Opciones: ${MODALIDADES.join(", ")}.` })
      .optional(),
    tipoRecurso: textoOpcional("El tipo de recurso", 50),
    horario: textoOpcional("El horario", 50),
    ubicacion: textoOpcional("La ubicación", 255),
    disertantes: textoOpcional("Los disertantes", 1000),
    fechaInicio: fechaOpcional("La fecha de inicio"),
    fechaFin: fechaOpcional("La fecha de fin"),
    videoUrl: textoOpcional("La URL del video", 2048),
    enlaceUrl: textoOpcional("La URL del enlace", 2048),
    archivoUrl: textoOpcional("La URL del archivo", 2048),
    bannerUrl: textoOpcional("La URL del banner", 2048),
    imagenUrl: textoOpcional("La URL de la imagen", 2048),
    estado: estadoPedido,
    activo: booleano("El campo activo"),
    eliminarBanner: booleano("Eliminar banner"),
    eliminarArchivo: booleano("Eliminar archivo"),
  }).superRefine((datos, ctx) => {
    if (datos.fechaInicio && datos.fechaFin && new Date(datos.fechaFin) < new Date(datos.fechaInicio)) {
      ctx.addIssue({ code: "custom", path: ["fechaFin"], message: "La fecha de fin no puede ser anterior a la de inicio." });
    }
  });

// ---------------------------------------------------------------- Revisión del Admin (igual para todos)
const DECISIONES = ["APROBAR", "RECHAZAR"];

export const esquemaRevision = objeto({
  decision: z.preprocess(
    (valor) => (typeof valor === "string" ? valor.trim().toUpperCase() : valor),
    z.enum(DECISIONES, { error: "Debe indicar la decisión de la revisión: APROBAR o RECHAZAR." })
  ),
  motivo: textoOpcional("El motivo", 1000),
  esServicio: booleano("El tipo (especialidad o servicio)"),
}).superRefine((datos, ctx) => {
  if (datos.decision === "RECHAZAR" && !datos.motivo) {
    ctx.addIssue({ code: "custom", path: ["motivo"], message: "Debe especificar un motivo de rechazo." });
  }
});

/** Esquemas de crear y actualizar de cada módulo, por la ruta con la que se exponen. */
export const ESQUEMAS_EDITORIALES = {
  noticias: { crear: noticia(true), actualizar: noticia(false) },
  documentacion: { crear: documento(true), actualizar: documento(false) },
  profesionales: { crear: profesionalCrea(), actualizar: profesional() },
  especialidades: { crear: especialidad(true), actualizar: especialidad(false) },
  residencias: { crear: residencia(true), actualizar: residencia(false) },
  capacitaciones: { crear: capacitacion(true), actualizar: capacitacion(false) },
};
