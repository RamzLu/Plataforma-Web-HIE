import "../../styles/ui/BarraFiltros.css";

// Buscador y filtro por clasificación iguales en todos los listados del panel del CMS.
// Cada módulo decide si ofrece el filtro por clasificación (`select`) además del buscador.

/**
 * @param busqueda { etiqueta, placeholder, valor, onCambio }
 * @param select   { etiqueta, valor, onCambio, opciones: [{ valor, texto }] } (opcional)
 */
const BarraFiltros = ({ busqueda, select }) => (
  <div className="barra-filtros">
    <div className="barra-filtros-busqueda">
      <label>{busqueda.etiqueta}</label>
      <div className="barra-filtros-input">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder={busqueda.placeholder}
          value={busqueda.valor}
          onChange={(e) => busqueda.onCambio(e.target.value)}
        />
      </div>
    </div>
    {select && (
      <div className="barra-filtros-select">
        <label>{select.etiqueta}</label>
        <select value={select.valor} onChange={(e) => select.onCambio(e.target.value)}>
          {select.opciones.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.texto}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);

export default BarraFiltros;
