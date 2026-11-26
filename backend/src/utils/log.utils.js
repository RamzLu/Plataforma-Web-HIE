// Registro de fallas que no deben cortar la operación principal (por ejemplo, la auditoría),
// pero que tampoco tienen que pasar en silencio.
export const registrarFalla = (contexto, error) => {
  console.error(`[${contexto}] ${error?.message || error}`);
};
