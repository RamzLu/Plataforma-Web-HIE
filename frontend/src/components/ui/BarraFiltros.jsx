import "../../styles/ui/BarraFiltros.css";

// Buscador y filtro por clasificación con el mismo aspecto que en el panel del Admin, para todos los listados del CMS.
// Cada módulo decide si ofrece el filtro por clasificación (`select`) además del buscador.

/**
 * @param busqueda { etiqueta, placeholder, valor, onCambio }
 * @param select   { etiqueta, valor, onCambio, opciones: [{ valor, texto }] } (opcional)
 * @param crear    { texto, onClick } botón para crear contenido, al final de la fila (opcional)
 */
const BarraFiltros = ({ busqueda, select, crear }) => (
  <div className="barra-filtros">
    <label className="barra-filtros-busqueda">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span className="barra-filtros-oculto">{busqueda.etiqueta}</span>
      <input
        type="search"
        placeholder={busqueda.placeholder}
        value={busqueda.valor}
        onChange={(e) => busqueda.onCambio(e.target.value)}
      />
    </label>
    {select && (
      <label className="barra-filtros-select">
        <span>{select.etiqueta}</span>
        <select value={select.valor} onChange={(e) => select.onCambio(e.target.value)}>
          {select.opciones.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.texto}
            </option>
          ))}
        </select>
      </label>
    )}
    {crear && (
      <button type="button" className="filtro-crear" onClick={crear.onClick}>
        {crear.texto}
      </button>
    )}
  </div>
);

export default BarraFiltros;
