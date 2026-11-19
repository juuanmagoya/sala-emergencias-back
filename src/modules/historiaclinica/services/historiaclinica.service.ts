import mongoose from 'mongoose';

import HistoriaClinicaModel from '../models/HistoriaClinica';
import MedicoModel from '../../medico/models/Medico';
import PacienteModel from '../../pacientes/models/Paciente';

import type { ActualizarHistoriaClinicaDTO } from '../dtos/ActualizarHistoriaClinicaDTO';
import type { CrearHistoriaClinicaDTO } from '../dtos/CrearHistoriaClinicaDTO';
import type { IMedicamentoRecetado } from '../interfaces/HistoriaClinica.interface';

const LONGITUD_MAXIMA_OBSERVACIONES = 2000;

// ============================================================
// NORMALIZACIÓN DE TEXTOS
// ============================================================

const normalizarTextoObligatorio = (
    valor: unknown,
    mensaje: string
): string => {
    if (typeof valor !== 'string' || !valor.trim()) {
        throw new Error(mensaje);
    }

    return valor.trim();
};

const normalizarTextoOpcional = (
    valor: unknown,
    mensaje: string
): string | undefined => {
    if (valor === undefined || valor === null) {
        return undefined;
    }

    if (typeof valor !== 'string') {
        throw new Error(mensaje);
    }

    return valor.trim();
};

class HistoriaClinicaService {
    // ============================================================
    // VALIDACIONES
    // ============================================================

    private validarObjectId(valor: string, mensaje: string): string {
        if (
            typeof valor !== 'string' ||
            !mongoose.Types.ObjectId.isValid(valor)
        ) {
            throw new Error(mensaje);
        }

        return valor;
    }

    private async validarPaciente(paciente: string) {
        this.validarObjectId(
            paciente,
            'El ID del paciente no es válido'
        );

        const existe = await PacienteModel.exists({ _id: paciente });

        if (!existe) {
            throw new Error('El paciente indicado no existe');
        }
    }

    private async validarMedico(medico: string) {
        this.validarObjectId(medico, 'El ID del médico no es válido');

        const existe = await MedicoModel.exists({ _id: medico });

        if (!existe) {
            throw new Error('El médico indicado no existe');
        }
    }

    private validarObservaciones(observaciones: unknown): string {
        if (typeof observaciones !== 'string' || !observaciones.trim()) {
            throw new Error('Las observaciones son obligatorias');
        }

        const observacionesNormalizadas = observaciones.trim();

        if (
            observacionesNormalizadas.length >
            LONGITUD_MAXIMA_OBSERVACIONES
        ) {
            throw new Error(
                `Las observaciones no pueden superar los ${LONGITUD_MAXIMA_OBSERVACIONES} caracteres`
            );
        }

        return observacionesNormalizadas;
    }

    private validarFechaAtencion(fecha: unknown): Date | undefined {
        if (fecha === undefined || fecha === null) {
            return undefined;
        }

        if (typeof fecha !== 'string' && !(fecha instanceof Date)) {
            throw new Error('La fecha de atención no es válida');
        }

        const fechaConvertida =
            fecha instanceof Date ? new Date(fecha.getTime()) : new Date(fecha);

        if (Number.isNaN(fechaConvertida.getTime())) {
            throw new Error('La fecha de atención no es válida');
        }

        return fechaConvertida;
    }

    private validarRecetario(recetario: unknown): IMedicamentoRecetado[] {
        if (!Array.isArray(recetario)) {
            throw new Error(
                'El recetario debe ser un arreglo de medicamentos'
            );
        }

        return recetario.map((medicamento: unknown, indice: number) => {
            const posicion = indice + 1;

            if (
                !medicamento ||
                typeof medicamento !== 'object' ||
                Array.isArray(medicamento)
            ) {
                throw new Error(
                    `El medicamento en la posición ${posicion} no es válido`
                );
            }

            const datosMedicamento = medicamento as Record<string, unknown>;

            const nombre = normalizarTextoObligatorio(
                datosMedicamento.nombre,
                `El nombre del medicamento en la posición ${posicion} es obligatorio`
            );

            const dosis = normalizarTextoObligatorio(
                datosMedicamento.dosis,
                `La dosis del medicamento en la posición ${posicion} es obligatoria`
            );

            const frecuencia = normalizarTextoObligatorio(
                datosMedicamento.frecuencia,
                `La frecuencia del medicamento en la posición ${posicion} es obligatoria`
            );

            const duracion = normalizarTextoOpcional(
                datosMedicamento.duracion,
                `La duración del medicamento en la posición ${posicion} debe ser un texto`
            );

            const indicaciones = normalizarTextoOpcional(
                datosMedicamento.indicaciones,
                `Las indicaciones del medicamento en la posición ${posicion} deben ser un texto`
            );

            const medicamentoNormalizado: IMedicamentoRecetado = {
                nombre,
                dosis,
                frecuencia,
            };

            if (duracion !== undefined) {
                medicamentoNormalizado.duracion = duracion;
            }

            if (indicaciones !== undefined) {
                medicamentoNormalizado.indicaciones = indicaciones;
            }

            return medicamentoNormalizado;
        });
    }

    // ============================================================
    // ARMADO DE DATOS (solo campos permitidos)
    // ============================================================

    private prepararDatosCreacion(datos: CrearHistoriaClinicaDTO) {
        const datosCreacion: {
            paciente: string;
            medico: string;
            observaciones: string;
            recetario: IMedicamentoRecetado[];
            fechaAtencion?: Date;
        } = {
            paciente: datos.paciente,
            medico: datos.medico,
            observaciones: this.validarObservaciones(datos.observaciones),
            recetario:
                datos.recetario === undefined
                    ? []
                    : this.validarRecetario(datos.recetario),
        };

        const fechaAtencion = this.validarFechaAtencion(
            datos.fechaAtencion
        );

        if (fechaAtencion) {
            datosCreacion.fechaAtencion = fechaAtencion;
        }

        return datosCreacion;
    }

    private async prepararDatosActualizacion(
        datos: ActualizarHistoriaClinicaDTO
    ) {
        const datosActualizados: Record<string, unknown> = {};

        if (datos.paciente !== undefined) {
            await this.validarPaciente(datos.paciente);
            datosActualizados.paciente = datos.paciente;
        }

        if (datos.medico !== undefined) {
            await this.validarMedico(datos.medico);
            datosActualizados.medico = datos.medico;
        }

        if (datos.fechaAtencion !== undefined) {
            const fechaAtencion = this.validarFechaAtencion(
                datos.fechaAtencion
            );

            if (fechaAtencion) {
                datosActualizados.fechaAtencion = fechaAtencion;
            }
        }

        if (datos.observaciones !== undefined) {
            datosActualizados.observaciones = this.validarObservaciones(
                datos.observaciones
            );
        }

        if (datos.recetario !== undefined) {
            datosActualizados.recetario = this.validarRecetario(
                datos.recetario
            );
        }

        return datosActualizados;
    }

    // ============================================================
    // OBTENER HISTORIAS CLÍNICAS
    // ============================================================

    async getHistoriasClinicas(filtro: {
        paciente?: string;
        medico?: string;
    }) {
        const { paciente, medico } = filtro;

        const filtroMongo: Record<string, any> = {};

        if (paciente) {
            this.validarObjectId(
                paciente,
                'El ID del paciente no es válido'
            );

            filtroMongo.paciente = paciente;
        }

        if (medico) {
            this.validarObjectId(medico, 'El ID del médico no es válido');

            filtroMongo.medico = medico;
        }

        return await HistoriaClinicaModel.find(filtroMongo)
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula')
            .sort({ fechaAtencion: -1 });
    }

    // ============================================================
    // CONSULTA BASE DEL HISTORIAL POR PACIENTE
    // ============================================================

    private construirConsultaHistorialPorPaciente(pacienteId: string) {
        return HistoriaClinicaModel.find({ paciente: pacienteId })
            .populate('medico', 'nombre apellido matricula')
            .sort({ fechaAtencion: -1 });
    }

    private async validarPacienteDelHistorial(pacienteId: string) {
        this.validarObjectId(
            pacienteId,
            'El ID del paciente no es válido'
        );

        const pacienteExiste = await PacienteModel.exists({
            _id: pacienteId,
        });

        if (!pacienteExiste) {
            throw new Error('Paciente no encontrado');
        }
    }

    // ============================================================
    // OBTENER HISTORIAL CLÍNICO DE UN PACIENTE
    // ============================================================

    async getHistorialPaciente(pacienteId: string) {
        await this.validarPacienteDelHistorial(pacienteId);

        return await this.construirConsultaHistorialPorPaciente(pacienteId)
            .populate('paciente', 'nombre dni');
    }

    // ============================================================
    // OBTENER EL HISTORIAL DEL PACIENTE AUTENTICADO
    // ============================================================

    async getMiHistorial(pacienteId: string) {
        await this.validarPacienteDelHistorial(pacienteId);

        // Proyección explícita: no se popula `paciente` para no exponer
        // DNI, teléfono ni otros datos del perfil. El médico queda limitado
        // a los campos definidos en el populate de la consulta base.
        return await this.construirConsultaHistorialPorPaciente(pacienteId)
            .select('fechaAtencion observaciones recetario medico');
    }

    // ============================================================
    // OBTENER HISTORIA CLÍNICA POR ID
    // ============================================================

    async getHistoriaClinicaById(id: string) {
        this.validarObjectId(
            id,
            'El ID de la historia clínica no es válido'
        );

        const historia = await HistoriaClinicaModel.findById(id)
            .populate('paciente', 'nombre dni email telefono')
            .populate(
                'medico',
                'nombre apellido matricula especialidades'
            );

        if (!historia) {
            throw new Error('Historia clínica no encontrada');
        }

        return historia;
    }

    // ============================================================
    // CREAR HISTORIA CLÍNICA
    // ============================================================

    async createHistoriaClinica(datos: CrearHistoriaClinicaDTO) {
        await Promise.all([
            this.validarPaciente(datos.paciente),
            this.validarMedico(datos.medico),
        ]);

        const datosCreacion = this.prepararDatosCreacion(datos);


        const nuevaHistoria = await HistoriaClinicaModel.create(datosCreacion);

        return await HistoriaClinicaModel.findById(nuevaHistoria._id)
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula');

    }

    // ============================================================
    // ACTUALIZAR HISTORIA CLÍNICA
    // ============================================================

    async updateHistoriaClinica(
        id: string,
        datos: ActualizarHistoriaClinicaDTO
    ) {
        this.validarObjectId(
            id,
            'El ID de la historia clínica no es válido'
        );

        const historiaExistente =
            await HistoriaClinicaModel.findById(id);

        if (!historiaExistente) {
            throw new Error('Historia clínica no encontrada');
        }

        const datosActualizados =
            await this.prepararDatosActualizacion(datos);

        return await HistoriaClinicaModel.findByIdAndUpdate(
            id,
            datosActualizados,
            {
                new: true,
                runValidators: true,
            }
        )
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula');
    }
}

export default new HistoriaClinicaService();
