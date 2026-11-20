"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const Paciente_js_1 = __importDefault(require("../modules/pacientes/models/Paciente.js"));
const usuario_types_js_1 = require("../modules/usuario/types/usuario.types.js");
const respuestaEstandar_js_1 = __importDefault(require("../utils/respuestaEstandar.js"));
// Valida el contenido real del token antes de confiar en él.
const construirIdentidadAutenticada = async (decoded) => {
    if (typeof decoded === 'string') {
        return null;
    }
    const { id, email, rol, medico, tipo } = decoded;
    if (typeof id !== 'string') {
        return null;
    }
    // Token de paciente: se valida contra la colección Paciente, nunca
    // contra Usuario.
    if (tipo === 'paciente') {
        if (rol !== usuario_types_js_1.ROL_PACIENTE) {
            return null;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return null;
        }
        // Paciente no tiene baja lógica en el modelo actual. La existencia
        // es la comprobación de validez; si se agrega `activo`, debe
        // evaluarse acá.
        const pacienteExiste = await Paciente_js_1.default.exists({ _id: id });
        if (!pacienteExiste) {
            return null;
        }
        return {
            tipo: 'paciente',
            id,
            rol: usuario_types_js_1.ROL_PACIENTE,
        };
    }
    // Tokens internos: los emitidos antes de incorporar `tipo` se aceptan
    // como usuarios para no invalidar sesiones vigentes.
    if (tipo !== undefined && tipo !== 'usuario') {
        return null;
    }
    if (!(0, usuario_types_js_1.esRolUsuario)(rol)) {
        return null;
    }
    if (typeof email !== 'string') {
        return null;
    }
    if (medico !== undefined && typeof medico !== 'string') {
        return null;
    }
    const usuario = {
        tipo: 'usuario',
        id,
        email,
        rol,
        medico,
    };
    return usuario;
};
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        (0, respuestaEstandar_js_1.default)(res, 401, false, 'No se proporcionó un token de autenticación');
        return;
    }
    const [tipoEncabezado, token] = authHeader.split(' ');
    if (tipoEncabezado !== 'Bearer' || !token) {
        (0, respuestaEstandar_js_1.default)(res, 401, false, 'Formato de token inválido');
        return;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('ERROR AUTH: JWT_SECRET no está configurado');
        (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error interno del servidor');
        return;
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, jwtSecret, {
            algorithms: ['HS256'],
        });
    }
    catch (error) {
        console.error('ERROR AUTH:', error);
        (0, respuestaEstandar_js_1.default)(res, 401, false, 'Token inválido o expirado');
        return;
    }
    let identidad;
    try {
        identidad = await construirIdentidadAutenticada(decoded);
    }
    catch {
        // No se registra el error completo para no filtrar datos internos.
        console.error('ERROR AUTH: no se pudo validar la identidad');
        (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error interno del servidor');
        return;
    }
    if (!identidad) {
        (0, respuestaEstandar_js_1.default)(res, 401, false, 'Token inválido o expirado');
        return;
    }
    req.usuario = identidad;
    next();
};
exports.default = authMiddleware;
