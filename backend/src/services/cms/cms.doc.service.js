import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";

import { generarNombreUnico } from "../../utils/file.utils.js";
import { obtenerOCrearUsuarioLocal } from "../../utils/user.utils.js";

const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

class CmsDocService {
  async obtenerDocumentos() {
    const documentos = await prisma.documento.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        archivo: true,
        categoria_documento: true
      }
    });

    return documentos.map(doc => {
      const pubUrl = doc.archivo 
        ? supabase.storage.from("documentos").getPublicUrl(doc.archivo.nombreArchivo).data.publicUrl 
        : "";

      let mappedStatus = "Borrador";
      if (doc.estado === "PUBLICADO") mappedStatus = "Publicado";
      if (doc.estado === "PROGRAMADO") mappedStatus = "Programado";

      return {
        id: doc.id.toString(), 
        title: doc.titulo,
        category: doc.categoria_documento?.nombre || "Información institucional",
        status: mappedStatus.toLowerCase(),
        editor: "Editor CMS",
        fileName: doc.archivo?.nombreOriginal || "",
        fileType: doc.archivo?.extension ? doc.archivo.extension.toUpperCase() : "PDF",
        fileSize: doc.archivo?.tamanioBytes ? `${(Number(doc.archivo.tamanioBytes) / (1024 * 1024)).toFixed(1)} MB` : "",
        fileUrl: pubUrl,
        updatedAt: new Date(doc.updatedAt || doc.createdAt).toLocaleDateString("es-AR")
      };
    });
  }

  async crearDocumento(data, archivoSubido, user) {
    const { titulo, categoria, estado } = data;

    if (!titulo || !archivoSubido) {
      const error = new Error("El título y el archivo son obligatorios.");
      error.statusCode = 400;
      throw error;
    }

    let estadoPrisma = "BORRADOR";
    if (estado?.toLowerCase() === "publicado") estadoPrisma = "PUBLICADO";
    if (estado?.toLowerCase() === "programado") estadoPrisma = "PROGRAMADO";

    let categoriaDb = await prisma.categoria_documento.findFirst({ where: { nombre: categoria } });
    if (!categoriaDb) {
      categoriaDb = await prisma.categoria_documento.create({
        data: { nombre: categoria || "Información institucional", descripcion: "Generada automáticamente", activo: true },
      });
    }

    const usuarioLocal = await obtenerOCrearUsuarioLocal(user);

    const { nombreUnico, extension } = generarNombreUnico(archivoSubido.originalname, 'doc');

    const { error: storageError } = await supabase.storage
      .from("documentos")
      .upload(nombreUnico, archivoSubido.buffer, { contentType: archivoSubido.mimetype, upsert: true });

    if (storageError) {
      const error = new Error("Error subiendo a Supabase: " + storageError.message);
      error.statusCode = 500;
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("documentos").getPublicUrl(nombreUnico);

    const archivoDb = await prisma.archivo.create({
      data: {
        nombreOriginal: archivoSubido.originalname,
        nombreArchivo: nombreUnico,
        ruta: `documentos/${nombreUnico}`,
        extension: extension,
        mimeType: archivoSubido.mimetype,
        tamanioBytes: BigInt(archivoSubido.size),
      },
    });

    const nuevoDocumento = await prisma.documento.create({
      data: {
        titulo,
        categoriaId: categoriaDb.id,
        archivoId: archivoDb.id,
        createdBy: usuarioLocal.id,
        estado: estadoPrisma,
        updatedAt: new Date(),
      }
    });

    return {
      message: "¡Documento subido y guardado con éxito!",
      documento: {
        id: nuevoDocumento.id.toString(),
        fileUrl: publicUrlData.publicUrl,
        fileSize: `${(archivoSubido.size / (1024 * 1024)).toFixed(1)} MB`
      }
    };
  }

  async actualizarDocumento(id, data, archivoSubido) {
    const { titulo, categoria, estado } = data;

    let estadoPrisma = "BORRADOR";
    if (estado?.toLowerCase() === "publicado") estadoPrisma = "PUBLICADO";
    if (estado?.toLowerCase() === "programado") estadoPrisma = "PROGRAMADO";

    const docExistente = await prisma.documento.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true }
    });

    if (!docExistente) {
      const error = new Error("Documento no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    let archivoId = docExistente.archivoId;
    let oldArchivoId = null;
    let categoriaId = docExistente.categoriaId;

    if (categoria) {
      let categoriaDb = await prisma.categoria_documento.findFirst({ where: { nombre: categoria } });
      if (!categoriaDb) {
        categoriaDb = await prisma.categoria_documento.create({
          data: { nombre: categoria, descripcion: "Generada automáticamente", activo: true },
        });
      }
      categoriaId = categoriaDb.id;
    }

    if (archivoSubido) {
      if (docExistente.archivo) {
        await supabase.storage.from("documentos").remove([docExistente.archivo.nombreArchivo]);
        oldArchivoId = docExistente.archivoId; 
      }

      const { nombreUnico, extension } = generarNombreUnico(archivoSubido.originalname, 'doc');

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(nombreUnico, archivoSubido.buffer, { contentType: archivoSubido.mimetype, upsert: true });

      if (storageError) {
        const error = new Error("Error subiendo archivo nuevo: " + storageError.message);
        error.statusCode = 500;
        throw error;
      }

      const nuevoArchivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: archivoSubido.originalname,
          nombreArchivo: nombreUnico,
          ruta: `documentos/${nombreUnico}`,
          extension: extension,
          mimeType: archivoSubido.mimetype,
          tamanioBytes: BigInt(archivoSubido.size),
        },
      });
      archivoId = nuevoArchivoDb.id;
    }

    const documentoActualizado = await prisma.documento.update({
      where: { id: BigInt(id) },
      data: {
        titulo: titulo || docExistente.titulo,
        categoriaId: categoriaId,
        estado: estadoPrisma,
        archivoId: archivoId,
        updatedAt: new Date(),
      },
      include: { archivo: true }
    });

    if (oldArchivoId) {
      await prisma.archivo.delete({ where: { id: oldArchivoId } });
    }

    return {
      message: "¡Documento actualizado con éxito!",
      documento: {
        id: documentoActualizado.id.toString(),
        title: documentoActualizado.titulo,
        status: documentoActualizado.estado.toLowerCase(),
        fileSize: documentoActualizado.archivo?.tamanioBytes ? `${(Number(documentoActualizado.archivo.tamanioBytes) / (1024 * 1024)).toFixed(1)} MB` : ""
      }
    };
  }

  async eliminarDocumento(id) {
    const doc = await prisma.documento.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true }
    });
    
    if (doc) {
      if (doc.archivo) {
        await supabase.storage.from("documentos").remove([doc.archivo.nombreArchivo]);
      }
      
      await prisma.documento.delete({ where: { id: BigInt(id) } });
      
      if (doc.archivoId) {
        await prisma.archivo.delete({ where: { id: doc.archivoId } });
      }
    } else {
      const error = new Error("Documento no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    return { message: "Documento eliminado con éxito" };
  }
}

export default new CmsDocService();