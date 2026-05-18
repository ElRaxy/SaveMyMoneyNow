// Archivo: backend\src\validators\importValidators.js
//
// Validadores manuales que devuelven `null` cuando el body es valido o una
// cadena con el motivo del rechazo. Se acoplan a Express con el middleware
// `validateRequest` (validateRequest.js), de manera que cada ruta declara su
// validador y el middleware traduce el string a una respuesta 400 con JSON.
// Mantenemos validadores manuales (en vez de Zod/Yup) para no introducir
// dependencias extra en una practica academica, pero el contrato es el mismo.

export const validateConfirmColumnsBody = (req) => {
  if (!Array.isArray(req.body?.files) || req.body.files.length === 0) {
    return "files[] es obligatorio";
  }

  const invalid = req.body.files.find((item) => {
    if (!item.fileId || !item.headerRow || !item.mapping) return true;
    return !item.mapping.fecha || !item.mapping.concepto || !item.mapping.importe;
  });

  if (invalid) {
    return "Cada archivo debe incluir fileId, headerRow y mapping {fecha, concepto, importe}";
  }

  return null;
};

export const validatePreviewMappingBody = (req) => {
  const body = req.body || {};

  if (!body.fileId || !body.headerRow || !body.mapping) {
    return "fileId, headerRow y mapping son obligatorios";
  }

  if (!body.mapping.fecha || !body.mapping.concepto || !body.mapping.importe) {
    return "mapping debe incluir fecha, concepto e importe";
  }

  return null;
};

// Valida el body de `POST /import/:batchId/categorize-preview`.
// Ambos campos son OPCIONALES (el flujo permite re-categorizar sin tocar nada),
// pero si se envian deben ser arrays para evitar TypeError al recorrerlos
// en Categorization.service.js (applyManualCategoryEdits / applyRuleActions).
export const validateCategorizePreviewBody = (req) => {
  const body = req.body || {};

  if (body.manualCategoryEdits !== undefined && !Array.isArray(body.manualCategoryEdits)) {
    return "manualCategoryEdits debe ser array";
  }

  if (body.ruleActions !== undefined && !Array.isArray(body.ruleActions)) {
    return "ruleActions debe ser array";
  }

  return null;
};

export const validateCommitBody = (req) => {
  const body = req.body || {};

  if (body.categoryEdits && !Array.isArray(body.categoryEdits)) {
    return "categoryEdits debe ser array";
  }

  if (body.ruleActions && !Array.isArray(body.ruleActions)) {
    return "ruleActions debe ser array";
  }

  if (body.conflictResolutions && !Array.isArray(body.conflictResolutions)) {
    return "conflictResolutions debe ser array";
  }

  return null;
};
