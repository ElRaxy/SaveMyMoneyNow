# SaveMyMoneyNow

Aplicacion fullstack (React + Node/Express + MongoDB) para analizar gastos e ingresos a partir de archivos Excel bancarios con flujo asistente paso a paso.

## Arquitectura

### Backend (`Controller-Service-Model`)
- `controllers/`: endpoints HTTP
- `services/`: logica de negocio (deteccion Excel, normalizacion, reglas, duplicados, dashboard, export)
- `models/`: `Movement`, `CategoryRule`, `ImportBatch`
- `routes/`: rutas API
- `middlewares/`: upload, validacion, errores
- `utils/`: parseo y normalizacion

### Frontend (`vistas + componentes + servicios + estado`)
- `views/`: pantallas del asistente (pasos 0 a 7 + duplicados)
- `components/`: componentes UI reutilizables
- `services/`: cliente API y llamadas por dominio
- `state/`: contexto + reducer del wizard
- `utils/`: formateadores

## Requisitos
- Node.js 18+
- npm 9+
- MongoDB Atlas (o Mongo local cambiando `MONGODB_URI`)

## Variables de entorno

### Backend (`backend/.env`)
```env
PORT=4000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/savemymoneynow?retryWrites=true&w=majority
CORS_ORIGIN=http://localhost:5180,http://127.0.0.1:5180
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:4000/api
```

## Instalacion y ejecucion

### 1) Backend
```bash
cd backend
npm install
npm run dev
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5180`
Backend: `http://localhost:4000`

## Flujo funcional implementado
1. Paso 0: bienvenida
2. Paso 1: subida multiple Excel (`.xls/.xlsx`) con input y drag&drop
3. Paso 2: deteccion automatica de fila cabecera y columnas candidatas
4. Paso 3: confirmacion manual de columnas (fecha/concepto/importe) y origen
5. Paso 4: normalizacion al modelo unico
6. Paso 5: categorizacion automatica + edicion manual + reglas reutilizables
7. Extra: control de duplicados por `fecha + concepto` con pantalla de resolucion por fila
8. Paso 6: dashboard visual con filtros y comparativas
9. Paso 7: historico persistente + exportacion a Excel y PDF

## Endpoints principales
- `POST /api/import/upload`
- `GET /api/import/:batchId/detect`
- `POST /api/import/:batchId/confirm-columns`
- `POST /api/import/:batchId/categorize-preview`
- `POST /api/import/:batchId/check-duplicates`
- `POST /api/import/:batchId/commit`
- `GET /api/movements`
- `GET /api/dashboard/by-category`
- `GET /api/dashboard/monthly-expense`
- `GET /api/dashboard/trend`
- `GET /api/dashboard/comparison?granularity=day|week|month|year`
- `GET /api/rules` / `POST /api/rules` / `PUT /api/rules/:id` / `DELETE /api/rules/:id`
- `GET /api/export/movements.xlsx`
- `GET /api/export/movements.pdf`

## Pruebas realizadas
- Build frontend correcto (`npm run build`)
- Comprobacion sintactica backend (`node --check` en `src/**/*.js`)

## Entrega a Aules
1. Borrar `node_modules` en `backend` y `frontend`
2. Verificar que existen `README.md`, `backend/.env.example`, `frontend/.env.example`
3. Comprimir carpetas FrontEnd y BackEnd en ZIP
4. Subir con nombre: `Extra_SaveMyMoneyNow_Nombre_Apellidos.zip`

## Notas
- La app procesa por defecto la primera hoja de cada Excel.
- No hay integracion directa con bancos (solo importacion de archivos Excel).
- Se prioriza robustez ante formatos heterogeneos y confirmacion manual obligatoria por parte del usuario.
