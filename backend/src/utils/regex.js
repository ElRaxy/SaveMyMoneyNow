// Archivo: backend\src\utils\regex.js. Codigo y comentarios en espanol.
//
// Helper para sanear entradas que se inyectan en expresiones regulares.
//
// Por que: cuando el cliente envia un termino de busqueda (?search=...) lo
// usamos en un `new RegExp(termino, "i")` contra Mongo. Si el usuario
// escribe caracteres especiales como `.`, `*`, `+`, `(`, `[`... la regex
// resultante podria interpretarlos como metacaracteres y, en el peor caso,
// provocar ReDoS (regex con backtracking catastrofico) o resultados
// inesperados. Escapando esos caracteres garantizamos que la busqueda es
// siempre textual ("contains") y segura. Es el patron canonico documentado
// por MDN para "RegExp.escape" mientras esa API esta en propuesta.

export const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
