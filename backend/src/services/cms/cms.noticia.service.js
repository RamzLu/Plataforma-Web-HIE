import { crearMetaEditorial } from "../../utils/metaEditorial.utils.js";
import { tieneVersionPublica, tieneEdicionPendiente, estaVisibleEnPortal, nombreDeLaVersionPublica, conservaVersionPublica, MOTIVO_EDICION_REEMPLAZADA, solicitarEliminacion, limpiarSolicitudEliminacion } from "../../utils/eliminacion.utils.js";
import { prisma } from "../../config/prisma.js";
import { supabase } from "../../config/supabase.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { sanitizarHtmlNoticia, parsearIdBigInt, parsearArregloJson } from "../../utils/sanitize.utils.js";
import { combinarCambios, cambiosParaCliente } from "../../utils/cambios.utils.js";
import { limitePublicacionProgramada } from "../../utils/programacion.utils.js";
import { registrarAuditoria, ACCIONES } from "../../utils/auditoria.utils.js";
import { eliminarArchivosReemplazados, refDeArchivo, refDesdeUrl } from "../../utils/archivos.utils.js";
import { resolverSolicitud, resolverRevision, intencionDesdeEstado, decisionDesdeEstado, pideCambioDeEstado, mensajeSinCambios } from "../../utils/flujoEditorial.utils.js";
import { urlsDeImagenes, subirImagenes, quitarImagenesDescartadas } from "./noticias/imagenes.js";
import { nombreCategoriaVisible, buscarOCrearCategoria } from "./noticias/categoria.js";
import { cambiosDeTexto, cambiosDeNoticia } from "./noticias/cambios.js";
import { nombresDeEditores, formatearNoticia, formatearVersionPublicada, formatearNoticiaGuardada } from "./noticias/formato.js";

const metaEditorial = crearMetaEditorial({ entidad: "noticia", modelos: { "": "noticia" } });

/** ¿Se pidió programar la publicación? (estado de programación y con fecha) */
const pideProgramar = (estado, fechaPublicacion) =>
  (estado === "PROGRAMADO" || estado === "PENDIENTE_APROBACION") && Boolean(fechaPublicacion);

class CmsNoticiaService {
  // Metadatos editoriales (motivo de rechazo, cambios pendientes, editor): ver utils/metaEditorial.utils.js
  obtenerMapaMotivosRechazo() { return metaEditorial.obtenerMapaMotivosRechazo(); }
  obtenerMotivoRechazo(id) { return metaEditorial.obtenerMotivoRechazo(id); }
  guardarMotivoRechazo(id, motivo) { return metaEditorial.guardarMotivoRechazo(id, motivo); }
  limpiarMotivoRechazo(id) { return metaEditorial.limpiarMotivoRechazo(id); }
  obtenerMapaPendingMeta() { return metaEditorial.obtenerMapaPendingMeta(); }
  obtenerPendingMeta(id) { return metaEditorial.obtenerPendingMeta(id); }
  guardarPendingMeta(id, meta) { return metaEditorial.guardarPendingMeta(id, meta); }
  limpiarPendingMeta(id) { return metaEditorial.limpiarPendingMeta(id); }

  async crearNoticia(data, archivosSubidos, user) {
    const { titulo, estado, fechaPublicacion, categoriaNombre } = data;
    // El cuerpo es HTML que luego se muestra en el portal: se sanea antes de validarlo y guardarlo.
    const contenido = sanitizarHtmlNoticia(data.contenido);

    if (!titulo || !contenido) {
      const error = new Error("Faltan campos obligatorios: titulo y contenido.");
      error.statusCode = 400;
      throw error;
    }

    const estadoSolicitado = estado ? estado.toUpperCase() : "BORRADOR";
    const tieneFechaProgramada = pideProgramar(estadoSolicitado, fechaPublicacion);
    // Regla común (utils/flujoEditorial.utils.js): borrador queda en borrador; publicar/programar va a revisión.
    const solicitud = resolverSolicitud({
      estadoActual: null,
      intencion: intencionDesdeEstado(estadoSolicitado, { tieneFecha: tieneFechaProgramada }),
    });
    const estadoFinal = solicitud.estado;

    const categoria = await buscarOCrearCategoria(nombreCategoriaVisible(categoriaNombre));
    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);

    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo,
        contenido,
        categoriaId: categoria.id,
        createdBy: usuarioLocal.id,
        estado: estadoFinal,
        updatedAt: new Date(),
        ...(tieneFechaProgramada ? { fechaPublicacion: new Date(fechaPublicacion) } : {}),
      },
      include: {
        creador: true,
        categoria_noticia: true,
      },
    });

    if (solicitud.meta) {
      await this.guardarPendingMeta(nuevaNoticia.id.toString(), solicitud.meta);
    }

    const imagenesUrlsGuardadas = await subirImagenes(nuevaNoticia.id, archivosSubidos);

    await registrarAuditoria(user, { entidad: "noticia", id: nuevaNoticia.id, accion: ACCIONES.CREAR, descripcion: `Creó la noticia "${nuevaNoticia.titulo}".` });
    return {
      message: "Exito",
      noticia: formatearNoticiaGuardada(nuevaNoticia, {
        categoria: nuevaNoticia.categoria_noticia.nombre,
        requestedEstado: solicitud.meta?.targetEstado ?? null,
        previousEstado: null,
        imagenes: imagenesUrlsGuardadas,
        editor: nombresDeEditores(nuevaNoticia).editor,
        editedBy: null,
        rejectionReason: null,
      }),
    };
  }

  async obtenerNoticias(esVistaAdmin = false) {
    const esConsultaInterna = esVistaAdmin === true;

    const [noticias, motivosMap, pendingMetaMap] = await Promise.all([
      prisma.noticia.findMany({
        where: esConsultaInterna
          ? {}
          : {
              estado: {
                in: ["PUBLICADO", "APROBADO", "PENDIENTE_APROBACION", "RECHAZADO"],
              },
            },
        orderBy: { createdAt: "desc" },
        include: {
          creador: true,
          editor: true,
          noticia_archivo: { include: { archivo: true } },
          categoria_noticia: true,
        },
      }),
      this.obtenerMapaMotivosRechazo(),
      this.obtenerMapaPendingMeta(),
    ]);

    const resultado = [];

    for (const noticia of noticias) {
      const idStr = noticia.id.toString();
      const pendingMeta = pendingMetaMap.get(idStr) || null;
      const estadoUpper = (noticia.estado || "").toUpperCase();

      if (!esConsultaInterna) {
        const esPublicadaDirecta = estadoUpper === "PUBLICADO" || estadoUpper === "APROBADO";
        const mantienePublicacionPrevia =
          (estadoUpper === "PENDIENTE_APROBACION" || estadoUpper === "RECHAZADO") &&
          (pendingMeta?.previousEstado === "PUBLICADO" || pendingMeta?.previousEstado === "APROBADO") &&
          Boolean(pendingMeta?.snapshotPublico);

        if (!esPublicadaDirecta && !mantienePublicacionPrevia) {
          continue;
        }

        if (mantienePublicacionPrevia) {
          resultado.push(formatearVersionPublicada(noticia, pendingMeta.snapshotPublico));
          continue;
        }
      }

      resultado.push(
        formatearNoticia(noticia, {
          imagenes: urlsDeImagenes(noticia.noticia_archivo),
          categoria: nombreCategoriaVisible(noticia.categoria_noticia?.nombre),
          requestedEstado: estadoUpper === "PENDIENTE_APROBACION" ? pendingMeta?.targetEstado || null : null,
          previousEstado: pendingMeta?.previousEstado || null,
          visibleEnPortal: estaVisibleEnPortal(noticia, pendingMeta),
          tituloPublicado: nombreDeLaVersionPublica(noticia, pendingMeta, "titulo"),
          rejectionReason: motivosMap.get(idStr) || null,
          extra: {
            // Los cambios se ven mientras la edición esté en revisión y también si el Admin la rechazó.
            cambios: estadoUpper === "PENDIENTE_APROBACION" || conservaVersionPublica(noticia, pendingMeta) ? cambiosParaCliente(pendingMeta?.cambios) : [],
            esActualizacion: (estadoUpper === "PENDIENTE_APROBACION" || conservaVersionPublica(noticia, pendingMeta)) && Boolean(pendingMeta?.esActualizacion),
            // Lo que ve hoy el portal, para poder mostrar la versión publicada mientras la actualización está en revisión.
            versionPublicada: esConsultaInterna && conservaVersionPublica(noticia, pendingMeta) ? pendingMeta.snapshotPublico : null,
          },
        })
      );
    }

    // El portal público no necesita saber quién editó cada registro: no se envían nombres del equipo.
    if (!esConsultaInterna) {
      return resultado.map(({ editor, editedBy, ...publico }) => publico);
    }
    return resultado;
  }

  async eliminarNoticia(id, { user = null, forzar = false } = {}) {
    const idBigInt = parsearIdBigInt(id, "ID de noticia");
    const noticia = await prisma.noticia.findUnique({
      where: { id: idBigInt },
      include: { noticia_archivo: { include: { archivo: true } } },
    });

    if (!noticia) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    // Si está visible en el portal, el CM no lo borra: queda una solicitud para el administrador.
    const pendingMetaElim = (await this.obtenerMapaPendingMeta()).get(id.toString()) || null;
    if (!forzar && tieneVersionPublica(noticia, pendingMetaElim)) {
      // Si había una edición pendiente, queda reemplazada por este pedido (gana la última acción del CM).
      const reemplazaEdicion = tieneEdicionPendiente(noticia, pendingMetaElim);
      if (reemplazaEdicion) {
        await prisma.noticia.update({ where: { id: idBigInt }, data: { estado: "RECHAZADO" } });
        await this.guardarMotivoRechazo(id.toString(), MOTIVO_EDICION_REEMPLAZADA);
      }
      return solicitarEliminacion({ entidad: "noticia", id: id.toString(), titulo: noticia.titulo, user, reemplazaEdicion });
    }
    await limpiarSolicitudEliminacion("noticia", id.toString());

    for (const na of noticia.noticia_archivo) {
      await supabase.storage.from("noticias-imagenes").remove([na.archivo.nombreArchivo]);
      await prisma.noticia_archivo.deleteMany({ where: { archivoId: na.archivo.id } });
      await prisma.archivo.delete({ where: { id: na.archivo.id } });
    }

    await prisma.noticia.delete({ where: { id: idBigInt } });
    await this.limpiarMotivoRechazo(id.toString());
    await this.limpiarPendingMeta(id.toString());
    await registrarAuditoria(user, { entidad: "noticia", id, accion: ACCIONES.ELIMINAR, descripcion: `Eliminó la noticia "${noticia.titulo}".` });
    return { message: "Exito" };
  }

  async actualizarNoticia(id, data, archivosSubidos, user) {
    const idBigInt = parsearIdBigInt(id, "ID de noticia");
    const { titulo, imagenesExistentes, estado, fechaPublicacion, categoriaNombre } = data;
    const urlsConservadas = parsearArregloJson(imagenesExistentes, "imagenesExistentes");
    // El cuerpo es HTML que luego se muestra en el portal: se sanea antes de guardarlo.
    const contenido = data.contenido ? sanitizarHtmlNoticia(data.contenido) : data.contenido;
    const usuarioEditor = await obtenerOCrearUsuarioLocal(user);

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: idBigInt },
      include: {
        noticia_archivo: { include: { archivo: true } },
        categoria_noticia: true,
      },
    });

    if (!noticiaExistente) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const idStr = id.toString();
    const metaExistente = await this.obtenerPendingMeta(idStr);
    const estadoAnterior = (noticiaExistente.estado || "").toUpperCase();
    const estadoSolicitado = estado ? estado.toUpperCase() : estadoAnterior;

    const imgsPrevias = urlsDeImagenes(noticiaExistente.noticia_archivo);
    const catPrevia = nombreCategoriaVisible(noticiaExistente.categoria_noticia?.nombre);

    // Validación: verificar si hubo cambios reales antes de modificar la noticia
    const catNuevaCheck = nombreCategoriaVisible(categoriaNombre ? categoriaNombre.trim() : catPrevia);
    const cambiosTexto = cambiosDeTexto(
      {
        titulo: noticiaExistente.titulo,
        category: catPrevia,
        contenido: noticiaExistente.contenido,
        fechaPublicacion: noticiaExistente.fechaPublicacion,
      },
      {
        titulo: titulo !== undefined ? titulo : noticiaExistente.titulo,
        category: catNuevaCheck,
        contenido: contenido !== undefined ? contenido : noticiaExistente.contenido,
        fechaPublicacion: fechaPublicacion !== undefined ? (fechaPublicacion ? new Date(fechaPublicacion) : null) : noticiaExistente.fechaPublicacion,
      }
    );

    const hayNuevasImagenes = Array.isArray(archivosSubidos) && archivosSubidos.length > 0;
    const imagenesCambiaron = hayNuevasImagenes || (
      Array.isArray(urlsConservadas) && (
        urlsConservadas.length !== imgsPrevias.length ||
        urlsConservadas.some((url, i) => url !== imgsPrevias[i])
      )
    );
    const estadoCambio = pideCambioDeEstado(estado, {
      estadoActual: estadoAnterior,
      meta: metaExistente,
      tieneFecha: pideProgramar(estadoSolicitado, fechaPublicacion),
    });

    if (cambiosTexto.length === 0 && !imagenesCambiaron && !estadoCambio) {
      const error = new Error(mensajeSinCambios(estadoAnterior));
      error.statusCode = 400;
      throw error;
    }

    const dataUpdate = {
      titulo: titulo || noticiaExistente.titulo,
      contenido: contenido || noticiaExistente.contenido,
      updatedAt: new Date(),
      updatedBy: usuarioEditor.id,
    };

    // Regla común (utils/flujoEditorial.utils.js): lo que es o fue público siempre pasa por el administrador,
    // y mientras tanto el portal sigue mostrando la versión publicada (snapshotPublico).
    const solicitud = resolverSolicitud({
      estadoActual: estadoAnterior,
      meta: metaExistente,
      intencion: intencionDesdeEstado(estadoSolicitado, { tieneFecha: pideProgramar(estadoSolicitado, fechaPublicacion) }),
      snapshotActual: () => ({
        titulo: noticiaExistente.titulo,
        contenido: noticiaExistente.contenido,
        category: catPrevia,
        images: imgsPrevias,
      }),
    });
    const snapshotPublico = solicitud.meta?.snapshotPublico ?? null;

    dataUpdate.estado = solicitud.estado;
    dataUpdate.fechaPublicacion =
      solicitud.meta?.targetEstado === "PROGRAMADO" ? new Date(fechaPublicacion) : null;
    if (solicitud.meta) {
      await this.guardarPendingMeta(idStr, solicitud.meta);
    } else {
      await this.limpiarPendingMeta(idStr);
    }
    if (solicitud.limpiarMotivo) {
      await this.limpiarMotivoRechazo(idStr);
    }

    if (categoriaNombre) {
      const categoria = await buscarOCrearCategoria(nombreCategoriaVisible(categoriaNombre.trim()), { sinDistinguirMayusculas: true });
      dataUpdate.categoriaId = categoria.id;
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: idBigInt },
      data: dataUpdate,
    });

    await quitarImagenesDescartadas({
      noticia: noticiaExistente,
      urlsConservadas,
      urlsProtegidas: snapshotPublico?.images || [],
    });
    await subirImagenes(noticiaActualizada.id, archivosSubidos);

    const noticiaConArchivos = await prisma.noticia.findUnique({
      where: { id: idBigInt },
      include: {
        creador: true,
        editor: true,
        noticia_archivo: { include: { archivo: true } },
        categoria_noticia: true,
      },
    });

    const imgs = urlsDeImagenes(noticiaConArchivos.noticia_archivo);
    const { editor: editorOriginal, editedBy: editadoPorNombre } = nombresDeEditores(noticiaConArchivos);
    const catFinal = nombreCategoriaVisible(noticiaConArchivos.categoria_noticia?.nombre);

    const motivoActual = await this.obtenerMotivoRechazo(idStr);
    let metaActual = await this.obtenerPendingMeta(idStr);

    // Detección automática de cambios para que el Admin vea qué se modificó
    if (noticiaActualizada.estado === "PENDIENTE_APROBACION" && metaActual) {
      const nuevosCambios = cambiosDeNoticia(
        {
          titulo: noticiaExistente.titulo,
          category: catPrevia,
          contenido: noticiaExistente.contenido,
          fechaPublicacion: noticiaExistente.fechaPublicacion,
          images: imgsPrevias,
        },
        {
          titulo: noticiaActualizada.titulo,
          category: catFinal,
          contenido: noticiaActualizada.contenido,
          fechaPublicacion: noticiaActualizada.fechaPublicacion,
          images: imgs,
        }
      );
      // Los cambios se acumulan contra la versión pública mientras la edición siga viva: si el Admin la rechazó y el CM
      // la vuelve a editar, lo que ya se había modificado (por ejemplo el título) tiene que seguir apareciendo.
      const cambiosPrevios = metaExistente?.cambios || [];
      metaActual = {
        ...metaActual,
        cambios: combinarCambios(cambiosPrevios, nuevosCambios),
        esActualizacion: true,
      };
      await this.guardarPendingMeta(idStr, metaActual);
    }

    await limpiarSolicitudEliminacion("noticia", id.toString()); // editar después de pedir la baja anula el pedido
    await registrarAuditoria(user, { entidad: "noticia", id: idStr, accion: ACCIONES.MODIFICAR, descripcion: `Modificó la noticia "${noticiaActualizada.titulo}".` });
    return {
      message: "Exito",
      noticia: formatearNoticiaGuardada(noticiaActualizada, {
        categoria: catFinal,
        requestedEstado: noticiaActualizada.estado === "PENDIENTE_APROBACION" ? metaActual?.targetEstado || null : null,
        previousEstado: metaActual?.previousEstado || null,
        visibleEnPortal: estaVisibleEnPortal(noticiaActualizada, metaActual),
        imagenes: imgs,
        editor: editorOriginal,
        editedBy: editadoPorNombre,
        rejectionReason: motivoActual,
      }),
    };
  }

  async evaluarNoticia(id, data, user) {
    const idBigInt = parsearIdBigInt(id, "ID de noticia");
    const { estado, rejectionReason } = data;

    if (!estado) {
      const error = new Error("Debe indicar el estado de evaluación (APROBADO o RECHAZADO).");
      error.statusCode = 400;
      throw error;
    }

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: idBigInt },
    });

    if (!noticiaExistente) {
      const error = new Error("Noticia no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const idStr = id.toString();
    const pendingMeta = await this.obtenerPendingMeta(idStr);
    await obtenerOCrearUsuarioLocal(user); // valida la identidad del administrador antes de decidir

    // Regla común (utils/flujoEditorial.utils.js): solo lo pendiente; aprobar aplica lo pedido; rechazar exige motivo.
    const revision = resolverRevision({
      estadoActual: noticiaExistente.estado,
      meta: pendingMeta,
      decision: decisionDesdeEstado(estado),
      motivo: rejectionReason,
      fechaProgramada: noticiaExistente.fechaPublicacion,
    });
    const nuevoEstado = revision.estado;
    const motivoGuardado = revision.motivo;
    const extraUpdateData = revision.limpiarFecha ? { fechaPublicacion: null } : {};

    if (revision.motivo) {
      await this.guardarMotivoRechazo(idStr, revision.motivo);
    } else {
      await this.limpiarMotivoRechazo(idStr);
    }
    if (revision.meta === null) {
      await this.limpiarPendingMeta(idStr);
    }

    const noticiaActualizada = await prisma.noticia.update({
      where: { id: idBigInt },
      data: {
        estado: nuevoEstado,
        updatedAt: new Date(),
        ...extraUpdateData,
      },
      include: {
        creador: true,
        editor: true,
        noticia_archivo: { include: { archivo: true } },
        categoria_noticia: true,
      },
    });

    // Aprobada la edición, las imágenes de la versión pública anterior que ya no se usan se borran.
    if (nuevoEstado !== "RECHAZADO" && pendingMeta?.snapshotPublico) {
      await eliminarArchivosReemplazados({
        anteriores: (pendingMeta.snapshotPublico.images || []).map((url) => refDesdeUrl(url)),
        vigentes: noticiaActualizada.noticia_archivo.map((na) => refDeArchivo(na.archivo)),
      });
    }

    await registrarAuditoria(user, {
      entidad: "noticia",
      id: idStr,
      accion: nuevoEstado === "RECHAZADO" ? ACCIONES.RECHAZAR : ACCIONES.APROBAR,
      descripcion:
        nuevoEstado === "RECHAZADO"
          ? `Noticia rechazada. Motivo: ${motivoGuardado}`
          : `Solicitud aprobada (estado resultante: ${nuevoEstado}).`,
    });

    const metaRestante = await this.obtenerPendingMeta(idStr);

    return {
      message: "Exito",
      noticia: formatearNoticia(noticiaActualizada, {
        imagenes: urlsDeImagenes(noticiaActualizada.noticia_archivo),
        categoria: nombreCategoriaVisible(noticiaActualizada.categoria_noticia?.nombre),
        requestedEstado: null,
        previousEstado: metaRestante?.previousEstado || null,
        visibleEnPortal: estaVisibleEnPortal(noticiaActualizada, metaRestante),
        rejectionReason: motivoGuardado,
      }),
    };
  }

  // Lo ejecuta el cron de server.js cada minuto. Los errores se propagan para que el cron los informe.
  async publicarNoticiasProgramadas() {
    const limite = limitePublicacionProgramada();
    // SQL directo a propósito: con @updatedAt, un updateMany de Prisma cambiaría también "updatedAt"
    // y las noticias programadas aparecerían como "Editado" al publicarse solas.
    await prisma.$executeRaw`
      UPDATE "noticia"
      SET "estado" = 'PUBLICADO'::"EstadoEditorial"
      WHERE "estado" = 'PROGRAMADO'::"EstadoEditorial"
        AND "fechaPublicacion" <= ${limite}
    `;
  }
}

export default new CmsNoticiaService();
