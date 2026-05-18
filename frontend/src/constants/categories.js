// Archivo: frontend\src\constants\categories.js
//
// Unica fuente de verdad para las categorias de gasto que el usuario puede
// elegir. Antes de extraerlas aqui, esta lista estaba duplicada en tres
// archivos (CategoryEditorTable, RuleCreator y FilterBar). Centralizarlas
// nos protege contra desincronizaciones (anadir "Mascotas" en un sitio y
// que el FilterBar no la conozca).
//
// `NEW_CATEGORY_VALUE` es el sentinel que usan los <select> para abrir el
// flujo de "crear categoria nueva". Lo prefijamos con "__" para que no
// pueda colisionar nunca con un nombre real de categoria.

export const CATEGORY_OPTIONS = [
  "Comida",
  "Gasolina",
  "Ocio",
  "Salud",
  "Hogar",
  "Transporte",
  "Nomina",
  "Otros"
];

export const NEW_CATEGORY_VALUE = "__new_category__";
