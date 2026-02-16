// Archivo: backend\src\validators\importValidators.js. Codigo y comentarios en espanol.
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
