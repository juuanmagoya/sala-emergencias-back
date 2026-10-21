import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import historiaClinicaService from '../services/historiaclinica.service';

import type { HistoriaClinicaCreateRequest } from '../request/HistoriaClinicaCreateRequest';
import type { HistoriaClinicaFilterRequest } from '../request/HistoriaClinicaFilterRequest';
import type { HistoriaClinicaIdRequest } from '../request/HistoriaClinicaIdRequest';
import type { HistoriaClinicaUpdateRequest } from '../request/HistoriaClinicaUpdateRequest';

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

        if (error.message === 'El ID del paciente no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de paciente inválido'
            );
        }

        if (error.message.startsWith('Estado inválido')) {
            return respuestaEstandar(res, 400, false, error.message);
        }

        if (error.message === 'Tipo de atención inválido') {
            return respuestaEstandar(res, 400, false, error.message);
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al obtener las historias clínicas',
            error.message
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

        const historia = await historiaClinicaService.getHistoriaClinicaById(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Historia clínica obtenida exitosamente',
            historia
        );

    } catch (error: any) {
        console.error('🔴 Error al obtener la historia clínica:', error);

        if (error.message === 'El ID de la historia clínica no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de historia clínica inválido'
            );
        }

        if (error.message === 'Historia clínica no encontrada') {
            return respuestaEstandar(
                res,
                404,
                false,
                'Historia clínica no encontrada'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al obtener la historia clínica',
            error.message
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

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al crear la historia clínica',
            error.message
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
            await historiaClinicaService.updateHistoriaClinica(id, req.body);

        return respuestaEstandar(
            res,
            200,
            true,
            'Historia clínica actualizada exitosamente',
            historiaActualizada
        );

    } catch (error: any) {
        console.error('🔴 Error al actualizar la historia clínica:', error);

        if (error.message === 'El ID de la historia clínica no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de historia clínica inválido'
            );
        }

        if (error.message === 'Historia clínica no encontrada') {
            return respuestaEstandar(
                res,
                404,
                false,
                'Historia clínica no encontrada'
            );
        }

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
                'ID de historia clínica inválido'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al actualizar la historia clínica',
            error.message
        );
    }
};

// ============================================================
// ELIMINAR HISTORIA CLÍNICA
// ============================================================

export const deleteHistoriaClinica = async (
    req: HistoriaClinicaIdRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        await historiaClinicaService.deleteHistoriaClinica(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Historia clínica eliminada exitosamente'
        );

    } catch (error: any) {
        console.error('🔴 Error al eliminar la historia clínica:', error);

        if (error.message === 'El ID de la historia clínica no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de historia clínica inválido'
            );
        }

        if (error.message === 'Historia clínica no encontrada') {
            return respuestaEstandar(
                res,
                404,
                false,
                'Historia clínica no encontrada'
            );
        }

        if (error.name === 'CastError') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID con formato inválido'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al eliminar la historia clínica',
            error.message
        );
    }
};
