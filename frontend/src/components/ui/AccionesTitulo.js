import { createContext } from "react";

// El panel del CMS pone aquí el lugar (a la derecha del título de la página) donde cada módulo
// muestra su botón "Actualizar", como en el panel del Admin. Si no hay lugar, el botón va junto a los filtros.
export const AccionesTituloContext = createContext(null);
