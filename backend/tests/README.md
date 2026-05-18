# Suite de tests — backend SaveMyMoneyNow

## Stack

- **Vitest** — runner (compatible con la sintaxis Jest, sin transformaciones extra).
- **supertest** — peticiones HTTP contra la `app` Express sin abrir puerto.
- **mongodb-memory-server** — Mongo en proceso, descarga el binario la primera vez (~80 MB) y arranca un mongod efimero por suite.

## Estructura

```
backend/tests/
  setup.js                     # configura MONGODB_URI antes de cargar env.js
  helpers/
    mongo.js                   # start/stop/clear del mongod en memoria
    server.js                  # supertest agent contra src/app.js
  fixtures/
    buildBbvaXlsx.js           # genera un .xlsx sintetico estilo BBVA
    buildSantanderXlsx.js      # idem estilo Santander
  unit/
    amount.test.js             # parseAmountValue
    date.test.js               # parseDateValue
    text.test.js               # normalizeText / normalizeConcept
    ExcelDetection.test.js     # analyzeFile + extractRowsWithHeader
    Duplicate.test.js          # checkRowsAgainstDatabase con Mongo real
  integration/
    api.health.test.js         # GET /api/health y 404
    api.rules.test.js          # CRUD /api/rules
    api.movements.test.js      # filtros, paginacion, PATCH, DELETE
    api.import.test.js         # flujo upload -> commit con XLSX BBVA
    api.export.test.js         # /export/movements.xlsx y .pdf
```

## Como correr

```bash
cd backend
npm install        # instala vitest, supertest, mongodb-memory-server
npm test           # corre toda la suite una vez
npm run test:watch # modo watch durante desarrollo
```

## Notas

- La **primera ejecucion** requiere conexion a internet: mongodb-memory-server descarga un binario `mongod` (~80 MB) y lo cachea en `~/.cache/mongodb-binaries/` o `%LOCALAPPDATA%\MongoDB\binary-cache\`. Las siguientes ejecuciones son offline.
- Los tests **no tocan** la BBDD real: cada suite arranca su propio mongod y lo limpia tras los tests.
- Los tests **no arrancan** el servidor Express en un puerto: supertest llama a la `app` directamente.
- El env var `MONGODB_URI` se setea con un placeholder en `setup.js` solo para que `src/config/env.js` no lance al importarse; el valor real lo asigna mongodb-memory-server.

## Cobertura

- **utils**: amount, date, text con casos espanoles tipicos (coma decimal, mes abreviado, acentos).
- **servicios criticos**: deteccion de columnas de Excel y deteccion de duplicados.
- **API REST**: health, CRUD reglas, listado de movimientos con filtros, flujo end-to-end de importacion (upload -> commit), exportacion XLSX/PDF.
