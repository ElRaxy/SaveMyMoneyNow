// Archivo: backend\src\validators\movementValidators.js
//
// Validadores manuales para los endpoints CRUD de movimientos. Siguen el
// mismo contrato que `importValidators.js`: devuelven `null` cuando el body
// es valido o una cadena con el motivo del rechazo. El middleware
// `validateRequest` traduce esa cadena a una respuesta 400 JSON.
//
// Mantenemos validadores manuales (sin Zod/Yup) para no anyadir dependencias
// extra en una practica academica, pero el contrato es identico.

// Campos editables permitidos en PATCH /api/movements/:id.
//
// Por que una whitelist explicita: los movimientos tienen campos derivados
// (`fingerprintKey`, `exactKey`, `archivo`) que se calculan a partir de
// otros datos o se asignan en la importacion. Si dejaramos que el cliente
// enviase cualquier campo en el body, podria romper la deteccion de
// duplicados sobreescribiendo manualmente la huella. Por eso aceptamos solo
// los cuatro campos que el usuario controla desde la UI.
const ALLOWED_FIELDS = ["concepto", "categoria", "importe", "origen"];
const ALLOWED_ORIGEN = ["tarjeta", "cuenta", "otro"];

export const validateUpdateMovementBody = (req) => {
  const body = req.body || {};

  const presentFields = ALLOWED_FIELDS.filter((field) => body[field] !== undefined);
  if (presentFields.length === 0) {
    return `Debes enviar al menos un campo editable: ${ALLOWED_FIELDS.join(", ")}`;
  }

  // Rechazamos explicitamente claves no permitidas para que el cliente
  // reciba un error claro en vez de un "exito silencioso" cuando intenta
  // editar `fingerprintKey`, `archivo`, etc.
  const extraneous = Object.keys(body).filter((key) => !ALLOWED_FIELDS.includes(key));
  if (extraneous.length > 0) {
    return `Campos no editables: ${extraneous.join(", ")}`;
  }

  if (body.concepto !== undefined) {
    if (typeof body.concepto !== "string" || body.concepto.trim() === "") {
      return "concepto debe ser un string no vacio";
    }
  }

  if (body.categoria !== undefined) {
    if (typeof body.categoria !== "string" || body.categoria.trim() === "") {
      return "categoria debe ser un string no vacio";
    }
  }

  if (body.importe !== undefined) {
    if (typeof body.importe !== "number" || Number.isNaN(body.importe)) {
      return "importe debe ser numerico";
    }
  }

  if (body.origen !== undefined) {
    if (!ALLOWED_ORIGEN.includes(body.origen)) {
      return `origen debe ser uno de: ${ALLOWED_ORIGEN.join(", ")}`;
    }
  }

  return null;
};
