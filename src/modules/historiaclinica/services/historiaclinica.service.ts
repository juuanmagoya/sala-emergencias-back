import mongoose from 'mongoose';

import HistoriaClinicaModel from '../models/HistoriaClinica';

import type { ActualizarHistoriaClinicaDTO } from '../dtos/ActualizarHistoriaClinicaDTO';
import type { CrearHistoriaClinicaDTO } from '../dtos/CrearHistoriaClinicaDTO';
import type {
    EstadoHistoriaClinica,
    TipoAtencion,
} from '../interfaces/HistoriaClinica.interface';

const ESTADOS_VALIDOS: EstadoHistoriaClinica[] = [
    'EN_ATENCION',
    'FINALIZADA',
    'OBSERVACION',
];

const TIPOS_ATENCION_VALIDOS: TipoAtencion[] = [
    'URGENCIA',
    'CONSULTA_GENERAL',
    'CONTROL',
    'EMERGENCIA',
];

class HistoriaClinicaService {
    // ============================================================
    // OBTENER HISTORIAS CLÍNICAS (con filtros opcionales)
    // ============================================================

    async getHistoriasClinicas(filtro: {
        paciente?: string;
        estado?: string;
        tipoAtencion?: string;
    }) {
        const { paciente, estado, tipoAtencion } = filtro;

        const filtroMongo: Record<string, any> = { activo: true };

        // Filtrar por paciente (el más importante)
        if (paciente) {
            if (!mongoose.Types.ObjectId.isValid(paciente)) {
                throw new Error('El ID del paciente no es válido');
            }

            filtroMongo.paciente = paciente;
        }

        // Filtrar por estado
        if (estado) {
            if (!ESTADOS_VALIDOS.includes(estado as EstadoHistoriaClinica)) {
                throw new Error(
                    'Estado inválido. Opciones: EN_ATENCION, FINALIZADA, OBSERVACION'
                );
            }

            filtroMongo.estado = estado;
        }

        // Filtrar por tipo de atención
        if (tipoAtencion) {
            if (!TIPOS_ATENCION_VALIDOS.includes(tipoAtencion as TipoAtencion)) {
                throw new Error('Tipo de atención inválido');
            }

            filtroMongo.tipoAtencion = tipoAtencion;
        }

        console.log('🟢 Filtro historias clínicas:', filtroMongo);

        const historias = await HistoriaClinicaModel.find(filtroMongo)
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula')
            .sort({ fechaAtencion: -1 }); // Ordenar por fecha (más reciente primero)

        return historias;
    }

    // ============================================================
    // OBTENER HISTORIA CLÍNICA POR ID
    // ============================================================

    async getHistoriaClinicaById(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la historia clínica no es válido');
        }

        const historia = await HistoriaClinicaModel.findOne({ _id: id, activo: true })
            .populate('paciente', 'nombre dni email telefono')
            .populate('medico', 'nombre apellido matricula especialidad');

        if (!historia) {
            throw new Error('Historia clínica no encontrada');
        }

        return historia;
    }

    // ============================================================
    // CREAR HISTORIA CLÍNICA
    // ============================================================

    async createHistoriaClinica(datos: CrearHistoriaClinicaDTO) {
        const nuevaHistoria = await HistoriaClinicaModel.create(datos);

        // Devolver la historia con sus datos completos
        const historiaCompleta = await HistoriaClinicaModel.findById(
            nuevaHistoria._id
        )
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula');

        return historiaCompleta;
    }

    // ============================================================
    // ACTUALIZAR HISTORIA CLÍNICA
    // ============================================================

    async updateHistoriaClinica(id: string, datos: ActualizarHistoriaClinicaDTO) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la historia clínica no es válido');
        }

        // Verificar si existe y está activa
        const historiaExistente = await HistoriaClinicaModel.findOne({
            _id: id,
            activo: true,
        });

        if (!historiaExistente) {
            throw new Error('Historia clínica no encontrada');
        }

        // Incrementar la versión al actualizar
        const datosActualizados = {
            ...datos,
            $inc: { version: 1 },
        };

        const historiaActualizada = await HistoriaClinicaModel.findByIdAndUpdate(
            id,
            datosActualizados,
            { new: true, runValidators: true }
        )
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula');

        return historiaActualizada;
    }

    // ============================================================
    // ELIMINAR HISTORIA CLÍNICA (borrado lógico)
    // ============================================================

    async deleteHistoriaClinica(id: string) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('El ID de la historia clínica no es válido');
        }

        const historiaEliminada = await HistoriaClinicaModel.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

        if (!historiaEliminada) {
            throw new Error('Historia clínica no encontrada');
        }

        return historiaEliminada;
    }
}

export default new HistoriaClinicaService();
