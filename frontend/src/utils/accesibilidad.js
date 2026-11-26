/**
 * Para elementos clickeables que no son <button> (tarjetas, miniaturas, zonas de carga):
 * ejecuta la misma acción con Enter o Espacio, como haría un botón.
 * Uso: <div role="button" tabIndex={0} onClick={abrir} onKeyDown={(e) => activarConTeclado(e, abrir)}>
 */
export const activarConTeclado = (evento, accion) => {
  if (evento.key === "Enter" || evento.key === " ") {
    evento.preventDefault();
    accion?.(evento);
  }
};
