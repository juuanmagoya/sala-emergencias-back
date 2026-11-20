"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaciente = exports.updatePaciente = exports.createPaciente = exports.getPacientes = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const paciente_service_1 = __importDefault(require("../services/paciente.service"));
// ============================================================
// OBTENER PACIENTES
// ============================================================
const getPacientes = async (req, res) => {
    try {
        const pacientes = await paciente_service_1.default.getPacientes(req.query);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Pacientes obtenidos exitosamente', pacientes);
    }
    catch (error) {
        console.error('🔴 Error al obtener pacientes:', error);
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al obtener los pacientes', error.message);
    }
};
exports.getPacientes = getPacientes;
// ============================================================
// CREAR PACIENTE
// ============================================================
const createPaciente = async (req, res) => {
    try {
        const nuevoPaciente = await paciente_service_1.default.createPaciente(req.body);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Paciente creado exitosamente', nuevoPaciente);
    }
    catch (error) {
        console.error('🔴 ERROR AL CREAR PACIENTE:', error);
        // Error de validación de Mongoose
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
        }
        // Error de duplicado (MongoDB 11000)
        if (error.code === 11000) {
            const campoDuplicado = Object.keys(error.keyPattern)[0];
            if (campoDuplicado === 'email') {
                return (0, respuestaEstandar_1.default)(res, 400, false, 'El correo electrónico ya está registrado', 'Ya existe un paciente registrado con ese correo electrónico');
            }
            if (campoDuplicado === 'dni') {
                return (0, respuestaEstandar_1.default)(res, 400, false, 'El DNI ya está registrado', 'Ya existe un paciente registrado con ese DNI');
            }
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Dato duplicado', 'Ya existe un paciente con uno de los datos ingresados');
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al crear el paciente', error.message);
    }
};
exports.createPaciente = createPaciente;
// ============================================================
// ACTUALIZAR PACIENTE
// ============================================================
const updatePaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const pacienteActualizado = await paciente_service_1.default.updatePaciente(id, req.body);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Paciente actualizado exitosamente', pacienteActualizado);
    }
    catch (error) {
        console.error('🔴 Error al actualizar paciente:', error);
        if (error.message === 'El ID del paciente no es válido') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'ID de paciente inválido');
        }
        if (error.message === 'Paciente no encontrado') {
            return (0, respuestaEstandar_1.default)(res, 404, false, 'Paciente no encontrado');
        }
        if (error.message === 'Ya existe otro paciente con ese DNI') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Ya existe otro paciente con ese DNI');
        }
        if (error.message === 'Ya existe otro paciente con ese email') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Ya existe otro paciente con ese email');
        }
        if (error.message === 'Ya existe otro paciente con esos datos') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Ya existe otro paciente con esos datos');
        }
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
        }
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return (0, respuestaEstandar_1.default)(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al actualizar el paciente', error.message);
    }
};
exports.updatePaciente = updatePaciente;
// ============================================================
// ELIMINAR PACIENTE
// ============================================================
const deletePaciente = async (req, res) => {
    try {
        const { id } = req.params;
        await paciente_service_1.default.deletePaciente(id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Paciente eliminado correctamente');
    }
    catch (error) {
        console.error('🔴 Error al eliminar paciente:', error);
        if (error.message === 'El ID del paciente no es válido') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'ID de paciente inválido');
        }
        if (error.message === 'Paciente no encontrado') {
            return (0, respuestaEstandar_1.default)(res, 404, false, 'Paciente no encontrado');
        }
        if (error.message.includes('No se puede eliminar el paciente')) {
            return (0, respuestaEstandar_1.default)(res, 400, false, error.message);
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al eliminar el paciente', error.message);
    }
};
exports.deletePaciente = deletePaciente;
