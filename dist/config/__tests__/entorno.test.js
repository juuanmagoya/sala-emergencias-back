"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const entorno_1 = require("../entorno");
const ErrorConfiguracion_1 = __importDefault(require("../../utils/ErrorConfiguracion"));
// ============================================================
// PRESERVACIÓN DEL ENTORNO
// ============================================================
const VARIABLES = [
    'JWT_SECRET',
    'DATABASE_URL_ATLAS',
    'PORT',
    'LOGIN_RATE_LIMIT_MAX',
    'LOGIN_RATE_LIMIT_WINDOW_MS',
    'ZONA_HORARIA',
];
const entornoOriginal = new Map(VARIABLES.map((variable) => [variable, process.env[variable]]));
(0, node_test_1.afterEach)(() => {
    for (const variable of VARIABLES) {
        const valor = entornoOriginal.get(variable);
        if (valor === undefined) {
            delete process.env[variable];
            continue;
        }
        process.env[variable] = valor;
    }
});
const configurarEntornoValido = () => {
    process.env.JWT_SECRET = 'secreto-de-prueba';
    process.env.DATABASE_URL_ATLAS = 'mongodb://localhost/prueba';
    delete process.env.PORT;
    delete process.env.LOGIN_RATE_LIMIT_MAX;
    delete process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    delete process.env.ZONA_HORARIA;
};
// ============================================================
// VALIDACIÓN AL INICIAR
// ============================================================
(0, node_test_1.test)('acepta una configuración válida y aplica valores por defecto', () => {
    configurarEntornoValido();
    const configuracion = (0, entorno_1.validarConfiguracion)();
    strict_1.default.equal(configuracion.puerto, 3000);
    strict_1.default.equal(configuracion.limiteIntentosLogin, entorno_1.LIMITE_LOGIN_POR_DEFECTO);
    strict_1.default.equal(configuracion.ventanaLimiteLoginMs, entorno_1.VENTANA_LOGIN_POR_DEFECTO_MS);
    strict_1.default.equal(configuracion.zonaHoraria, entorno_1.ZONA_HORARIA_POR_DEFECTO);
});
(0, node_test_1.test)('falla de forma explícita si falta JWT_SECRET', () => {
    configurarEntornoValido();
    delete process.env.JWT_SECRET;
    strict_1.default.throws(() => (0, entorno_1.validarConfiguracion)(), (error) => {
        strict_1.default.ok(error instanceof ErrorConfiguracion_1.default);
        return true;
    });
});
(0, node_test_1.test)('falla si el límite de login no es un entero positivo', () => {
    configurarEntornoValido();
    process.env.LOGIN_RATE_LIMIT_MAX = '0';
    strict_1.default.throws(() => (0, entorno_1.validarConfiguracion)(), (error) => {
        strict_1.default.ok(error instanceof ErrorConfiguracion_1.default);
        strict_1.default.match(error.message, /LOGIN_RATE_LIMIT_MAX/);
        return true;
    });
});
(0, node_test_1.test)('respeta los valores configurados por entorno', () => {
    configurarEntornoValido();
    process.env.PORT = '4100';
    process.env.LOGIN_RATE_LIMIT_MAX = '3';
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000';
    process.env.ZONA_HORARIA = 'America/Argentina/Cordoba';
    const configuracion = (0, entorno_1.validarConfiguracion)();
    strict_1.default.equal(configuracion.puerto, 4100);
    strict_1.default.equal(configuracion.limiteIntentosLogin, 3);
    strict_1.default.equal(configuracion.ventanaLimiteLoginMs, 60000);
    strict_1.default.equal(configuracion.zonaHoraria, 'America/Argentina/Cordoba');
});
(0, node_test_1.test)('falla si la zona horaria configurada no es válida', () => {
    configurarEntornoValido();
    process.env.ZONA_HORARIA = 'Zona/Inexistente';
    strict_1.default.throws(() => (0, entorno_1.validarConfiguracion)(), (error) => {
        strict_1.default.ok(error instanceof ErrorConfiguracion_1.default);
        strict_1.default.match(error.message, /ZONA_HORARIA/);
        return true;
    });
});
