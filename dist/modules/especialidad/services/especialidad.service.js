"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Especialidad_1 = __importDefault(require("../models/Especialidad"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Consultorio_1 = __importDefault(require("../../consultorio/models/Consultorio"));
const Turno_1 = __importDefault(require("../../turnos/models/Turno"));
class EspecialidadService {
    async getEspecialidades(filtro) {
        const { nombre, codigo, id, activo } = filtro;
        const filtroMongo = {};
        if (id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw new Error('El ID de la especialidad no es válido');
            }
            filtroMongo._id = id;
        }
        if (nombre) {
            filtroMongo.nombre = {
                $regex: nombre.toUpperCase(),
                $options: 'i',
            };
        }
        if (codigo) {
            filtroMongo.codigo = codigo.toUpperCase();
        }
        if (activo !== undefined) {
            filtroMongo.activo = activo === 'true';
        }
        const especialidades = await Especialidad_1.default.find(filtroMongo);
        if (id && especialidades.length === 0) {
            throw new Error('Especialidad no encontrada');
        }
        return especialidades;
    }
    // ============================================================
    // ESPECIALIDADES DISPONIBLES PARA EL PORTAL DE PACIENTES
    //
    // El filtro por `activo: true` se aplica siempre en el servidor.
    // La proyección excluye campos administrativos.
    // ============================================================
    async getEspecialidadesDisponibles() {
        return await Especialidad_1.default.find({ activo: true })
            .select('nombre descripcion codigo')
            .sort({ nombre: 1 });
    }
    async createEspecialidad(datos) {
        return await Especialidad_1.default.create(datos);
    }
    async updateEspecialidad(id, datos) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la especialidad no es válido');
        }
        const especialidad = await Especialidad_1.default.findOne({
            _id: id,
            activo: true,
        });
        if (!especialidad) {
            throw new Error('Especialidad no encontrada o está inactiva');
        }
        if (datos.nombre || datos.codigo) {
            const condicionesDuplicado = [];
            if (datos.nombre) {
                condicionesDuplicado.push({
                    nombre: datos.nombre.toUpperCase(),
                });
            }
            if (datos.codigo) {
                condicionesDuplicado.push({
                    codigo: datos.codigo.toUpperCase(),
                });
            }
            const duplicado = await Especialidad_1.default.findOne({
                $or: condicionesDuplicado,
                _id: { $ne: id },
            });
            if (duplicado) {
                if (datos.nombre &&
                    duplicado.nombre === datos.nombre.toUpperCase()) {
                    throw new Error('Ya existe una especialidad con ese nombre');
                }
                if (datos.codigo &&
                    duplicado.codigo === datos.codigo.toUpperCase()) {
                    throw new Error('Ya existe una especialidad con ese código');
                }
                throw new Error('Ya existe una especialidad con esos datos');
            }
        }
        return await Especialidad_1.default.findByIdAndUpdate(id, datos, {
            new: true,
            runValidators: true,
        });
    }
    async toggleActivoEspecialidad(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la especialidad no es válido');
        }
        const especialidad = await Especialidad_1.default.findById(id);
        if (!especialidad) {
            throw new Error('Especialidad no encontrada');
        }
        // Si está activa, verificamos que no esté siendo utilizada
        // antes de desactivarla.
        if (especialidad.activo) {
            // Se detecta el uso en cualquier posición del array.
            const medicoUsando = await Medico_1.default.findOne({
                especialidades: id,
                activo: true,
            });
            if (medicoUsando) {
                throw new Error('No se puede desactivar la especialidad porque está siendo utilizada por uno o más médicos activos');
            }
            const consultorioUsando = await Consultorio_1.default.findOne({
                especialidades: id,
                activo: true,
            });
            if (consultorioUsando) {
                throw new Error('No se puede desactivar la especialidad porque está siendo utilizada por uno o más consultorios activos');
            }
            const turnoUsando = await Turno_1.default.findOne({
                especialidad: id,
                activo: true,
            });
            if (turnoUsando) {
                throw new Error('No se puede desactivar la especialidad porque está siendo utilizada por uno o más turnos activos');
            }
        }
        especialidad.activo = !especialidad.activo;
        await especialidad.save();
        return {
            especialidad,
            mensaje: especialidad.activo
                ? 'Especialidad activada correctamente'
                : 'Especialidad desactivada correctamente',
        };
    }
    async deleteEspecialidadPermanente(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la especialidad no es válido');
        }
        const especialidad = await Especialidad_1.default.findById(id);
        if (!especialidad) {
            throw new Error('Especialidad no encontrada');
        }
        const medicoUsando = await Medico_1.default.findOne({
            especialidades: id,
            activo: true,
        });
        if (medicoUsando) {
            throw new Error('No se puede eliminar la especialidad porque está siendo utilizada por uno o más médicos activos');
        }
        const consultorioUsando = await Consultorio_1.default.findOne({
            especialidades: id,
            activo: true,
        });
        if (consultorioUsando) {
            throw new Error('No se puede eliminar la especialidad porque está siendo utilizada por uno o más consultorios activos');
        }
        const turnoUsando = await Turno_1.default.findOne({
            especialidad: id,
            activo: true,
        });
        if (turnoUsando) {
            throw new Error('No se puede eliminar la especialidad porque está siendo utilizada por uno o más turnos activos');
        }
        await Especialidad_1.default.findByIdAndDelete(id);
        return especialidad;
    }
}
exports.default = new EspecialidadService();
