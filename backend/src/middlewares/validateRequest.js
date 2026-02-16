// Archivo: backend\src\middlewares\validateRequest.js. Codigo y comentarios en espanol.
export const validateRequest = (validator) => (req, res, next) => {
  const message = validator(req);
  if (message) {
    return res.status(400).json({ message });
  }
  return next();
};
