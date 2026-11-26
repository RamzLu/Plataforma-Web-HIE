import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/ui/Paginacion.css";

// Números a mostrar: todos si son pocos; si no, la primera, la última y las vecinas de la actual.
const numerosVisibles = (pagina, totalPaginas) => {
  if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  const numeros = new Set([1, totalPaginas, pagina - 1, pagina, pagina + 1]);
  const lista = [...numeros].filter((n) => n >= 1 && n <= totalPaginas).sort((a, b) => a - b);
  const conSaltos = [];
  lista.forEach((n, i) => {
    if (i > 0 && n - lista[i - 1] > 1) conSaltos.push(`salto-${n}`);
    conSaltos.push(n);
  });
  return conSaltos;
};

/**
 * Controles de paginación. Recibe lo que devuelve usePaginacion().
 * No se muestra si todo entra en una sola página.
 */
const Paginacion = ({ pagina, totalPaginas, total, desde, hasta, irAPagina, etiqueta = "resultados" }) => {
  if (totalPaginas <= 1) return null;

  return (
    <nav className="paginacion" aria-label="Paginación">
      <span className="paginacion-resumen">
        Mostrando {desde + 1}–{hasta} de {total} {etiqueta}
      </span>
      <div className="paginacion-controles">
        <button
          type="button"
          className="paginacion-flecha"
          onClick={() => irAPagina(pagina - 1)}
          disabled={pagina === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        {numerosVisibles(pagina, totalPaginas).map((n) =>
          typeof n === "string" ? (
            <span key={n} className="paginacion-salto" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`paginacion-numero ${n === pagina ? "activa" : ""}`}
              onClick={() => irAPagina(n)}
              aria-label={`Página ${n}`}
              aria-current={n === pagina ? "page" : undefined}
            >
              {n}
            </button>
          )
        )}
        <button
          type="button"
          className="paginacion-flecha"
          onClick={() => irAPagina(pagina + 1)}
          disabled={pagina === totalPaginas}
          aria-label="Página siguiente"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Paginacion;
