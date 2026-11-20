"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../models/Medico"));
const Especialidad_1 = __importDefault(require("../../especialidad/models/Especialidad"));
const crearError = (mensaje, statusCode = 400) => Object.assign(new Error(mensaje), { statusCode });
// ============================================================
// ESPECIALIDADES DEL MÉDICO
//
// `especialidades` es la única fuente de verdad. Se valida formato,
// ausencia de duplicados y vigencia de cada referencia.
// ============================================================
const validarEspecialidades = async (especialidades) => {
    if (!Array.isArray(especialidades) ||
        especialidades.length === 0) {
        throw crearError('El médico debe tener al menos una especialidad');
    }
    const ids = [];
    for (const valor of especialidades) {
        if (typeof valor !== 'string' ||
            !mongoose_1.default.Types.ObjectId.isValid(valor)) {
            throw crearError('El ID de una de las especialidades no es válido');
        }
        if (ids.includes(valor)) {
            throw crearError('No se puede repetir la misma especialidad');
        }
        ids.push(valor);
    }
    const encontradas = await Especialidad_1.default.find({
        _id: { $in: ids },
    }).select('_id activo');
    const existentes = new Set(encontradas.map((especialidad) => String(especialidad._id)));
    const inactivas = new Set(encontradas
        .filter((especialidad) => !especialidad.activo)
        .map((especialidad) => String(especialidad._id)));
    for (const id of ids) {
        if (!existentes.has(id)) {
            throw crearError('Una de las especialidades indicadas no existe');
        }
        if (inactivas.has(id)) {
            throw crearError('Una de las especialidades indicadas no está activa');
        }
    }
    return ids;
};
class MedicoService {
    // ============================================================
    // OBTENER MÉDICOS
    // ============================================================
    async getMedicos(filtro) {
        const { nombre, apellido, matricula, especialidad, email, activo, } = filtro;
        const filtroMongo = {};
        if (nombre) {
            filtroMongo.nombre = {
                $regex: nombre,
                $options: 'i',
            };
        }
        if (apellido) {
            filtroMongo.apellido = {
                $regex: apellido,
                $options: 'i',
            };
        }
        if (matricula) {
            filtroMongo.matricula = matricula;
        }
        if (especialidad) {
            if (!mongoose_1.default.Types.ObjectId.isValid(especialidad)) {
                throw new Error('El ID de la especialidad no es válido');
            }
            // Coincidencia por pertenencia: Mongo evalúa cada
            // elemento del array multikey.
            filtroMongo.especialidades = especialidad;
        }
        if (email) {
            filtroMongo.email = {
                $regex: email,
                $options: 'i',
            };
        }
        if (activo !== undefined) {
            filtroMongo.activo = activo === 'true';
        }
        return await Medico_1.default.find(filtroMongo)
            .populate('especialidades')
            .populate('consultorios');
    }
    // ============================================================
    // MÉDICOS DISPONIBLES PARA EL PORTAL DE PACIENTES
    //
    // Solo médicos activos de una especialidad activa. La proyección
    // excluye email, teléfono, consultorios y horarios completos.
    // ============================================================
    async getMedicosDisponibles(especialidadId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(especialidadId)) {
            throw new Error('El ID de la especialidad no es válido');
        }
        const especialidadActiva = await Especialidad_1.default.findOne({
            _id: especialidadId,
            activo: true,
        }).select('_id');
        if (!especialidadActiva) {
            const especialidadExiste = await Especialidad_1.default.exists({
                _id: especialidadId,
            });
            if (!especialidadExiste) {
                throw new Error('La especialidad indicada no existe');
            }
            throw new Error('La especialidad no está activa');
        }
        // Coincidencia por pertenencia: cualquier especialidad del
        // array, no solo la primera.
        return await Medico_1.default.find({
            especialidades: especialidadId,
            activo: true,
        })
            .select('nombre apellido matricula especialidades duracionTurno')
            .populate('especialidades', 'nombre');
    }
    // ============================================================
    // CREAR MÉDICO
    // ============================================================
    async createMedico(datos) {
        const especialidades = await validarEspecialidades(datos.especialidades);
        if (datos.consultorios) {
            for (const consultorioId of datos.consultorios) {
                if (!mongoose_1.default.Types.ObjectId.isValid(consultorioId)) {
                    throw new Error('Uno de los IDs de los consultorios no es válido');
                }
            }
        }
        return await Medico_1.default.create({
            ...datos,
            especialidades,
        });
    }
    // ============================================================
    // ACTUALIZAR MÉDICO
    // ============================================================
    async updateMedico(id, datos) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del médico no es válido');
        }
        const medico = await Medico_1.default.findById(id);
        if (!medico) {
            throw new Error('Médico no encontrado');
        }
        if (datos.especialidades !== undefined) {
            datos.especialidades = await validarEspecialidades(datos.especialidades);
        }
        if (datos.consultorios) {
            for (const consultorioId of datos.consultorios) {
                if (!mongoose_1.default.Types.ObjectId.isValid(consultorioId)) {
                    throw new Error('Uno de los IDs de los consultorios no es válido');
                }
            }
        }
        return await Medico_1.default.findByIdAndUpdate(id, datos, {
            new: true,
            runValidators: true,
        });
    }
    // ============================================================
    // ACTIVAR / DESACTIVAR
    // ============================================================
    async toggleActivoMedico(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del médico no es válido');
        }
        const medico = await Medico_1.default.findById(id);
        if (!medico) {
            throw new Error('Médico no encontrado');
        }
        medico.activo = !medico.activo;
        await medico.save();
        return medico;
    }
    // ============================================================
    // ELIMINAR PERMANENTEMENTE
    // ============================================================
    async deleteMedicoPermanente(id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('El ID del médico no es válido');
        }
        const medico = await Medico_1.default.findById(id);
        if (!medico) {
            throw new Error('Médico no encontrado');
        }
        await Medico_1.default.findByIdAndDelete(id);
        return medico;
    }
}
exports.default = new MedicoService();
