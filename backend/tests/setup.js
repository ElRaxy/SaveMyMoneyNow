// Setup global de Vitest. Se ejecuta UNA vez por worker antes de cargar los
// tests. Su responsabilidad es asegurar variables de entorno minimas que
// `backend/src/config/env.js` exige al importarse: si MONGODB_URI esta
// vacio, env.js lanza y nada se puede cargar.
//
// El valor real de MONGODB_URI se sobreescribira en cada test de
// integracion via mongodb-memory-server; aqui solo damos algo no vacio
// para no petar el import.
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/savemymoneynow-test-placeholder";
process.env.NODE_ENV = "test";
