import { registrarFalla } from "./log.utils.js";
import { nombreDeUsuario, obtenerOCrearUsuarioLocal } from "./user.utils.js";

/**
 * Nombre con el que se muestra al editor de un cambio.
 * Prioridad: el nombre que mandó el formulario (si no es el genérico), el usuario local de la base y,
 * por último, los datos del token de Keycloak. Sin ninguno, "Editor CMS".
 */
export const resolverNombreEditor = async (user, payloadEditor = null) => {
  if (
    payloadEditor &&
    typeof payloadEditor === "string" &&
    payloadEditor.trim() &&
    payloadEditor !== "Editor CMS"
  ) {
    return payloadEditor.trim();
  }
  if (user) {
    try {
      const usuarioLocal = await obtenerOCrearUsuarioLocal(user);
      if (usuarioLocal?.nombre) {
        return nombreDeUsuario(usuarioLocal);
      }
    } catch (error) {
      registrarFalla("Usuario local", error);
    }
    if (user.name && user.name.trim()) return user.name.trim();
    if (user.preferred_username && user.preferred_username.trim()) return user.preferred_username.trim();
    if (user.username && user.username.trim()) return user.username.trim();
  }
  return "Editor CMS";
};

/**
 * Quién y cuándo editó un registro, para mostrarlo en el panel. Se toma, en este orden:
 * el editor del cambio pendiente, el editor guardado, el usuario de la última acción de auditoría y,
 * si solo hay datos genéricos ("Editor CMS"), esos. Sin ningún dato: "Editor CMS" sin fecha.
 * @returns {{ editor: string, updatedAt: string|Date|null }}
 */
export const resolverEditorVisible = ({ pendingMeta = null, editorMeta = null, auditoria = null } = {}) => {
  if (pendingMeta?.editor && pendingMeta.editor !== "Editor CMS") {
    return { editor: pendingMeta.editor, updatedAt: pendingMeta.updatedAt || null };
  }
  if (editorMeta?.editor && editorMeta.editor !== "Editor CMS") {
    return { editor: editorMeta.editor, updatedAt: editorMeta.updatedAt || null };
  }
  if (auditoria?.usuario) {
    return { editor: nombreDeUsuario(auditoria.usuario), updatedAt: auditoria.fechaHora };
  }
  if (pendingMeta?.editor) {
    return { editor: pendingMeta.editor, updatedAt: pendingMeta.updatedAt || null };
  }
  if (editorMeta?.editor) {
    return { editor: editorMeta.editor, updatedAt: editorMeta.updatedAt || null };
  }
  // Sin registro de quién lo editó: no se le atribuye a ningún usuario en particular.
  return { editor: "Editor CMS", updatedAt: null };
};
