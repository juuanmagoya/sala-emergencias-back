"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const respuestaEstandar_js_1 = __importDefault(require("../utils/respuestaEstandar.js"));
// Middleware reutilizable de autorización por roles.
// Debe montarse siempre después de authMiddleware.
const autorizarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (rolesPermitidos.length === 0) {
            console.error('ERROR AUTORIZACIÓN: la ruta no definió roles permitidos');
            return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error interno del servidor');
        }
        // No se asume autenticación: si el middleware de auth no corrió antes,
        // la solicitud se rechaza con 401.
        const usuario = req.usuario;
        if (!usuario) {
            return (0, respuestaEstandar_js_1.default)(res, 401, false, 'No se proporcionó un token de autenticación');
        }
        // El rol proviene del JWT firmado, nunca del cuerpo o los query params.
        if (!rolesPermitidos.includes(usuario.rol)) {
            return (0, respuestaEstandar_js_1.default)(res, 403, false, 'No tenés permisos para acceder a este recurso');
        }
        return next();
    };
};
exports.default = autorizarRoles;
