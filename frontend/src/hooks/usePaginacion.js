import { useState } from "react";

/**
 * Paginación en el navegador para listados ya filtrados.
 *
 * - items: el arreglo completo (ya filtrado) que se quiere paginar.
 * - porPagina: cuántos elementos mostrar por página.
 * - reinicio: valores de los filtros (búsqueda, pestaña, tipo...). Cuando alguno cambia,
 *   se vuelve a la página 1 para que el usuario no quede en una página vacía.
 */
export const usePaginacion = (items = [], porPagina = 10, reinicio = []) => {
  const clave = JSON.stringify(reinicio);
  const [estado, setEstado] = useState({ pagina: 1, clave });

  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaPedida = estado.clave === clave ? estado.pagina : 1;
  // Si se borran elementos y la página actual deja de existir, se muestra la última que queda.
  const pagina = Math.min(Math.max(1, paginaPedida), totalPaginas);

  const desde = (pagina - 1) * porPagina;
  const hasta = Math.min(desde + porPagina, total);

  const irAPagina = (nueva) => {
    const destino = typeof nueva === "function" ? nueva(pagina) : nueva;
    setEstado({ pagina: Math.min(Math.max(1, destino), totalPaginas), clave });
  };

  return {
    itemsPagina: items.slice(desde, hasta),
    pagina,
    totalPaginas,
    total,
    desde,
    hasta,
    irAPagina,
  };
};

export default usePaginacion;
