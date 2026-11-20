"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Paciente_1 = __importDefault(require("../models/Paciente"));
const Turno_1 = __importDefault(require("../../turnos/models/Turno"));
class PacienteService {
    // ============================================================
    // OBTENER PACIENTES
    // ============================================================
    async getPacientes(filtro) {
        const { obraSocial, dni } = filtro;
        const filtroMongo = {};
        if (obraSocial) {
            filtroMongo['obraSocial.nombre'] = obraSocial.toUpperCase();
        }
        if (dni) {
            filtroMongo.dni = dni;
        }
        const pacientes = await Paciente_1.default.find(filtroMongo);
        return pacientes;
    }
    // ============================================================
    // CREAR PACIENTE
    // ============================================================
    async createPaciente(datos) {
        return await Paciente_1.default.create(datos);
    }
    // ============================================================
    // ACTUALIZAR PACIENTE
    // ============================================================
    async updatePaciente(id, datos) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del paciente no es válido');
        }
        const paciente = await Paciente_1.default.findById(id);
        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }
        // Verificar duplicados (DNI o email) si se están actualizando
        const { dni, email } = datos;
        if (dni || email) {
            const condicionesDuplicado = [];
            if (dni) {
                condicionesDuplicado.push({ dni });
            }
            if (email) {
                condicionesDuplicado.push({ email });
            }
            const duplicado = await Paciente_1.default.findOne({
                $or: condicionesDuplicado,
                _id: { $ne: id },
            });
            if (duplicado) {
                if (dni && duplicado.dni === dni) {
                    throw new Error('Ya existe otro paciente con ese DNI');
                }
                if (email && duplicado.email === email) {
                    throw new Error('Ya existe otro paciente con ese email');
                }
                throw new Error('Ya existe otro paciente con esos datos');
            }
        }
        return await Paciente_1.default.findByIdAndUpdate(id, datos, {
            new: true,
            runValidators: true,
        });
    }
    // ============================================================
    // ELIMINAR PACIENTE
    // ============================================================
    async deletePaciente(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del paciente no es válido');
        }
        const paciente = await Paciente_1.default.findById(id);
        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }
        // Validar que no tenga turnos activos asociados
        const turnoUsando = await Turno_1.default.findOne({
            paciente: id,
            activo: true,
        });
        if (turnoUsando) {
            throw new Error('No se puede eliminar el paciente porque tiene uno o más turnos activos');
        }
        await Paciente_1.default.findByIdAndDelete(id);
        return paciente;
    }
}
exports.default = new PacienteService();
