"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearLimitadorLogin = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const entorno_1 = require("../config/entorno");
const respuestaEstandar_1 = __importDefault(require("../utils/respuestaEstandar"));
// Limitador de intentos de login.
//
// Los inicios de sesión exitosos no consumen cuota: solo cuentan los intentos
// fallidos. La clave por defecto es la IP del cliente.
//
// Limitación conocida: el almacenamiento por defecto vive en memoria y es
// propio de cada proceso. Con varias instancias o un balanceador de carga, el
// límite efectivo se multiplica por la cantidad de instancias y se reinicia al
// reiniciar el proceso. Para producción distribuida hace falta un store
// compartido (por ejemplo Redis). Además, si la aplicación corre detrás de un
// proxy, hay que configurar `trust proxy` para que la IP sea la real.
const crearLimitadorLogin = ({ limite, ventanaMs, }) => (0, express_rate_limit_1.default)({
    windowMs: ventanaMs,
    limit: limite,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, res) => (0, respuestaEstandar_1.default)(res, 429, false, 'Demasiados intentos de inicio de sesión. Intentá nuevamente más tarde.'),
});
exports.crearLimitadorLogin = crearLimitadorLogin;
const limitadorLogin = (0, exports.crearLimitadorLogin)({
    limite: (0, entorno_1.leerEnteroPositivo)(process.env.LOGIN_RATE_LIMIT_MAX, entorno_1.LIMITE_LOGIN_POR_DEFECTO),
    ventanaMs: (0, entorno_1.leerEnteroPositivo)(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, entorno_1.VENTANA_LOGIN_POR_DEFECTO_MS),
});
exports.default = limitadorLogin;
