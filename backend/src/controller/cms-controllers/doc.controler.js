import { prisma } from "../../config/prisma.js";
import { createClient } from "@supabase/supabase-js";

// Conexión a Supabase
const supabase = createClient(
  "https://ipwupwmbygtyiluezzle.supabase.co",
  process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
);

// ==========================================
// 1. OBTENER DOCUMENTOS
// ==========================================
export const obtenerDocumentos = async (req, res) => {
  try {
    const documentos = await prisma.documento.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        archivo: true, 
        categoria_documento: true 
      }
    });

    const docsFormateados = documentos.map(doc => {
      const pubUrl = doc.archivo 
        ? supabase.storage.from("documentos").getPublicUrl(doc.archivo.nombreArchivo).data.publicUrl 
        : "";

      // Mapeo defensivo de los estados
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

    return res.status(200).json(docsFormateados);
  } catch (error) {
    console.error("Error crítico al obtener documentos:", error);
    return res.status(500).json({ error: "Error interno del servidor: " + error.message });
  }
};

// ==========================================
// 2. CREAR DOCUMENTO
// ==========================================
export const crearDocumento = async (req, res) => {
  try {
    const { titulo, categoria, estado } = req.body;
    const archivoSubido = req.file;

    const keycloakSub = req.user?.keycloakId;
    const username = req.user?.username || `user_${Date.now()}`;
    const name = req.user?.name || "Editor CMS";

    if (!titulo || !archivoSubido) {
      return res.status(400).json({ error: "El título y el archivo son obligatorios." });
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

    let usuarioLocal = await prisma.usuario.findFirst({
      where: { OR: [{ keycloakId: keycloakSub }, { username: username }] },
    });

    if (!usuarioLocal) {
      let rolAdmin = await prisma.rol.findFirst({ where: { nombre: "ADMIN" } });
      usuarioLocal = await prisma.usuario.create({
        data: {
          id: keycloakSub,
          keycloakId: keycloakSub,
          username: username,
          email: `${username}@hospital.com`,
          nombre: name,
          apellido: "Sistema",
          rolId: rolAdmin?.id,
          updatedAt: new Date(),
        },
      });
    }

    const extension = archivoSubido.originalname.split(".").pop().toLowerCase();
    const nombreUnico = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

    const { error: storageError } = await supabase.storage
      .from("documentos")
      .upload(nombreUnico, archivoSubido.buffer, { contentType: archivoSubido.mimetype, upsert: true });

    if (storageError) {
      return res.status(500).json({ error: "Error subiendo a Supabase: " + storageError.message });
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

    return res.status(201).json({
      message: "¡Documento subido y guardado con éxito!",
      documento: {
        id: nuevoDocumento.id.toString(),
        fileUrl: publicUrlData.publicUrl,
        fileSize: `${(archivoSubido.size / (1024 * 1024)).toFixed(1)} MB`
      }
    });

  } catch (error) {
    console.error("Error al crear documento:", error);
    return res.status(500).json({ error: "Error interno: " + error.message });
  }
};

// ==========================================
// 3. ACTUALIZAR DOCUMENTO
// ==========================================
export const actualizarDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, categoria, estado } = req.body;
    const archivoSubido = req.file;

    let estadoPrisma = "BORRADOR";
    if (estado?.toLowerCase() === "publicado") estadoPrisma = "PUBLICADO";
    if (estado?.toLowerCase() === "programado") estadoPrisma = "PROGRAMADO";

    const docExistente = await prisma.documento.findUnique({
      where: { id: BigInt(id) },
      include: { archivo: true }
    });

    if (!docExistente) {
      return res.status(404).json({ error: "Documento no encontrado." });
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

      const extension = archivoSubido.originalname.split(".").pop().toLowerCase();
      const nombreUnico = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(nombreUnico, archivoSubido.buffer, { contentType: archivoSubido.mimetype, upsert: true });

      if (storageError) {
        return res.status(500).json({ error: "Error subiendo archivo nuevo: " + storageError.message });
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

    let statusResponse = documentoActualizado.estado.toLowerCase();
    
    return res.status(200).json({
      message: "¡Documento actualizado con éxito!",
      documento: {
        id: documentoActualizado.id.toString(),
        title: documentoActualizado.titulo,
        status: statusResponse,
        fileSize: documentoActualizado.archivo?.tamanioBytes ? `${(Number(documentoActualizado.archivo.tamanioBytes) / (1024 * 1024)).toFixed(1)} MB` : ""
      }
    });
  } catch (error) {
    console.error("Error al actualizar documento:", error);
    return res.status(500).json({ error: "Error al actualizar: " + error.message });
  }
};

// ==========================================
// 4. ELIMINAR DOCUMENTO
// ==========================================
export const eliminarDocumento = async (req, res) => {
  try {
    const { id } = req.params;
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
    }
    return res.status(200).json({ message: "Documento eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    return res.status(500).json({ error: "Error al eliminar: " + error.message });
  }
};