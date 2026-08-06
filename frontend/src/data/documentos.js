// Mock de datos inicial preparado para ser reemplazado por un fetch al backend en el futuro.
// Las URLs apuntan a un PDF de prueba público de la W3C para que puedas probar el visor embebido.
// import miPDF from "frontend/public/documents/mmc_final_final_2025_simple.pdf";
export const documentosData = [
  {
    id: 1,
    titulo:
      "Equipo Interdisciplinario de Mielomeningocele, preguntas y respuestas prácticas",
    categoria: "Guías y Orientación",
    fecha: "12/05/2026",
    tamañoMB: "1.2",
    url: "/documents/mmc_final_final_2025_simple.pdf",
  },
  {
    id: 2,
    titulo: "Recetas adaptadas para personas adultas con DISFAGIA",
    categoria: "Guías y Orientación",
    fecha: "23/04/2026",
    tamañoMB: "0.8",
    url: "/documents/disfagia_0_1_2.pdf",
  },
  {
    id: 3,
    titulo: "Resoluciones de la Dirección (Interés Público)",
    categoria: "Información Institucional",
    fecha: "07/04/2026",
    tamañoMB: "2.5",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: 4,
    titulo: "Organigrama de Jefaturas y Autoridades",
    categoria: "Prevención y Salud",
    fecha: "02/02/2026",
    tamañoMB: "2.1",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
  {
    id: 5,
    titulo: "Calendario Oficial de Vacunación (Nacional)",
    categoria: "Prevención y Salud",
    fecha: "29/11/2025",
    tamañoMB: "1.5",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  },
];
