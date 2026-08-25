import { prisma } from '../config/prisma.js';
import { createClient } from '@supabase/supabase-js';

// Conexión oficial a Supabase Storage (asegúrate de tener tu SUPABASE_URL y ANON_KEY o usa credenciales directas)
const supabase = createClient(
  'https://ipwupwmbygtyiluezzle.supabase.co', 
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // O tu clave anónima del proyecto
);

export const crearNoticia = async (req, res) => {
  try {
    const { titulo, contenido } = req.body;
    const archivosSubidos = req.files || [];
    
    const keycloakSub = req.user.keycloakId;
    const username = req.user.username || `user_${Date.now()}`;
    const name = req.user.name || 'Editor CMS';

    if (!titulo || !contenido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: titulo y contenido.' });
    }

    // 1. Categoría por defecto
    let categoria = await prisma.categoria_noticia.findFirst({ where: { nombre: 'Noticias' } });
    if (!categoria) {
      categoria = await prisma.categoria_noticia.create({ data: { nombre: 'Noticias', descripcion: 'Por defecto' } });
    }

    // 2. Usuario por defecto
    let usuarioLocal = await prisma.usuario.findUnique({ where: { keycloakId: keycloakSub } });
    if (!usuarioLocal) {
      let rolAdmin = await prisma.rol.findFirst({ where: { nombre: 'ADMIN' }});
      if (!rolAdmin) {
        rolAdmin = await prisma.rol.create({ data: { nombre: 'ADMIN', descripcion: 'Admin' } });
      }
      usuarioLocal = await prisma.usuario.create({
        data: {
          id: keycloakSub, 
          keycloakId: keycloakSub,
          username: username,
          email: `${username}@hospital.com`, 
          nombre: name,
          apellido: 'Sistema',
          rolId: rolAdmin.id,
          updatedAt: new Date()
        }
      });
    }

    // 3. Crear Noticia
    const nuevaNoticia = await prisma.noticia.create({
      data: {
        titulo,
        contenido,
        categoriaId: categoria.id,
        createdBy: usuarioLocal.id,
        estado: 'PUBLICADO',
        updatedAt: new Date()
      }
    });

    const imagenesUrlsGuardadas = [];

    // 4. SUBIDA REAL AL BUCKET DE SUPABASE Y RESPALDO EN BD
    for (const file of archivosSubidos) {
      const nombreUnico = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      
      // Subimos el archivo físicamente al Bucket 'noticias-imagenes'
      const { data: storageData, error: storageError } = await supabase.storage
        .from('noticias-imagenes')
        .upload(nombreUnico, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (storageError) {
        console.error("⚠️ Error subiendo al bucket de Supabase:", storageError.message);
      }

      // Guardamos metadatos en la tabla 'archivo'
      const archivoDb = await prisma.archivo.create({
        data: {
          nombreOriginal: file.originalname,
          nombreArchivo: nombreUnico,
          ruta: `noticias-imagenes/${nombreUnico}`,
          extension: file.originalname.split('.').pop(),
          mimeType: file.mimetype,
          tamanioBytes: BigInt(file.size)
        }
      });

      // Vinculamos en la tabla intermedia 'noticia_archivo'
      await prisma.noticia_archivo.create({
        data: {
          noticiaId: nuevaNoticia.id,
          archivoId: archivoDb.id
        }
      });

      // Obtenemos la URL pública oficial desde Supabase
      const { data: publicUrlData } = supabase.storage
        .from('noticias-imagenes')
        .getPublicUrl(nombreUnico);

      imagenesUrlsGuardadas.push(publicUrlData.publicUrl);
    }

    const noticiaResponse = {
      ...nuevaNoticia,
      id: nuevaNoticia.id.toString(),
      categoriaId: nuevaNoticia.categoriaId.toString(),
      images: imagenesUrlsGuardadas
    };

    return res.status(201).json({
      message: '¡Noticia y archivos subidos al Bucket y respaldados en la BD!',
      noticia: noticiaResponse
    });

  } catch (error) {
    console.error('Error al crear la noticia con archivos:', error);
    return res.status(500).json({ error: 'Error interno: ' + error.message });
  }
};

export const obtenerNoticias = async (req, res) => {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        noticia_archivo: {
          include: {
            archivo: true
          }
        }
      }
    });

    const noticiasFormateadas = noticias.map(noticia => {
      const imgs = noticia.noticia_archivo.map(na => {
        const { data } = supabase.storage
          .from('noticias-imagenes')
          .getPublicUrl(na.archivo.nombreArchivo);
        return data.publicUrl;
      });

      return {
        id: noticia.id.toString(),
        title: noticia.titulo,
        body: [noticia.contenido],
        date: new Date(noticia.createdAt).toLocaleDateString("es-AR"),
        category: "Noticias",
        isDraft: noticia.estado !== "PUBLICADO",
        images: imgs
      };
    });

    return res.status(200).json(noticiasFormateadas);
  } catch (error) {
    console.error('Error al obtener las noticias:', error);
    return res.status(500).json({ error: 'Error al cargar las noticias.' });
  }
};