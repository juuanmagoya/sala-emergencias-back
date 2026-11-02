import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import historiaClinicaService from '../services/historiaclinica.service';

import type { HistoriaClinicaCreateRequest } from '../request/HistoriaClinicaCreateRequest';
import type { HistoriaClinicaFilterRequest } from '../request/HistoriaClinicaFilterRequest';
import type { HistoriaClinicaIdRequest } from '../request/HistoriaClinicaIdRequest';
import type { HistoriaClinicaPacienteRequest } from '../request/HistoriaClinicaPacienteRequest';
import type { HistoriaClinicaUpdateRequest } from '../request/HistoriaClinicaUpdateRequest';

// ============================================================
// MAPEO DE ERRORES
// ============================================================

const MENSAJES_VALIDACION = [
    'El ID del paciente no es válido',
    'El ID del médico no es válido',
    'El ID de la historia clínica no es válido',
    'El paciente indicado no existe',
    'El médico indicado no existe',
    'Las observaciones son obligatorias',
    'Las observaciones no pueden superar los 2000 caracteres',
    'La fecha de atención no es válida',
    'El recetario debe ser un arreglo de medicamentos',
];

const PREFIJOS_VALIDACION_MEDICAMENTO = [
    'El medicamento en la posición',
    'El nombre del medicamento en la posición',
    'La dosis del medicamento en la posición',
    'La frecuencia del medicamento en la posición',
    'La duración del medicamento en la posición',
    'Las indicaciones del medicamento en la posición',
];

const MENSAJES_NO_ENCONTRADO = [
    'Historia clínica no encontrada',
    'Paciente no encontrado',
];

const esErrorDeValidacion = (mensaje: unknown): boolean => {
    if (typeof mensaje !== 'string') {
        return false;
    }

    return (
        MENSAJES_VALIDACION.includes(mensaje) ||
        PREFIJOS_VALIDACION_MEDICAMENTO.some((prefijo) =>
            mensaje.startsWith(prefijo)
        )
    );
};

const responderError = (
    res: Response,
    error: any,
    mensajeGeneral: string
) => {
    if (error.name === 'ValidationError') {
        const errores = Object.values(error.errors).map(
            (err: any) => err.message
        );

        return respuestaEstandar(
            res,
            400,
            false,
            'Error de validación',
            errores
        );
    }

    if (error.name === 'CastError') {
        return respuestaEstandar(
            res,
            400,
            false,
            'Identificador inválido'
        );
    }

    if (esErrorDeValidacion(error.message)) {
        return respuestaEstandar(res, 400, false, error.message);
    }

    if (MENSAJES_NO_ENCONTRADO.includes(error.message)) {
        return respuestaEstandar(res, 404, false, error.message);
    }

    return respuestaEstandar(
        res,
        500,
        false,
        mensajeGeneral,
        error.message
    );
};

// ============================================================
// OBTENER HISTORIAS CLÍNICAS
// ============================================================

export const getHistoriasClinicas = async (
    req: HistoriaClinicaFilterRequest,
    res: Response
) => {
    try {
        const historias =
            await historiaClinicaService.getHistoriasClinicas(req.query);

        return respuestaEstandar(
            res,
            200,
            true,
            'Historias clínicas obtenidas exitosamente',
            historias
        );

    } catch (error: any) {
        console.error('🔴 Error al obtener historias clínicas:', error);

        return responderError(
            res,
            error,
            'Error al obtener las historias clínicas'
        );
    }
};

// ============================================================
// OBTENER HISTORIAL CLÍNICO DE UN PACIENTE
// ============================================================

export const getHistorialPaciente = async (
    req: HistoriaClinicaPacienteRequest,
    res: Response
) => {
    try {
        const { pacienteId } = req.params;

        const historial =
            await historiaClinicaService.getHistorialPaciente(pacienteId);

        return respuestaEstandar(
            res,
            200,
            true,
            'Historial clínico obtenido exitosamente',
            historial
        );

    } catch (error: any) {
        console.error(
            '🔴 Error al obtener el historial clínico del paciente:',
            error
        );

        return responderError(
            res,
            error,
            'Error al obtener el historial clínico del paciente'
        );
    }
};

// ============================================================
// OBTENER HISTORIA CLÍNICA POR ID
// ============================================================

export const getHistoriaClinicaById = async (
    req: HistoriaClinicaIdRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const historia =
            await historiaClinicaService.getHistoriaClinicaById(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Historia clínica obtenida exitosamente',
            historia
        );

    } catch (error: any) {
        console.error('🔴 Error al obtener la historia clínica:', error);

        return responderError(
            res,
            error,
            'Error al obtener la historia clínica'
        );
    }
};

// ============================================================
// CREAR HISTORIA CLÍNICA
// ============================================================

export const createHistoriaClinica = async (
    req: HistoriaClinicaCreateRequest,
    res: Response
) => {
    try {
        const historiaCompleta =
            await historiaClinicaService.createHistoriaClinica(req.body);

        return respuestaEstandar(
            res,
            201,
            true,
            'Historia clínica creada exitosamente',
            historiaCompleta
        );

    } catch (error: any) {
        console.error('🔴 Error al crear la historia clínica:', error);

        return responderError(
            res,
            error,
            'Error al crear la historia clínica'
        );
    }
};

// ============================================================
// ACTUALIZAR HISTORIA CLÍNICA
// ============================================================

export const updateHistoriaClinica = async (
    req: HistoriaClinicaUpdateRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const historiaActualizada =
            await historiaClinicaService.updateHistoriaClinica(
                id,
                req.body
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Historia clínica actualizada exitosamente',
            historiaActualizada
        );

    } catch (error: any) {
        console.error('🔴 Error al actualizar la historia clínica:', error);

        return responderError(
            res,
            error,
            'Error al actualizar la historia clínica'
        );
    }
};
