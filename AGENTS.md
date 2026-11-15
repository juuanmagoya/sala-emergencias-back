# AGENTS.md — bootcamp-boilerplate

Guía para agentes IA y desarrolladores que trabajen en este repo. Ser conciso y preciso.

## Proyecto

Backend de un sistema de turnos para centros de salud municipal (Express 5 + Mongoose 9 / MongoDB Atlas).
Migración gradual de JS (CommonJS) a TypeScript en curso en la rama `develop`.

## Comandos

- `npm run dev` — arranca la API con hot-reload (`tsx watch src/server.ts`). Es el ÚNICO punto de entrada válido.
- `npx tsc --noEmit` — chequeo de tipos (debe pasar sin errores al terminar un cambio).
- `npm test` — placeholder: no hay tests ni framework de testing.
- NO ejecutar ni seguir manteniendo `app.js` (raíz): es código heredado que referencia archivos ya movidos/borrados. Queda solo como referencia.

## Arquitectura

- Entrada: `src/server.ts` → `src/app.ts` (middlewares y montaje de rutas) → módulos por dominio.
- Estructura de cada módulo en `src/modules/<dominio>/`:
  `models/`, `interfaces/`, `dtos/`, `request/`, `services/`, `controllers/`, `routes/`.
- Cadena: route → controller (HTTP y mapeo de errores) → service (lógica + validaciones de negocio)
  → model (Mongoose Schema + interface + `toJSON` que renombra `_id`→`id`, borra `__v`, `timestamps: true`).
- Middlewares en orden: `cors` (origin localhost:5173) → `express.json()` → auditoría → rutas públicas de auth → `authMiddleware` (JWT Bearer) → rutas protegidas → 404.
- Módulos ya migrados a TypeScript: `auth`, `medico`, `especialidad`, `pacientes`, `consultorio`, `turnos`, `recepcion`, `historiaclinica` (montada como `/api/v1/historias-clinicas`).
  - `turnos` atiende al portal de pacientes con `GET /api/v1/turnos/medicos-disponibles`, `GET /api/v1/turnos/disponibilidad`
    y `POST /api/v1/turnos/mi-turno`. El historial propio se consulta con `GET /api/v1/turnos/mi-historial` (rol `paciente`):
    devuelve pendientes, atendidos y cancelados —incluidos los de baja lógica (`activo: false`)— ordenados por
    `fechaTurno` descendente, sin paginación. La identidad sale siempre de `req.usuario.id`; no se acepta `paciente`
    por parámetro. `GET /api/v1/turnos/mis-turnos` sigue siendo exclusivo del rol `medico`.
  - `recepcion` no define un modelo Mongoose propio: su service reutiliza los modelos de los módulos `pacientes` y `turnos` (el ingreso crea ambas entidades en una transacción de Mongoose).
  - `historiaclinica` registra atenciones con `paciente`, `medico`, `fechaAtencion`, `observaciones` y `recetario`.
    No tiene borrado lógico ni endpoint `DELETE` (los registros clínicos no se eliminan). El listado admite
    `?paciente=` y `?medico=`, y `GET /paciente/:pacienteId` devuelve el historial ordenado por `fechaAtencion` descendente.
    Los documentos legacy se migran con `npm run migrar:historias-clinicas` (dry-run por defecto).
- La migración por módulos está completa: ya no queda código `.js` de dominio heredado.
- Los archivos de auth (`src/routes/auth.routes.ts`, `src/controllers/auth.controller.ts`, `src/services/auth.service.ts`) quedaron en TS pero fuera de `src/modules/` (modelo en `src/modules/usuario/`). Reubicarlos en el patrón de módulos solo como tarea explícita.

## Convenciones de código

- Todo en español: nombres de archivos/carpetas/funciones, mensajes de API para el usuario, logs y commits.
- Indentación 4 espacios, comillas simples, `import type` para tipos.
- Export `default` para models/services/routers; export `named` para controllers.
- Respuesta única de los endpoints: usar `src/utils/respuestaEstandar.ts` → `{ success, timestamp, message, total, data }`.
- Validaciones y mensajes de negocio solo en el service; el controller traduce `error.message` a status HTTP
  (400 validación/duplicado, 404 no encontrado, 500 resto).
- Config por `.env`: `DATABASE_URL_ATLAS`, `PORT`, `JWT_SECRET`. Opcionales: `LOGIN_RATE_LIMIT_MAX` (5)
  y `LOGIN_RATE_LIMIT_WINDOW_MS` (900000). Nunca commitear `.env`.

## Estado actual (no romper más)

- Migración sin commit: módulos viejos eliminados del working tree, `src/modules/` aún untracked.
- Seeds en `src/seed/` apuntan a modelos movidos/borrados — arreglarlos solo como tarea explícita.
- ESLint no operativo: `eslint.config.mjs` usa plugins ausentes de `package.json`.
- La credencial heredada `authorization: token123` fue retirada: crear o cancelar turnos exige JWT con
  rol `admin` o `recepcionista`.
- Autorización por roles aplicada en cada router (ver comentarios de las rutas). `Usuario.medico` es una
  referencia opcional y única a `Medico`, válida solo para usuarios con rol `medico`.

## Reglas de trabajo

1. **Solo español en los cambios**: código, mensajes y commits.
2. **Seguir el patrón de módulos**: todo feature nuevo vive en `src/modules/<dominio>/` con las capas
   `models/`, `interfaces/`, `dtos/`, `request/`, `services/`, `controllers/`, `routes/` y la cadena
   route → controller → service → model descrita arriba.
3. **Priorizar la migración a TypeScript**: el código nuevo siempre en `.ts`; no editar los `.js`
   heredados salvo que se pida explícitamente (migrarlos cuenta como operación de migración).
