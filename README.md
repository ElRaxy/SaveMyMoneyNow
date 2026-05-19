# SaveMyMoneyNow

App fullstack para analizar gastos e ingresos personales a partir de extractos bancarios en Excel. Subes los archivos, un asistente te lleva paso a paso detectando columnas, normalizando, categorizando y quitando duplicados, y al final lo guarda todo en MongoDB.

Node 18+ · React 18 · MongoDB Atlas · licencia académica.

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

Revisar extractos bancarios a mano es un infierno. Cada banco (BBVA, Santander, Ruralvia, ING) te da un Excel distinto: cabeceras que no coinciden, filas de metadatos al principio, fechas en tres formatos diferentes y comas o puntos para los decimales según les dé. Si juntas varios meses a mano la cosa se rompe: la misma compra aparece dos veces porque reimportaste el mes, los importes de tarjeta y cuenta se mezclan, y a partir del segundo mes categorizar 300 movimientos uno a uno deja de tener sentido.

SaveMyMoneyNow se come ese trabajo. Subes uno o varios `.xls/.xlsx` y el asistente, en nueve pantallas, detecta sola la fila de cabecera y te propone qué columna es la fecha, cuál el concepto y cuál el importe. Tú confirmas o corriges. La app pasa todo a un modelo interno único, aplica tus reglas de categorización (las que aprendió o las de fábrica), te avisa de duplicados por `fecha + concepto` con tres formas de resolver cada fila, y al final escribe los movimientos en MongoDB. Desde ahí tienes dashboard con filtros, comparativas por día, semana, mes o año, histórico paginado y exportación a Excel y PDF.

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
| 11 | Dashboard vacío (`EmptyState`) | `docs/screenshots/11-dashboard-empty.png` |
| 12 | Búsqueda activa en el histórico | `docs/screenshots/12-history-search.png` |

---

## Stack técnico

### Backend

- **Node.js 18+** con módulos ESM (`"type": "module"`).
- **Express 4** como framework HTTP.
- **Mongoose 8** para modelar y acceder a MongoDB.
- **multer** para los uploads multipart hacia `backend/uploads/`.
- **xlsx** (SheetJS) para leer `.xls/.xlsx` heterogéneos. Es la única librería que lee el `.xls` binario antiguo además del `.xlsx` moderno.
- **ExcelJS** para generar el export `.xlsx` con estilos, freeze panes y auto-filter. Con `xlsx` los estilos avanzados no salen igual de cómodos.
- **pdfkit** para el export PDF con maquetación tipo estado de cuenta: KPIs, tabla con cabecera repetida y footer "Página X de Y".
- **cors**, **dotenv**, **nodemon** (dev).

### Frontend

- **React 18** + **Vite 5**.
- **react-router-dom v6** con rutas anidadas y `<Outlet />`.
- **recharts** para los gráficos del dashboard (barras, líneas, donut).
- **axios** con una única instancia en `services/apiClient.js`.
- Context + reducer propios en `state/ImportWizardContext.jsx` para el estado del asistente. No hay Redux porque el alcance no lo pide.

---

## Requisitos previos

- **Node.js 18 o superior** (probado en 18.x y 20.x).
- **npm 9 o superior**.
- **MongoDB**: cuenta gratuita de [MongoDB Atlas](https://www.mongodb.com/atlas) o instancia local en `mongodb://localhost:27017`.
- Navegador moderno (Chrome / Edge / Firefox actualizados).

---

## Repositorio y versionado

El proyecto está en Git y publicado en GitHub:

- **Repositorio:** [`github.com/ElRaxy/SaveMyMoneyNow`](https://github.com/ElRaxy/SaveMyMoneyNow)
- **Rama principal:** `main`
- **Historial:** `git log` con mensajes en formato Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).

Lo que se cuidó en el repo:

- `.gitignore` excluye `node_modules/`, `dist/`, los `.env`, el contenido de `backend/uploads/` (deja el `.gitkeep`) y basura de IDE/SO.
- Los secretos (`MONGODB_URI`) viven solo en el `.env` local. En el repo solo está `.env.example`.
- Cada paso gordo (rediseño, CRUD, tests, code splitting, docs) tiene su commit propio para que el historial se lea.

Para evaluarlo sin descomprimir el ZIP:

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
cp .env.example .env       # ajusta VITE_API_URL si hace falta
npm install
npm run dev
```

- Frontend: `http://localhost:5180`
- Backend: `http://localhost:4000`
- Health check: `GET http://localhost:4000/api/health` devuelve `{"status":"ok"}`

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | Puerto HTTP del API. |
| `MONGODB_URI` | **Sí** | (vacío) | Cadena de conexión Mongo (Atlas o local). Si falta, el servidor revienta al arrancar. |
| `CORS_ORIGIN` | No | `localhost:5173, 5180` y sus `127.0.0.1` | Orígenes permitidos separados por comas. Se suma a la lista por defecto. |

### Frontend (`frontend/.env`)

| Variable | Obligatoria | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:4000/api` | Base URL del API que consume axios. |

---

## Scripts disponibles

### Backend

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor con `nodemon` (recarga al guardar). |
| `npm start` | Servidor en modo producción con `node`. |

### Frontend

| Comando | Acción |
| --- | --- |
| `npm run dev` | Vite en desarrollo (HMR) en `:5180`. |
| `npm run build` | Build de producción a `frontend/dist/`. |
| `npm run preview` | Sirve el build local para verificarlo. |

---

## Endpoints

Todo cuelga de `/api`. Las respuestas son JSON salvo los exports, que devuelven binario con su `Content-Type`.

### Health

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/health` | Devuelve `{ status: "ok" }`. Para readiness/uptime checks. |

### Importación (wizard)

| Método | Path | Qué hace | Body |
| --- | --- | --- | --- |
| `POST` | `/api/import/upload` | Sube uno o varios Excel (multipart, campo `files`, máx. 20). Crea un `ImportBatch` en estado `uploaded`. | `multipart/form-data` |
| `GET` | `/api/import/:batchId` | Devuelve el lote completo (debug / refresco al recargar). | (sin body) |
| `GET` | `/api/import/:batchId/detect` | Corre la heurística de detección y devuelve cabeceras, columnas candidatas y filas de preview por archivo. | (sin body) |
| `POST` | `/api/import/:batchId/confirm-columns` | Persiste el mapeo confirmado (`fecha`, `concepto`, `importe`, `origen`, `headerRow`) y normaliza filas. | `{ files: [{ fileId, headerRow, mapping, origen }] }` |
| `POST` | `/api/import/:batchId/preview-mapping` | Previsualiza el resultado de un mapeo sin persistir (UX live). | `{ fileId, headerRow, mapping }` |
| `POST` | `/api/import/:batchId/categorize-preview` | Aplica reglas de categorización al lote y, si las hay, ediciones manuales. | `{ manualCategoryEdits?: [{ tempId, categoria }] }` |
| `POST` | `/api/import/:batchId/check-duplicates` | Cruza el lote contra Mongo por `fingerprintKey` y devuelve `conflicts` + `nonConflicts`. | (sin body) |
| `POST` | `/api/import/:batchId/commit` | Inserta los movimientos definitivos. Aplica resoluciones de conflicto y aprende reglas marcadas. | `{ categoryEdits, ruleActions, conflictResolutions }` |

### Movimientos

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/movements` | Listado paginado con filtros: `from`, `to`, `categoria`, `origen`, `q` (texto), `page`, `pageSize`. Devuelve `summary` con ingresos / gastos / balance del subconjunto filtrado. |

### Dashboard

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/dashboard/by-category` | Total por categoría (donut / barras). |
| `GET` | `/api/dashboard/monthly-expense` | Gasto agregado por mes. |
| `GET` | `/api/dashboard/trend` | Tendencia (ingresos vs gastos) para líneas. |
| `GET` | `/api/dashboard/comparison?granularity=day\|week\|month\|year` | Comparativa entre dos periodos según granularidad. |

### Reglas de categorización

| Método | Path | Qué hace | Body |
| --- | --- | --- | --- |
| `GET` | `/api/rules` | Lista las reglas activas. | (sin body) |
| `POST` | `/api/rules` | Crea una regla. | `{ keyword, categoria, priority?, active? }` |
| `PUT` | `/api/rules/:id` | Actualiza una regla. | `{ keyword?, categoria?, priority?, active? }` |
| `DELETE` | `/api/rules/:id` | Borra una regla. | (sin body) |

### Exportación

| Método | Path | Qué hace |
| --- | --- | --- |
| `GET` | `/api/export/movements.xlsx` | Descarga `.xlsx` del histórico filtrado (mismos query params que `/api/movements`). |
| `GET` | `/api/export/movements.pdf` | Descarga `.pdf` con KPIs + tabla del histórico. Máx. 5000 filas (`HTTP 413` si te pasas). |

---

## Flujo del wizard

El asistente vive en `frontend/src/views/` y comparte estado con `ImportWizardContext`.

**Paso 0, Bienvenida (`/`)**
Pantalla de entrada con una explicación corta y un solo botón hacia el paso 1. No llama al API.

**Paso 1, Subida múltiple (`/upload`)**
Eliges varios `.xls/.xlsx` por input clásico o arrastrando. Manda todo a `POST /api/import/upload` (multipart) y recibe un `batchId` que guarda en el contexto. Multer escribe los archivos en `backend/uploads/` con nombre único.

**Paso 2, Detección automática (`/detection`)**
Llama a `GET /api/import/:batchId/detect`. `ExcelDetection.service.js` puntúa cada fila para encontrar la cabecera real (saltándose metadatos tipo "Titular", "IBAN") y propone fecha, concepto, importe y saldo combinando heurística por nombre de cabecera y por contenido de las primeras 25 filas.

**Paso 3, Confirmación de columnas (`/confirm`)**
Revisas el mapeo propuesto y lo corriges si hace falta (selects con todas las cabeceras, input numérico para `headerRow`). Eliges el origen del archivo (`tarjeta`, `cuenta`, `otro`). Al continuar dispara `POST /api/import/:batchId/confirm-columns`, que normaliza con `Normalization.service.js` y calcula `fingerprintKey` y `exactKey` por movimiento.

**Paso 4, Normalización (`/normalization`)**
Pantalla de control: muestra las filas normalizadas y las descartadas (con motivo) antes de seguir. Compruebas que el parseo de fecha e importe no te ha dejado inválidos a mansalva.

**Paso 5, Categorización (`/categorization`)**
Llama a `POST /api/import/:batchId/categorize-preview`. El backend recorre las reglas activas (`CategoryRule`) por prioridad ascendente y aplica la primera que matchea por `keyword` dentro del concepto normalizado. Puedes sobrescribir categorías a mano y marcar "aprender como regla" para que la próxima importación lo recuerde.

**Paso extra, Resolución de duplicados (`/duplicates`)**
Solo aparece si `POST /api/import/:batchId/check-duplicates` devuelve filas en conflicto. Por cada una eliges `keep_existing`, `replace` o `keep_both`. El default lo propone el backend según la heurística de importe (mira decisiones técnicas).

**Paso 6, Commit (`/commit` interno, cierra el wizard)**
`POST /api/import/:batchId/commit` con las resoluciones, ediciones de categoría y reglas nuevas. El backend inserta en Mongo, aprende reglas y devuelve un `commitSummary`.

**Paso 7, Dashboard (`/dashboard`)**
Filtros por rango de fechas, categoría y origen. Tarjetas KPI, donut por categoría, líneas de tendencia y barras de comparativa entre dos periodos con granularidad ajustable.

**Paso 8, Histórico y exportación (`/history`)**
Tabla paginada del histórico con los mismos filtros del dashboard. Botones de descarga `.xlsx` y `.pdf` que llaman a `/api/export/*` reusando los query params activos.

---

## Decisiones técnicas

### Fingerprint = `fecha + concepto` (sin importe)

El identificador lógico de un movimiento es `fingerprintKey = fecha|concepto` y el exacto es `exactKey = fecha|concepto|importe`. Los duplicados se detectan por `fingerprintKey`, no por `exactKey`. ¿Por qué? Porque el caso real, reimportar el extracto del mes, pasa constantemente. Si comparáramos también el importe, una compra que el banco corrigió tras una devolución parcial saldría como movimiento nuevo en vez de avisarte de que ya está en BBDD. El importe solo entra en la acción por defecto del conflicto (abajo) y en `exactKey`, que sirve para auditoría y para distinguir filas idénticas dentro de la misma importación.

### Prioridad inversa en `CategoryRule` (menor número = más prioritario)

`getActiveRules()` ordena por `priority` ascendente y aplica la primera que matchea. Las semilla naturales tipo `mercadona → Comida` van con `priority: 10`; las que aprende el usuario se guardan con `priority: 80`. Así una regla aprendida tipo "Mercadona Gourmet → Otros" no se carga la semilla original, pero si quieres forzarlo le bajas el número. Sí, es contraintuitivo (1 manda más que 100), pero te deja meter reglas nuevas "por encima" con números pequeños sin renumerar el resto.

### Routing con `<Outlet />` (React Router v6 idiomático)

`AppRouter.jsx` declara `StepLayout` como ruta padre y cada vista hija entra en el `<Outlet />`. Quita nueve imports duplicados de `StepLayout` (uno por vista) y centraliza el chrome común: cabecera, stepper, transición. Es el patrón de nested routes que recomienda la propia documentación de react-router-dom v6.

### TTL en `ImportBatch` (2 días)

`ImportBatch` tiene `expiresAt` con `expireAfterSeconds: 0`. Mongo borra el documento solo cuando vence. Los lotes son material temporal del wizard (filas normalizadas, conflictos, previews); si el usuario se va a mitad, no quiero arrastrar basura para siempre. Dos días es el punto medio entre "me da tiempo a retomarlo mañana" y no inflar el cluster gratuito de Atlas. Los movimientos definitivos (`Movement`) no caducan: solo el material intermedio.

### Límite de 5000 filas en export PDF

`pdfkit` construye el documento entero en memoria antes de soltarlo: no es streaming de verdad. Con un histórico grande, generar el PDF puede disparar la RAM del proceso Node hasta OOM en hostings modestos. Cortar a 5000 filas mantiene el PDF en torno a 6-8 MB y devuelve `HTTP 413` con un mensaje claro pidiéndote que afines filtros. El export XLSX no tiene este tope porque ExcelJS sí streamea a buffer de forma incremental y el formato comprimido aguanta órdenes de magnitud más.

---

## Troubleshooting

### Mongo no conecta al arrancar el backend

Síntoma: `MongoServerError` o `MongooseError` al ejecutar `npm run dev`.

1. Comprueba que `MONGODB_URI` en `backend/.env` está bien copiada y sin saltos de línea.
2. En Atlas, mira que tu IP esté en la whitelist (Network Access → Add IP). Si cambias de red a menudo, mete `0.0.0.0/0` temporal, solo en desarrollo.
3. Si usas Mongo local, confirma que el servicio está vivo: `mongosh "mongodb://localhost:27017"`.
4. Revisa que el usuario tiene `readWrite` sobre la base `savemymoneynow`.

### CORS error en la consola del navegador

Síntoma: `Access to XMLHttpRequest at 'http://localhost:4000/api/...' from origin 'http://localhost:5180' has been blocked by CORS policy`.

1. El backend ya permite por defecto `5173` y `5180` (en `localhost` y `127.0.0.1`). Si Vite arranca en otro puerto, mételo en `CORS_ORIGIN` (comas) y reinicia el backend.
2. Si llamas desde otro dominio, añade ese origen completo (con protocolo) en `CORS_ORIGIN`.
3. Sin cabecera `Origin` (Postman, curl) el backend deja pasar la petición. Si Postman te da CORS, no es CORS de verdad, es un fantasma del navegador embebido.

### Puerto ocupado (`EADDRINUSE`)

Síntoma: `Error: listen EADDRINUSE: address already in use :::4000` (o `:5180`).

1. Tienes otra instancia viva: cierra terminales antiguas.
2. Windows: `netstat -ano | findstr :4000` → `taskkill /PID <pid> /F`.
3. macOS / Linux: `lsof -i :4000` → `kill -9 <pid>`.
4. O cambia el puerto en `.env` (`PORT=4001`) y `VITE_API_URL` en el frontend.

### El Excel no detecta cabeceras bien

Síntoma: el paso 2 propone columnas vacías o claramente mal.

1. Abre el Excel en Google Sheets o LibreOffice y mira que las primeras filas no sean una imagen o celdas merge raras.
2. En el paso 3, ajusta a mano "Fila cabecera" (empieza en 1) y vuelve a desplegar.
3. Los selectores muestran todas las cabeceras detectadas: aunque la heurística falle, siempre puedes mapear a mano.
4. Si el banco usa cabeceras raras, añade vocabulario en `HEADER_SYNONYMS` (`backend/src/services/ExcelDetection.service.js`) para la próxima vez.

### Lote expirado (HTTP 410 al continuar el wizard)

Síntoma: dejaste el wizard abierto más de dos días y al avanzar recibes `410 Gone`.

1. El `ImportBatch` caducó por TTL (mira decisiones técnicas).
2. Vuelve a `/upload` y empieza de cero. Los archivos físicos siguen en `backend/uploads/`: bórralos a mano si quieres.
3. Para depurar, pega un `GET /api/import/:batchId`: si responde 404, confirmado.

### Las reglas aprendidas no se aplican en la siguiente importación

Síntoma: cargaste un Excel nuevo y movimientos que ayer aprendiste vuelven a `Otros`.

1. Comprueba que en el paso 5 marcaste "aprender como regla" antes del commit.
2. Mira `GET /api/rules` para confirmar que la regla existe (`active: true`).
3. Las reglas matchean por `keyword` dentro del concepto **normalizado** (minúsculas, sin acentos). Si la `keyword` aprendida es muy larga, el nuevo concepto puede no contenerla: edítala con `PUT /api/rules/:id`.

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
        ├── components/           # UI reutilizable por dominio
        ├── services/             # cliente axios + APIs por dominio
        ├── state/                # ImportWizardContext + reducer
        ├── constants/            # catálogo de categorías
        ├── utils/                # formateadores
        └── styles/               # CSS global
```

---

## Tests

No hay suite automatizada por requisitos de la práctica (la rúbrica DAW prioriza funcionalidad). Lo que sí se probó:

- **Build de frontend**: `npm run build` en `frontend/` acaba sin errores y genera `dist/`.
- **Smoke syntax backend**: `node --check` sobre cada archivo de `backend/src/**/*.js`.
- **Pruebas manuales del flujo**: importar tres extractos distintos (BBVA, Santander, genérico), comprobar la detección automática, forzar conflictos reimportando, validar export PDF y XLSX, y revisar paginación y filtros del dashboard.

Si algún día se añaden tests, los sitios naturales son:

- `services/ExcelDetection.service.js` (puro, sin I/O en sus funciones internas).
- `services/Normalization.service.js` (puro).
- `services/Duplicate.service.js` (necesita mock de `Movement.find`).
- `utils/date.js`, `utils/amount.js`, `utils/text.js` (puros, fáciles de cubrir).

---

## Entrega DAW

Antes de hacer el ZIP de Aules:

1. **Borrar dependencias**: `backend/node_modules/` y `frontend/node_modules/`.
2. **Vaciar uploads**: contenido de `backend/uploads/` (deja la carpeta vacía con un `.gitkeep` si quieres).
3. **Borrar el build**: `frontend/dist/`.
4. **Verificar lo importante**:
   - `README.md` (este archivo) en la raíz.
   - `backend/.env.example` y `frontend/.env.example` presentes (sin secretos reales).
   - `docs/arquitectura.md` y `docs/screenshots/` con las capturas regeneradas.
5. **Comprimir** `backend/` y `frontend/` junto con `README.md` y `docs/` en un único ZIP.
6. **Nombrar el archivo**: `Extra_SaveMyMoneyNow_<Nombre>_<Apellidos>.zip`.
7. **Subir a Aules** dentro de plazo.

---

## Licencia

Trabajo académico del ciclo DAW (DWES). Propiedad intelectual del alumno autor. Uso educativo y de evaluación; no autorizado para distribución comercial.
