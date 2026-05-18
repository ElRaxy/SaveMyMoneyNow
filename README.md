# SaveMyMoneyNow

Aplicación fullstack para analizar gastos e ingresos personales a partir de extractos bancarios en Excel, mediante un asistente paso a paso que detecta, normaliza, categoriza y deduplica los movimientos antes de guardarlos en MongoDB.

![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-Académica-blue)

---

## Tabla de contenidos

- [Qué es y qué resuelve](#qué-es-y-qué-resuelve)
- [Capturas](#capturas)
- [Stack técnico](#stack-técnico)
- [Requisitos previos](#requisitos-previos)
- [Repositorio y versionado](#repositorio-y-versionado)
- [Instalación rápida](#instalación-rápida)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Endpoints](#endpoints)
- [Flujo del wizard](#flujo-del-wizard)
- [Decisiones técnicas](#decisiones-técnicas)
- [Troubleshooting](#troubleshooting)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Tests](#tests)
- [Entrega DAW](#entrega-daw)
- [Licencia](#licencia)

---

## Qué es y qué resuelve

SaveMyMoneyNow es una aplicación web que automatiza el trabajo manual de revisar extractos bancarios en Excel. Cada banco (BBVA, Santander, Ruralvia, ING, etc.) entrega archivos con cabeceras distintas, filas de metadatos al principio, formatos de fecha mezclados y separadores decimales heterogéneos. Reconciliar varios extractos a mano es repetitivo y propenso a errores: la misma compra puede aparecer dos veces si se reimporta un mes, los importes se mezclan entre tarjeta y cuenta, y categorizar 300 movimientos a mano deja de ser viable a partir del segundo mes.

La aplicación resuelve ese flujo completo en un asistente de nueve pantallas. Sube uno o varios `.xls/.xlsx`, detecta automáticamente la fila de cabecera y propone qué columna es la fecha, el concepto y el importe; el usuario confirma o corrige el mapeo, la app normaliza al modelo interno único, aplica reglas de categorización persistentes (aprendidas o por defecto), avisa de duplicados por `fecha + concepto` con tres opciones de resolución por fila y, finalmente, persiste los movimientos en MongoDB. A partir de ahí ofrece un dashboard con filtros, comparativas por granularidad (día / semana / mes / año), histórico paginado y exportación a Excel y PDF.

---

## Capturas

Las capturas viven en `docs/screenshots/`.

| # | Pantalla | Archivo |
| --- | --- | --- |
| 01 | Bienvenida | `docs/screenshots/01-welcome.png` |
| 02 | Subida múltiple con archivo cargado | `docs/screenshots/02-upload.png` |
| 03 | Detección automática de columnas | `docs/screenshots/03-detection.png` |
| 04 | Confirmación manual del mapeo | `docs/screenshots/04-confirm.png` |
| 05 | Normalización (modelo único) | `docs/screenshots/05-normalization.png` |
| 06 | Categorización con reglas | `docs/screenshots/06-categorization.png` |
| 07 | Resolución de duplicados | `docs/screenshots/07-duplicates.png` |
| 08 | Dashboard con `InsightsPanel` | `docs/screenshots/08-dashboard.png` |
| 09 | Histórico con CRUD y búsqueda | `docs/screenshots/09-history.png` |
| 10 | Modal de edición de movimiento | `docs/screenshots/10-edit-modal.png` |
| 11 | Dashboard en estado vacío (`EmptyState`) | `docs/screenshots/11-dashboard-empty.png` |
| 12 | Búsqueda activa en el histórico | `docs/screenshots/12-history-search.png` |

---

## Stack técnico

### Backend

- **Node.js 18+** con módulos ESM (`"type": "module"`).
- **Express 4** como framework HTTP.
- **Mongoose 8** para modelado y acceso a MongoDB.
- **multer** para gestión de uploads multipart hacia `backend/uploads/`.
- **xlsx** (SheetJS) para lectura de `.xls/.xlsx` heterogéneos: es la única librería capaz de leer el formato `.xls` binario antiguo además del moderno `.xlsx`.
- **ExcelJS** para la generación del export `.xlsx` con estilos, freeze panes y auto-filter (`xlsx` no cubre estilos avanzados con la misma comodidad).
- **pdfkit** para el export PDF con maquetación tipo "estado de cuenta" (KPIs, tabla con cabecera repetida, footer "Página X de Y").
- **cors**, **dotenv**, **nodemon** (dev).

### Frontend

- **React 18** + **Vite 5**.
- **react-router-dom v6** con rutas anidadas y `<Outlet />`.
- **recharts** para gráficos del dashboard (barras, líneas, donut).
- **axios** como cliente HTTP con instancia única en `services/apiClient.js`.
- Context + reducer propios en `state/ImportWizardContext.jsx` para el estado del asistente (sin Redux: el alcance no lo justifica).

---

## Requisitos previos

- **Node.js 18 o superior** (probado en 18.x y 20.x).
- **npm 9 o superior**.
- **MongoDB**: cuenta gratuita de [MongoDB Atlas](https://www.mongodb.com/atlas) o instancia local en `mongodb://localhost:27017`.
- Navegador moderno (Chrome / Edge / Firefox actualizados).

---

## Repositorio y versionado

El proyecto se ha desarrollado con control de versiones Git y está publicado en GitHub:

- **Repositorio:** [`github.com/ElRaxy/SaveMyMoneyNow`](https://github.com/ElRaxy/SaveMyMoneyNow)
- **Rama principal:** `main`
- **Historial:** `git log` muestra commits con mensajes en formato *Conventional Commits* (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).

Buenas prácticas aplicadas al repo:

- `.gitignore` excluye `node_modules/`, `dist/`, archivos `.env`, contenido de `backend/uploads/` (manteniendo `.gitkeep`) y artefactos de IDE/SO.
- Variables secretas (`MONGODB_URI`) viven solo en `.env` local; el repo solo contiene `.env.example`.
- Cada paso importante (rediseño visual, CRUD, suite de tests, code splitting, documentación) tiene su commit dedicado para que el historial sea legible.

Para evaluar el proyecto sin descomprimir el ZIP:

```bash
git clone https://github.com/ElRaxy/SaveMyMoneyNow.git
cd SaveMyMoneyNow
# resto de pasos en "Instalación rápida"
```

---

## Instalación rápida

```bash
# 1. Clonar
git clone https://github.com/ElRaxy/SaveMyMoneyNow.git SaveMyMoneyNow
cd SaveMyMoneyNow

# 2. Backend
cd backend
cp .env.example .env       # rellena MONGODB_URI
npm install
npm run dev

# 3. Frontend (en otra terminal)
cd ../frontend
cp .env.example .env       # ajusta VITE_API_URL si es necesario
npm install
npm run dev
```

- Frontend: `http://localhost:5180`
- Backend: `http://localhost:4000`
- Health check: `GET http://localhost:4000/api/health` → `{"status":"ok"}`

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | Puerto HTTP del API. |
| `MONGODB_URI` | **Sí** | — | Cadena de conexión Mongo (Atlas o local). Si falta, el servidor lanza `Error` al arrancar. |
| `CORS_ORIGIN` | No | `localhost:5173, 5180` y `127.0.0.1` equivalentes | Lista separada por comas de orígenes permitidos. Se suma a la lista por defecto. |

### Frontend (`frontend/.env`)

| Variable | Obligatoria | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:4000/api` | Base URL del API consumida por axios. |

---

## Scripts disponibles

### Backend

| Comando | Acción |
| --- | --- |
| `npm run dev` | Arranca el servidor con `nodemon` (recarga al guardar). |
| `npm start` | Arranca el servidor en modo producción con `node`. |

### Frontend

| Comando | Acción |
| --- | --- |
| `npm run dev` | Arranca Vite en modo desarrollo (HMR) en `:5180`. |
| `npm run build` | Build de producción a `frontend/dist/`. |
| `npm run preview` | Sirve el build de producción local para verificarlo. |

---

## Endpoints

Todos los endpoints cuelgan de `/api`. Todas las respuestas son JSON salvo los exports, que devuelven binario con su `Content-Type` correspondiente.

### Health

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/health` | Devuelve `{ status: "ok" }`. Para readiness/uptime checks. |

### Importación (wizard)

| Método | Path | Qué hace | Body |
| --- | --- | --- | --- |
| `POST` | `/api/import/upload` | Sube uno o varios Excel (multipart, campo `files`, máx. 20). Crea un `ImportBatch` con estado `uploaded`. | `multipart/form-data` |
| `GET` | `/api/import/:batchId` | Devuelve el lote completo (debug / refresco al recargar). | — |
| `GET` | `/api/import/:batchId/detect` | Ejecuta la heurística de detección y devuelve cabeceras, columnas candidatas y filas de preview por archivo. | — |
| `POST` | `/api/import/:batchId/confirm-columns` | Persiste el mapeo confirmado por el usuario (`fecha`, `concepto`, `importe`, `origen`, `headerRow`) y normaliza filas. | `{ files: [{ fileId, headerRow, mapping, origen }] }` |
| `POST` | `/api/import/:batchId/preview-mapping` | Previsualiza el resultado de un mapeo concreto sin persistir (UX live). | `{ fileId, headerRow, mapping }` |
| `POST` | `/api/import/:batchId/categorize-preview` | Aplica reglas de categorización al lote y opcionalmente ediciones manuales. | `{ manualCategoryEdits?: [{ tempId, categoria }] }` |
| `POST` | `/api/import/:batchId/check-duplicates` | Cruza el lote contra Mongo por `fingerprintKey` y devuelve `conflicts` + `nonConflicts`. | — |
| `POST` | `/api/import/:batchId/commit` | Confirma e inserta movimientos definitivos. Aplica resoluciones de conflicto y aprende reglas marcadas. | `{ categoryEdits, ruleActions, conflictResolutions }` |

### Movimientos

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/movements` | Listado paginado con filtros: `from`, `to`, `categoria`, `origen`, `q` (texto), `page`, `pageSize`. Devuelve `summary` con ingresos / gastos / balance del subconjunto filtrado. |

### Dashboard

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/dashboard/by-category` | Total agrupado por categoría (para gráfico donut / barras). |
| `GET` | `/api/dashboard/monthly-expense` | Gasto agregado por mes. |
| `GET` | `/api/dashboard/trend` | Tendencia (ingresos vs gastos) para gráfico de líneas. |
| `GET` | `/api/dashboard/comparison?granularity=day\|week\|month\|year` | Comparativa entre dos periodos según granularidad. |

### Reglas de categorización

| Método | Path | Qué hace | Body |
| --- | --- | --- | --- |
| `GET` | `/api/rules` | Lista todas las reglas activas. | — |
| `POST` | `/api/rules` | Crea una regla. | `{ keyword, categoria, priority?, active? }` |
| `PUT` | `/api/rules/:id` | Actualiza una regla. | `{ keyword?, categoria?, priority?, active? }` |
| `DELETE` | `/api/rules/:id` | Elimina una regla. | — |

### Exportación

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/export/movements.xlsx` | Descarga `.xlsx` del histórico filtrado (mismos query params que `/api/movements`). |
| `GET` | `/api/export/movements.pdf` | Descarga `.pdf` con KPIs + tabla del histórico. Máximo 5000 filas (`HTTP 413` si se excede). |

---

## Flujo del wizard

El asistente vive en `frontend/src/views/` y comparte estado mediante `ImportWizardContext`.

**Paso 0 — Bienvenida (`/`)**
Pantalla de entrada con explicación corta del flujo y un único CTA hacia el paso 1. No hace llamadas al API.

**Paso 1 — Subida múltiple (`/upload`)**
Permite seleccionar varios `.xls/.xlsx` mediante input clásico o arrastrar y soltar. Envía todos los archivos a `POST /api/import/upload` (multipart) y recibe un `batchId` que persiste en el contexto. Multer guarda los archivos en `backend/uploads/` con nombre único.

**Paso 2 — Detección automática (`/detection`)**
Llama a `GET /api/import/:batchId/detect`. El servicio `ExcelDetection.service.js` puntúa cada fila para encontrar la cabecera real (saltándose filas de metadatos tipo "Titular", "IBAN") y propone qué columna es la fecha, el concepto, el importe y el saldo combinando heurística por nombre de cabecera y por contenido de las primeras 25 filas.

**Paso 3 — Confirmación de columnas (`/confirm`)**
El usuario revisa el mapeo propuesto y lo corrige si hace falta (selects con todas las cabeceras disponibles, input numérico para `headerRow`). También elige el origen del archivo (`tarjeta`, `cuenta`, `otro`). Al continuar, dispara `POST /api/import/:batchId/confirm-columns`, que normaliza filas con `Normalization.service.js` y calcula `fingerprintKey` y `exactKey` por movimiento.

**Paso 4 — Normalización (`/normalization`)**
Vista de control: muestra las filas normalizadas y las descartadas (con motivo) antes de seguir. El usuario verifica que el parseo de fecha e importe no ha producido inválidos masivos.

**Paso 5 — Categorización (`/categorization`)**
Llama a `POST /api/import/:batchId/categorize-preview`. El backend recorre las reglas activas (`CategoryRule`) ordenadas por prioridad ascendente y aplica la primera que matchea por `keyword` contenida en el concepto normalizado. El usuario puede sobrescribir categorías a mano y marcar "aprender como regla" para que la siguiente importación lo recuerde.

**Paso extra — Resolución de duplicados (`/duplicates`)**
Solo se renderiza si `POST /api/import/:batchId/check-duplicates` devuelve filas en conflicto. Por cada conflicto el usuario elige `keep_existing`, `replace` o `keep_both`. El default lo propone el backend según la heurística de importe (ver decisiones técnicas).

**Paso 6 — Commit (`/commit` interno, finaliza el wizard)**
`POST /api/import/:batchId/commit` con las resoluciones, ediciones de categoría y nuevas reglas. El backend inserta movimientos en Mongo, aprende reglas y devuelve un `commitSummary`.

**Paso 7 — Dashboard (`/dashboard`)**
Filtros por rango de fechas, categoría y origen. Tarjetas KPI, gráfico donut por categoría, líneas de tendencia y barras de comparativa entre dos periodos con granularidad ajustable.

**Paso 8 — Histórico y exportación (`/history`)**
Tabla paginada del histórico completo con los mismos filtros del dashboard. Botones de descarga `.xlsx` y `.pdf` que llaman a `/api/export/*` reutilizando los query params activos.

---

## Decisiones técnicas

### Fingerprint = `fecha + concepto` (sin importe)

El identificador lógico de un movimiento es `fingerprintKey = fecha|concepto` y el identificador exacto es `exactKey = fecha|concepto|importe`. La duplicación se detecta por `fingerprintKey`, no por `exactKey`, porque el caso real de "reimportar el extracto del mes" pasa con frecuencia: si comparáramos también el importe, una compra que el banco corrigió tras una devolución parcial aparecería como movimiento nuevo en vez de avisar al usuario de que ya existe en BBDD. El importe entra solo en la decisión de la acción por defecto del conflicto (ver más abajo) y en `exactKey`, que es útil para auditoría y para distinguir filas idénticas en la misma importación.

### Prioridad inversa en `CategoryRule` (menor número = más prioritario)

`getActiveRules()` ordena por `priority` ascendente y aplica la primera regla que matchea. Reglas semilla naturales como `mercadona → Comida` tienen `priority: 10`; las reglas aprendidas por el usuario se guardan con `priority: 80`. Así, una regla aprendida del tipo "Mercadona Gourmet → Otros" no anula la semilla original; pero si el usuario quiere forzarlo, puede subirla bajando su número. Es contraintuitivo (1 > 100) pero permite encajar reglas nuevas "por encima" simplemente metiendo números pequeños, sin tener que renumerar el resto.

### Routing con `<Outlet />` (React Router v6 idiomático)

`AppRouter.jsx` declara `StepLayout` como ruta padre y cada vista hija se inyecta en el `<Outlet />`. Esto elimina nueve importaciones duplicadas de `StepLayout` (una por vista) y centraliza el chrome común (cabecera, stepper, transición). Es el patrón "nested routes" recomendado por la propia documentación de react-router-dom v6.

### TTL en `ImportBatch` (2 días)

`ImportBatch` tiene `expiresAt` con `expireAfterSeconds: 0`. Mongo borra el documento automáticamente cuando vence. Los lotes son material temporal del wizard (filas normalizadas, conflictos, previews); si el usuario abandona el flujo, no queremos arrastrar basura para siempre. Dos días es el compromiso entre "tiempo suficiente para retomar la sesión al día siguiente" y "limpieza agresiva del cluster gratuito de Atlas". Los movimientos definitivos (`Movement`) no caducan: solo el material intermedio.

### Límite de 5000 filas en export PDF

`pdfkit` construye el documento en memoria antes de emitirlo: no es streaming real. Con histórico grande, generar el PDF puede disparar el uso de RAM del proceso Node hasta provocar OOM en hostings modestos. Cortar a 5000 filas mantiene el documento por debajo de un margen razonable (~6-8 MB) y devuelve `HTTP 413` con un mensaje claro indicando al usuario que afine filtros. El export XLSX no tiene este límite porque ExcelJS sí streamea a buffer de forma incremental y el formato comprimido tolera órdenes de magnitud más.

---

## Troubleshooting

### Mongo no conecta al arrancar el backend

Síntoma: `MongoServerError` o `MongooseError` al ejecutar `npm run dev`.

1. Verifica que `MONGODB_URI` en `backend/.env` está bien copiada y sin saltos de línea.
2. En Atlas, comprueba que la IP actual está en la *whitelist* (Network Access → Add IP). Si trabajas desde redes cambiantes, añade temporalmente `0.0.0.0/0` solo en desarrollo.
3. Si usas Mongo local, confirma que el servicio está arriba: `mongosh "mongodb://localhost:27017"`.
4. Revisa que el usuario tiene permisos `readWrite` sobre la base de datos `savemymoneynow`.

### CORS error en consola del navegador

Síntoma: `Access to XMLHttpRequest at 'http://localhost:4000/api/...' from origin 'http://localhost:5180' has been blocked by CORS policy`.

1. El backend ya permite por defecto `5173` y `5180` (en `localhost` y `127.0.0.1`). Si Vite arranca en otro puerto, añádelo en `CORS_ORIGIN` (separado por comas) y reinicia el backend.
2. Si llamas desde un dominio distinto, añade ese origen completo (con protocolo) en `CORS_ORIGIN`.
3. Sin cabecera `Origin` (Postman, curl) el backend permite la petición: si Postman te da CORS, no es CORS real, es un mensaje fantasma del navegador embebido.

### Puerto ocupado (`EADDRINUSE`)

Síntoma: `Error: listen EADDRINUSE: address already in use :::4000` (o `:5180`).

1. Otra instancia del proyecto sigue viva: cierra terminales antiguas.
2. En Windows: `netstat -ano | findstr :4000` → `taskkill /PID <pid> /F`.
3. En macOS / Linux: `lsof -i :4000` → `kill -9 <pid>`.
4. O cambia el puerto en `.env` (`PORT=4001`) y `VITE_API_URL` en frontend.

### El Excel no detecta cabeceras correctamente

Síntoma: el paso 2 propone columnas vacías o claramente equivocadas.

1. Abre el Excel en Google Sheets o LibreOffice y comprueba que las primeras filas no son una imagen o celdas merge raras.
2. En el paso 3, ajusta manualmente el campo "Fila cabecera" (1-indexado) y vuelve a desplegar.
3. Los selectores de columna muestran todas las cabeceras detectadas: aunque la heurística falle, siempre puedes mapear a mano.
4. Si el banco usa cabeceras inusuales, añade vocabulario en `HEADER_SYNONYMS` (`backend/src/services/ExcelDetection.service.js`) para futuras importaciones.

### Lote expirado (HTTP 410 al continuar el wizard)

Síntoma: tras tener el wizard abierto más de dos días, al avanzar al siguiente paso recibes `410 Gone`.

1. El `ImportBatch` ha caducado por TTL (ver decisiones técnicas).
2. Vuelve a `/upload` y reinicia el flujo desde cero. Los archivos físicos siguen en `backend/uploads/`: puedes borrarlos a mano si lo prefieres.
3. Para depurar, consulta `GET /api/import/:batchId`: si responde 404, confirmado.

### Las reglas aprendidas no se aplican en la siguiente importación

Síntoma: cargaste un nuevo Excel y movimientos que ayer aprendiste a categorizar vuelven a `Otros`.

1. Verifica que en el paso 5 marcaste "aprender como regla" antes de hacer commit.
2. Consulta `GET /api/rules` para confirmar que la regla existe (`active: true`).
3. Recuerda que las reglas matchean por `keyword` contenida en el concepto **normalizado** (lowercase, sin acentos). Si la `keyword` aprendida es muy larga, puede que el nuevo concepto no la contenga: edítala vía `PUT /api/rules/:id`.

---

## Estructura del proyecto

```
SaveMyMoneyNow/
├── README.md
├── docs/
│   ├── arquitectura.md
│   └── screenshots/
│       └── README.md
├── backend/
│   ├── package.json
│   ├── uploads/                  # destino de multer (vaciar antes de entrega)
│   └── src/
│       ├── app.js                # registro de middlewares + rutas
│       ├── index.js              # bootstrap: conecta Mongo y arranca Express
│       ├── config/
│       │   ├── db.js             # conexión Mongoose
│       │   └── env.js            # carga y validación de .env
│       ├── controllers/          # capa HTTP (Import, Movement, Dashboard, Rule, Export)
│       ├── services/             # lógica de negocio
│       │   ├── ExcelDetection.service.js
│       │   ├── Normalization.service.js
│       │   ├── Categorization.service.js
│       │   ├── Duplicate.service.js
│       │   ├── Import.service.js
│       │   ├── Movement.service.js
│       │   ├── Dashboard.service.js
│       │   ├── Rule.service.js
│       │   └── Export.service.js
│       ├── models/               # esquemas Mongoose
│       │   ├── Movement.model.js
│       │   ├── CategoryRule.model.js
│       │   └── ImportBatch.model.js
│       ├── routes/               # routers de Express por dominio
│       ├── middlewares/          # upload, validación, errores
│       ├── utils/                # helpers (fechas, importes, texto, logger)
│       └── validators/           # validadores de body / query
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── routes/
        │   └── AppRouter.jsx     # rutas con StepLayout + <Outlet />
        ├── views/                # 9 pantallas del asistente
        ├── components/           # UI reutilizable agrupada por dominio
        ├── services/             # cliente axios + APIs por dominio
        ├── state/                # ImportWizardContext + reducer
        ├── constants/            # catálogo de categorías
        ├── utils/                # formateadores
        └── styles/               # CSS global
```

---

## Tests

El proyecto no incluye suite automatizada por requisitos de la práctica (la rúbrica DAW prioriza funcionalidad). Las pruebas realizadas son:

- **Build de frontend**: `npm run build` en `frontend/` finaliza sin errores y produce `dist/`.
- **Smoke syntax backend**: `node --check` sobre cada archivo de `backend/src/**/*.js`.
- **Pruebas manuales del flujo**: importar tres extractos distintos (BBVA, Santander, genérico), comprobar detección automática, forzar conflictos reimportando, validar export PDF y XLSX, comprobar paginación y filtros del dashboard.

Para añadir tests en el futuro, los puntos naturales son:

- `services/ExcelDetection.service.js` (puro, sin I/O en sus funciones internas).
- `services/Normalization.service.js` (puro).
- `services/Duplicate.service.js` (requiere mock de `Movement.find`).
- `utils/date.js`, `utils/amount.js`, `utils/text.js` (puros, fáciles de cubrir).

---

## Entrega DAW

Pasos previos al ZIP de Aules:

1. **Vaciar dependencias instaladas**: borrar `backend/node_modules/` y `frontend/node_modules/`.
2. **Vaciar uploads**: borrar el contenido de `backend/uploads/` (manteniendo la carpeta vacía con un `.gitkeep` si se quiere).
3. **Vaciar build de frontend**: borrar `frontend/dist/`.
4. **Verificar archivos clave**:
   - `README.md` (este archivo) en la raíz.
   - `backend/.env.example` y `frontend/.env.example` presentes (sin secretos reales).
   - `docs/arquitectura.md` y `docs/screenshots/` con las capturas regeneradas.
5. **Comprimir** las carpetas `backend/` y `frontend/` junto con `README.md` y `docs/` en un único ZIP.
6. **Nombrar el archivo**: `Extra_SaveMyMoneyNow_<Nombre>_<Apellidos>.zip`.
7. **Subir a Aules** dentro del plazo indicado.

---

## Licencia

Trabajo académico para el ciclo DAW (DWES). Propiedad intelectual del alumno autor. Uso educativo y de evaluación; no autorizado para distribución comercial.
