"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.desactivarUsuario = exports.updateUsuario = exports.createUsuario = exports.getUsuarioById = exports.getUsuarios = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const usuario_service_1 = __importDefault(require("../services/usuario.service"));
const responderErrorUsuario = (res, error, mensajeGeneral) => {
    const errorTipado = error;
    if (errorTipado?.name === 'ValidationError') {
        const errores = Object.values(errorTipado.errors ?? {}).map((detalle) => detalle.message);
        return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
    }
    if (errorTipado?.name === 'CastError') {
        return (0, respuestaEstandar_1.default)(res, 400, false, 'Identificador inválido');
    }
    if (errorTipado?.code === 11000) {
        const campo = errorTipado.keyPattern
            ? Object.keys(errorTipado.keyPattern)[0]
            : undefined;
        const mensaje = campo === 'email'
            ? 'El email ya está registrado'
            : campo === 'medico'
                ? 'El médico ya está asociado a otro usuario'
                : 'Ya existe un registro con esos datos';
        return (0, respuestaEstandar_1.default)(res, 409, false, mensaje);
    }
    if (typeof errorTipado?.statusCode === 'number') {
        return (0, respuestaEstandar_1.default)(res, errorTipado.statusCode, false, errorTipado.message ?? mensajeGeneral);
    }
    console.error(`🔴 ${mensajeGeneral}:`, error);
    return (0, respuestaEstandar_1.default)(res, 500, false, mensajeGeneral);
};
// ============================================================
// LISTAR USUARIOS
// ============================================================
const getUsuarios = async (req, res) => {
    try {
        const usuarios = await usuario_service_1.default.getUsuarios(req.query);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Usuarios obtenidos exitosamente', usuarios);
    }
    catch (error) {
        return responderErrorUsuario(res, error, 'Error al obtener los usuarios');
    }
};
exports.getUsuarios = getUsuarios;
// ============================================================
// OBTENER USUARIO POR ID
// ============================================================
const getUsuarioById = async (req, res) => {
    try {
        const usuario = await usuario_service_1.default.getUsuarioById(req.params.id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Usuario obtenido exitosamente', usuario);
    }
    catch (error) {
        return responderErrorUsuario(res, error, 'Error al obtener el usuario');
    }
};
exports.getUsuarioById = getUsuarioById;
// ============================================================
// CREAR USUARIO
// ============================================================
const createUsuario = async (req, res) => {
    try {
        const usuario = await usuario_service_1.default.createUsuario(req.body);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Usuario creado exitosamente', usuario);
    }
    catch (error) {
        return responderErrorUsuario(res, error, 'Error al crear el usuario');
    }
};
exports.createUsuario = createUsuario;
// ============================================================
// ACTUALIZAR USUARIO
// ============================================================
const updateUsuario = async (req, res) => {
    try {
        const usuario = await usuario_service_1.default.updateUsuario(req.params.id, req.body);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Usuario actualizado exitosamente', usuario);
    }
    catch (error) {
        return responderErrorUsuario(res, error, 'Error al actualizar el usuario');
    }
};
exports.updateUsuario = updateUsuario;
// ============================================================
// DESACTIVAR USUARIO
// ============================================================
const desactivarUsuario = async (req, res) => {
    try {
        const usuario = await usuario_service_1.default.desactivarUsuario(req.params.id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Usuario desactivado exitosamente', usuario);
    }
    catch (error) {
        return responderErrorUsuario(res, error, 'Error al desactivar el usuario');
    }
};
exports.desactivarUsuario = desactivarUsuario;
