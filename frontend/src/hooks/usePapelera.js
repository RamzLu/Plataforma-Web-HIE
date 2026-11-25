import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { mensajeDeError } from "../utils/mensajeDeError";

/**
 * Acciones de la Papelera de un módulo del CMS: mandar a la Papelera y restaurar.
 * `recargar` vuelve a pedir la lista del módulo.
 */
export const usePapelera = ({ descartar, restaurar, recargar }) => {
  const [ocupado, setOcupado] = useState(false);

  const ejecutar = useCallback(
    async (accion, errorPorDefecto) => {
      setOcupado(true);
      try {
        const respuesta = await accion();
        toast.success(respuesta?.message || "Listo.");
        await recargar();
      } catch (error) {
        toast.error(mensajeDeError(error, errorPorDefecto));
      } finally {
        setOcupado(false);
      }
    },
    [recargar]
  );

  return {
    ocupado,
    descartarItem: (item) => ejecutar(() => descartar(item), "No se pudo mandar a la Papelera."),
    restaurarItem: (item) => ejecutar(() => restaurar(item), "No se pudo restaurar."),
  };
};
