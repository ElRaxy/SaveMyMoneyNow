// Helper de mongodb-memory-server para tests de integracion.
//
// La estrategia es:
//   - startMongo(): crea un mongod efimero en proceso, lo conecta via
//     Mongoose y devuelve la URI.
//   - stopMongo(): cierra Mongoose y para el mongod.
//   - clearCollections(): limpia todas las colecciones entre tests para no
//     filtrar estado.
//
// Compartimos UNA instancia por suite (no por test) por rendimiento:
// arrancar mongod dura ~1s y descarga ~80MB la primera vez.
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer = null;

export const startMongo = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  return uri;
};

export const stopMongo = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};
