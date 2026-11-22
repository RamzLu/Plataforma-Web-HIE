import { prisma } from "../../config/prisma.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";
import { ESPACIOS_FIJOS_DEFINICIONES, ESPACIOS_MAP, ALIASES_ESPACIOS } from "./contenidoGrafico/definiciones.js";
import { crearError } from "./contenidoGrafico/texto.js";
import { formatearEspacioDesdeFilas } from "./contenidoGrafico/formato.js";
import { actualizarSeccionAprende } from "./contenidoGrafico/flujos/aprende.js";
import { actualizarAcordeonFijo } from "./contenidoGrafico/flujos/acordeon.js";
import { actualizarTarjetaResidencias } from "./contenidoGrafico/flujos/residencias.js";
import { actualizarCarrusel } from "./contenidoGrafico/flujos/carrusel.js";

export { RUTAS_INTERNAS_PERMITIDAS, ESPACIOS_FIJOS_DEFINICIONES } from "./contenidoGrafico/definiciones.js";

class CmsContenidoGraficoService {
  /**
   * Lista todos los espacios gráficos fijos del portal junto con sus imágenes y textos actuales.
   */
  async obtenerEspaciosGraficos(esVistaAdmin = false) {
    const ubicacionesClaves = [
      ...ESPACIOS_FIJOS_DEFINICIONES.map((d) => d.ubicacionClave),
      ...Object.keys(ALIASES_ESPACIOS),
    ];

    const filas = await prisma.contenido_grafico.findMany({
      where: {
        ubicacion_contenido_grafico: {
          nombre: { in: ubicacionesClaves },
        },
        ...(esVistaAdmin
          ? {}
          : {
              activo: true,
              estado: { in: ["PUBLICADO", "APROBADO"] },
            }),
      },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: {
        archivo: true,
        ubicacion_contenido_grafico: true,
      },
    });

    const filasPorEspacio = new Map();
    for (const fila of filas) {
      const clave = fila.ubicacion_contenido_grafico?.nombre;
      if (!clave) continue;
      const claveCanonica = ALIASES_ESPACIOS[clave] || clave;
      if (!filasPorEspacio.has(claveCanonica)) {
        filasPorEspacio.set(claveCanonica, []);
      }
      filasPorEspacio.get(claveCanonica).push(fila);
    }

    return ESPACIOS_FIJOS_DEFINICIONES.map((def) =>
      formatearEspacioDesdeFilas(
        def,
        filasPorEspacio.get(def.ubicacionClave) || [],
      ),
    );
  }

  /**
   * Obtiene la configuración pública vigente de un espacio gráfico fijo puntual.
   */
  async obtenerEspacioPublico(espacioKey) {
    const claveLimpia = String(espacioKey || "").trim();
    const claveCanonica = ALIASES_ESPACIOS[claveLimpia] || claveLimpia;
    const def =
      ESPACIOS_MAP.get(claveCanonica) || ESPACIOS_MAP.get(claveLimpia);
    if (!def) {
      throw crearError("El espacio gráfico solicitado no existe.", 404);
    }

    const nombresBusqueda = [def.ubicacionClave];
    Object.entries(ALIASES_ESPACIOS).forEach(([alias, target]) => {
      if (target === def.id || target === def.ubicacionClave) {
        nombresBusqueda.push(alias);
      }
    });

    const filas = await prisma.contenido_grafico.findMany({
      where: {
        ubicacion_contenido_grafico: {
          nombre: { in: nombresBusqueda },
        },
        activo: true,
        estado: { in: ["PUBLICADO", "APROBADO"] },
      },
      orderBy: [{ orden: "asc" }, { id: "asc" }],
      include: {
        archivo: true,
      },
    });

    return formatearEspacioDesdeFilas(def, filas);
  }

  /**
   * Actualiza un espacio gráfico fijo existente.
   */
  async actualizarEspacioGrafico(espacioKey, body, files, user) {
    const claveLimpia = String(espacioKey || "").trim();
    const claveCanonica = ALIASES_ESPACIOS[claveLimpia] || claveLimpia;
    const def =
      ESPACIOS_MAP.get(claveCanonica) || ESPACIOS_MAP.get(claveLimpia);
    if (!def) {
      throw crearError(
        "El espacio gráfico no existe. No está permitido crear nuevas secciones.",
        404,
      );
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
    const uploadedFiles = Array.isArray(files) ? files : files ? [files] : [];

    // Asegurar registros de catálogo tipo y ubicación
    const tipoDb = await prisma.tipo_contenido_grafico.upsert({
      where: { nombre: def.tipo },
      update: { activo: true },
      create: {
        nombre: def.tipo,
        descripcion: `Bloque de tipo ${def.tipo}`,
        activo: true,
      },
    });

    const ubicacionDb = await prisma.ubicacion_contenido_grafico.upsert({
      where: { nombre: def.ubicacionClave },
      update: { descripcion: def.nombre, activo: true },
      create: {
        nombre: def.ubicacionClave,
        descripcion: def.nombre,
        activo: true,
      },
    });

    const filasExistentes = await prisma.contenido_grafico.findMany({
      where: { ubicacionId: ubicacionDb.id },
      include: { archivo: true },
    });

    const filasPorId = new Map(
      filasExistentes.map((f) => [f.id.toString(), f]),
    );

    const contexto = { def, body, files, user, usuarioLocal, uploadedFiles, tipoDb, ubicacionDb, filasExistentes, filasPorId };

    // Cada tipo de espacio tiene su propio flujo (contenidoGrafico/flujos/).
    if (def.esSeccionAprende) return actualizarSeccionAprende(contexto);
    if (def.esAcordeonFijo) return actualizarAcordeonFijo(contexto);
    if (def.esTarjetaResidencias) return actualizarTarjetaResidencias(contexto);
    return actualizarCarrusel(contexto);
  }
}

export default new CmsContenidoGraficoService();
