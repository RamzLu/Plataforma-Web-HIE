import { prisma } from '../config/prisma.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ipwupwmbygtyiluezzle.supabase.co', 
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
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

    let categoria = await prisma.categoria_noticia.findFirst({ where: { nombre: 'Noticias' } });
    if (!categoria) {
      categoria = await prisma.categoria_noticia.create({ data: { nombre: 'Noticias', descripcion: 'Por defecto' } });
    }

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

    for (const file of archivosSubidos) {
      const nombreUnico = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('noticias-imagenes')
        .upload(nombreUnico, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (storageError) {
        console.error(" Error subiendo al bucket de Supabase:", storageError.message);
      }

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

      await prisma.noticia_archivo.create({
        data: {
          noticiaId: nuevaNoticia.id,
          archivoId: archivoDb.id
        }
      });

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

export const eliminarNoticia = async (req, res) => {
  try {
    const { id } = req.params;

    const noticia = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: {
        noticia_archivo: {
          include: { archivo: true }
        }
      }
    });

    if (!noticia) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    for (const na of noticia.noticia_archivo) {
      const archivo = na.archivo;
      
      await supabase.storage
        .from('noticias-imagenes')
        .remove([archivo.nombreArchivo]);

      await prisma.noticia_archivo.deleteMany({
        where: { archivoId: archivo.id }
      });
      
      await prisma.archivo.delete({
        where: { id: archivo.id }
      });
    }

    await prisma.noticia.delete({
      where: { id: BigInt(id) }
    });

    return res.status(200).json({ message: '¡Noticia y archivos eliminados de la base de datos y de Supabase con éxito!' });

  } catch (error) {
    console.error('Error al eliminar la noticia:', error);
    return res.status(500).json({ error: 'Error al eliminar: ' + error.message });
  }
};
export const actualizarNoticia = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, contenido, imagenesExistentes } = req.body;
    const archivosSubidos = req.files || [];

    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: {
        noticia_archivo: { include: { archivo: true } }
      }
    });

    if (!noticiaExistente) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }

    // 1. Actualizamos texto y título
    const noticiaActualizada = await prisma.noticia.update({
      where: { id: BigInt(id) },
      data: {
        titulo: titulo || noticiaExistente.titulo,
        contenido: contenido || noticiaExistente.contenido,
        updatedAt: new Date()
      }
    });

    // 2. Sincronizamos las imágenes existentes que el usuario decidió conservar
    const urlsConservadas = imagenesExistentes ? JSON.parse(imagenesExistentes) : [];

    for (const na of noticiaExistente.noticia_archivo) {
      const archivo = na.archivo;
      const { data } = supabase.storage.from('noticias-imagenes').getPublicUrl(archivo.nombreArchivo);
      
      // Si la imagen vieja ya no está en la lista que conservó el usuario, la borramos
      if (!urlsConservadas.includes(data.publicUrl)) {
        await supabase.storage.from('noticias-imagenes').remove([archivo.nombreArchivo]);
        await prisma.noticia_archivo.deleteMany({ where: { archivoId: archivo.id } });
        await prisma.archivo.delete({ where: { id: archivo.id } });
      }
    }

    // 3. Si se subieron archivos nuevos, los agregamos
    for (const file of archivosSubidos) {
      const nombreUnico = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      
      await supabase.storage.from('noticias-imagenes').upload(nombreUnico, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

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

      await prisma.noticia_archivo.create({
        data: {
          noticiaId: noticiaActualizada.id,
          archivoId: archivoDb.id
        }
      });
    }

    // 4. Devolvemos la lista final limpia
    const noticiaConArchivos = await prisma.noticia.findUnique({
      where: { id: BigInt(id) },
      include: { noticia_archivo: { include: { archivo: true } } }
    });

    const imgs = noticiaConArchivos.noticia_archivo.map(na => {
      const { data } = supabase.storage.from('noticias-imagenes').getPublicUrl(na.archivo.nombreArchivo);
      return data.publicUrl;
    });

    return res.status(200).json({
      message: '¡Noticia y galería actualizadas correctamente!',
      noticia: {
        ...noticiaActualizada,
        id: noticiaActualizada.id.toString(),
        categoriaId: noticiaActualizada.categoriaId.toString(),
        images: imgs
      }
    });

  } catch (error) {
    console.error('Error al actualizar la noticia:', error);
    return res.status(500).json({ error: 'Error al actualizar: ' + error.message });
  }
};