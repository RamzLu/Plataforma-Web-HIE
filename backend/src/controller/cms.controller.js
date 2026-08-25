import { prisma } from '../config/prisma.js';

export const crearNoticia = async (req, res) => {
  try {
    const { titulo, contenido } = req.body;
    
    // Extraemos los datos de tu sesión de Keycloak
    const keycloakSub = req.user.keycloakId;
    const username = req.user.username || `user_${Date.now()}`;
    const name = req.user.name || 'Editor CMS';

    if (!titulo || !contenido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: titulo y contenido.' });
    }

    // 1. AUTO-CREAR CATEGORÍA SI NO EXISTE EN SUPABASE
    let categoria = await prisma.categoria_noticia.findFirst({
      where: { nombre: 'Noticias' }
    });
    
    if (!categoria) {
      categoria = await prisma.categoria_noticia.create({
        data: { nombre: 'Noticias', descripcion: 'Categoría por defecto' }
      });
    }

    // 2. AUTO-CREAR ROL Y TU USUARIO SI NO EXISTEN EN SUPABASE
    let usuarioLocal = await prisma.usuario.findUnique({
      where: { keycloakId: keycloakSub }
    });

    if (!usuarioLocal) {
      let rolAdmin = await prisma.rol.findFirst({ where: { nombre: 'ADMIN' }});
      if (!rolAdmin) {
        rolAdmin = await prisma.rol.create({ data: { nombre: 'ADMIN', descripcion: 'Administrador' } });
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

    // 3. AHORA SÍ, CREAR LA NOTICIA EN LA NUBE
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

    // Convertimos los IDs (BigInt) a texto para que React los pueda leer sin errores
    const noticiaResponse = {
      ...nuevaNoticia,
      id: nuevaNoticia.id.toString(),
      categoriaId: nuevaNoticia.categoriaId.toString()
    };

    return res.status(201).json({
      message: '¡Noticia creada y persistida con éxito en Supabase!',
      noticia: noticiaResponse
    });

  } catch (error) {
    console.error('Error al crear la noticia:', error);
    return res.status(500).json({ error: 'Error interno: ' + error.message });
  }
};
// Agrega esto al final de tu cms.controller.js
export const obtenerNoticias = async (req, res) => {
  try {
    // Buscamos todas las noticias en Supabase, ordenadas por la más reciente
    const noticias = await prisma.noticia.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Convertimos los IDs (BigInt) a texto para evitar errores de JSON
    const noticiasFormateadas = noticias.map(noticia => ({
      ...noticia,
      id: noticia.id.toString(),
      categoriaId: noticia.categoriaId.toString()
    }));

    return res.status(200).json(noticiasFormateadas);
  } catch (error) {
    console.error('Error al obtener las noticias:', error);
    return res.status(500).json({ error: 'Error al cargar las noticias.' });
  }
};