"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginPaciente = exports.login = void 0;
const auth_service_js_1 = require("../services/auth.service.js");
const ErrorConfiguracion_js_1 = __importDefault(require("../utils/ErrorConfiguracion.js"));
const respuestaEstandar_js_1 = __importDefault(require("../utils/respuestaEstandar.js"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, 'Email y password son obligatorios');
        }
        const resultado = await (0, auth_service_js_1.loginUsuario)({
            email,
            password,
        });
        return (0, respuestaEstandar_js_1.default)(res, 200, true, 'Login exitoso', resultado);
    }
    catch (error) {
        // Un secreto faltante o inválido es un problema de configuración del
        // servidor: se responde 500 sin exponer detalles internos.
        if (error instanceof ErrorConfiguracion_js_1.default) {
            console.error('🔴 Error de configuración al iniciar sesión:', error.message);
            return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error interno del servidor');
        }
        const mensaje = error instanceof Error
            ? error.message
            : 'Error al iniciar sesión';
        return (0, respuestaEstandar_js_1.default)(res, 401, false, mensaje);
    }
};
exports.login = login;
const loginPaciente = async (req, res) => {
    try {
        const { dni, telefono } = req.body;
        if (!dni || !telefono) {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, 'DNI y teléfono son obligatorios');
        }
        const resultado = await (0, auth_service_js_1.loginPaciente)({
            dni,
            telefono,
        });
        return (0, respuestaEstandar_js_1.default)(res, 200, true, 'Login de paciente exitoso', resultado);
    }
    catch (error) {
        if (error instanceof ErrorConfiguracion_js_1.default) {
            console.error('🔴 Error de configuración al iniciar sesión de paciente');
            return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error interno del servidor');
        }
        const errorConEstado = error;
        if (typeof errorConEstado.statusCode === 'number') {
            return (0, respuestaEstandar_js_1.default)(res, errorConEstado.statusCode, false, errorConEstado.message ??
                'Error al iniciar sesión de paciente');
        }
        // No se registra el error completo: podría contener datos de entrada.
        console.error('🔴 Error al iniciar sesión de paciente');
        return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error interno del servidor');
    }
};
exports.loginPaciente = loginPaciente;
