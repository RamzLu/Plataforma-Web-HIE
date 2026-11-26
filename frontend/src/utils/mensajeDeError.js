/**
 * Devuelve un texto apto para mostrar al usuario a partir de un error de axios.
 *
 * El backend responde { success: false, error: { code, message } } (ver error.middleware.js),
 * pero algunas respuestas viejas traen { error: "texto" } o { message: "texto" }.
 * Pasar el objeto "error" directo a toast.error() rompe el render, por eso se usa siempre esta función.
 */
export const mensajeDeError = (error, porDefecto = "Ocurrió un error. Intentá nuevamente.") => {
  const data = error?.response?.data;
  const candidatos = [data?.error?.message, data?.error, data?.message];
  const texto = candidatos.find((c) => typeof c === "string" && c.trim());
  return texto || porDefecto;
};

export default mensajeDeError;
