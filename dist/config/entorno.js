"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarConfiguracion = exports.leerZonaHoraria = exports.leerEnteroPositivo = exports.ZONA_HORARIA_POR_DEFECTO = exports.VENTANA_LOGIN_POR_DEFECTO_MS = exports.LIMITE_LOGIN_POR_DEFECTO = void 0;
const ErrorConfiguracion_1 = __importDefault(require("../utils/ErrorConfiguracion"));
const fechaHora_1 = require("../utils/fechaHora");
exports.LIMITE_LOGIN_POR_DEFECTO = 5;
exports.VENTANA_LOGIN_POR_DEFECTO_MS = 15 * 60 * 1000;
// Los turnos se interpretan en la hora local del centro médico. Argentina
// no aplica horario de verano, pero se usa la zona IANA para no depender de
// la zona horaria de la máquina donde corre Node.js.
exports.ZONA_HORARIA_POR_DEFECTO = 'America/Argentina/Buenos_Aires';
// Lee un entero positivo y, si falta o es inválido, devuelve el valor por
// defecto. validarConfiguracion() se encarga de rechazar valores inválidos
// al arrancar la aplicación.
const leerEnteroPositivo = (valor, porDefecto) => {
    if (valor === undefined || valor.trim() === '') {
        return porDefecto;
    }
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0
        ? numero
        : porDefecto;
};
exports.leerEnteroPositivo = leerEnteroPositivo;
const validarEnteroPositivo = (nombre, valor) => {
    if (valor === undefined || valor.trim() === '') {
        return;
    }
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0) {
        throw new ErrorConfiguracion_1.default(`La variable ${nombre} debe ser un número entero positivo`);
    }
};
const leerZonaHoraria = () => process.env.ZONA_HORARIA?.trim() || exports.ZONA_HORARIA_POR_DEFECTO;
exports.leerZonaHoraria = leerZonaHoraria;
// Valida la configuración mínima al iniciar el servidor. No expone valores.
const validarConfiguracion = () => {
    if (!process.env.JWT_SECRET?.trim()) {
        throw new ErrorConfiguracion_1.default('Falta configurar JWT_SECRET');
    }
    if (!process.env.DATABASE_URL_ATLAS?.trim()) {
        throw new ErrorConfiguracion_1.default('Falta configurar DATABASE_URL_ATLAS');
    }
    validarEnteroPositivo('PORT', process.env.PORT);
    validarEnteroPositivo('LOGIN_RATE_LIMIT_MAX', process.env.LOGIN_RATE_LIMIT_MAX);
    validarEnteroPositivo('LOGIN_RATE_LIMIT_WINDOW_MS', process.env.LOGIN_RATE_LIMIT_WINDOW_MS);
    const zonaHoraria = (0, exports.leerZonaHoraria)();
    if (!(0, fechaHora_1.esZonaHorariaValida)(zonaHoraria)) {
        throw new ErrorConfiguracion_1.default('La variable ZONA_HORARIA no es una zona horaria válida');
    }
    return {
        puerto: (0, exports.leerEnteroPositivo)(process.env.PORT, 3000),
        limiteIntentosLogin: (0, exports.leerEnteroPositivo)(process.env.LOGIN_RATE_LIMIT_MAX, exports.LIMITE_LOGIN_POR_DEFECTO),
        ventanaLimiteLoginMs: (0, exports.leerEnteroPositivo)(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, exports.VENTANA_LOGIN_POR_DEFECTO_MS),
        zonaHoraria,
    };
};
exports.validarConfiguracion = validarConfiguracion;
