import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, CalendarClock, CheckCircle, Clock3, Globe2, Pencil, RefreshCw, XCircle } from "lucide-react";
import { AccionesTituloContext } from "./AccionesTitulo";
import "../../styles/ui/FiltrosEstado.css";

// Los mismos filtros por estado en el panel del CMS y en el del Admin: tarjeta con ícono, nombre y cantidad.
// Cada tipo tiene siempre el mismo nombre, ícono y color; el módulo solo elige cuáles ofrece.
const TIPOS = {
  pendiente: { etiqueta: "Pendientes de aprobación", Icono: Clock3 },
  aprobado: { etiqueta: "Aprobados", Icono: CheckCircle },
  publicado: { etiqueta: "Visibles al público", Icono: Globe2 },
  programado: { etiqueta: "Programados", Icono: CalendarClock },
  rechazado: { etiqueta: "Rechazados", Icono: XCircle },
  archivado: { etiqueta: "Archivados", Icono: Archive },
  borrador: { etiqueta: "Borradores", Icono: Pencil },
};

/**
 * @param opciones  [{ clave, tipo, cuenta, etiqueta? }] — `tipo` define nombre, ícono y color.
 * @param activa    clave de la opción seleccionada
 * @param onCambiar recibe la clave elegida
 * @param todos     agrega el botón "Todos" (clave "TODOS"), que quita el filtro por estado
 * @param onActualizar  agrega el botón "Actualizar"; gira mientras la función (que puede devolver una promesa) trabaja
 * @param actualizando  fuerza el giro cuando la carga la maneja el módulo
 * @param crear     { texto, onClick } agrega el botón para crear contenido, con el mismo aspecto en todos los módulos
 */
const FiltrosEstado = ({
  opciones,
  activa,
  onCambiar,
  etiqueta = "Filtrar por estado",
  todos = false,
  onActualizar,
  actualizando = false,
  crear,
}) => {
  const [cargando, setCargando] = useState(false);
  const destinoActualizar = useContext(AccionesTituloContext);
  const girando = cargando || actualizando;

  const actualizar = async () => {
    setCargando(true);
    try {
      await onActualizar();
    } finally {
      setCargando(false);
    }
  };

  const botonActualizar = onActualizar && (
    <button type="button" className="filtro-actualizar" onClick={actualizar} disabled={girando}>
      <RefreshCw size={15} className={girando ? "filtro-girando" : ""} aria-hidden="true" />
      Actualizar
    </button>
  );

  return (
    <div className="filtros-estado-contenedor">
      {botonActualizar && destinoActualizar && createPortal(botonActualizar, destinoActualizar)}

      {(todos || (botonActualizar && !destinoActualizar)) && (
        <div className="filtros-estado-barra is-superior">
          {!destinoActualizar && botonActualizar}
          {todos && (
            <button
              type="button"
              className={`filtro-todos${activa === "TODOS" ? " is-active" : ""}`}
              aria-pressed={activa === "TODOS"}
              onClick={() => onCambiar("TODOS")}
            >
              Todos
            </button>
          )}
        </div>
      )}

      <section className="filtros-estado" aria-label={etiqueta} style={{ "--columnas": opciones.length }}>
        {opciones.map(({ clave, tipo, cuenta, etiqueta: nombre }) => {
          const { etiqueta: nombreBase, Icono } = TIPOS[tipo] || TIPOS.pendiente;
          const seleccionada = activa === clave;
          return (
            <button
              key={clave}
              type="button"
              className={`filtro-estado is-${tipo}${seleccionada ? " is-selected" : ""}`}
              aria-pressed={seleccionada}
              onClick={() => onCambiar(clave)}
            >
              <span className="filtro-estado-icono">
                <Icono size={19} aria-hidden="true" />
              </span>
              <div className="filtro-estado-texto">
                <small>{nombre || nombreBase}</small>
                <strong>{cuenta}</strong>
              </div>
            </button>
          );
        })}
      </section>

      {crear && (
        <div className="filtros-estado-barra">
          <button type="button" className="filtro-crear" onClick={crear.onClick}>
            {crear.texto}
          </button>
        </div>
      )}
    </div>
  );
};

export default FiltrosEstado;
