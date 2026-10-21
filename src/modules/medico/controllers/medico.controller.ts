import type { Request, Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import medicoService from '../services/medico.service';

import type { MedicoCreateRequest } from '../request/MedicoCreateRequest';
import type { MedicoFilterRequest } from '../request/MedicoFilterRequest';
import type { MedicoUpdateRequest } from '../request/MedicoUpdateRequest';


// ============================================================
// OBTENER MÉDICOS
// ============================================================

export const getMedicos = async (
    req: MedicoFilterRequest,
    res: Response
) => {
    try {
        const medicos = await medicoService.getMedicos(
            req.query
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Médicos obtenidos exitosamente',
            medicos
        );

    } catch (error: any) {

        console.error(
            'Error al obtener médicos:',
            error
        );

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message || 'Error al obtener los médicos'
        );
    }
};


// ============================================================
// CREAR MÉDICO
// ============================================================

export const createMedico = async (
    req: MedicoCreateRequest,
    res: Response
) => {
    try {
        const medico = await medicoService.createMedico(
            req.body
        );

        return respuestaEstandar(
            res,
            201,
            true,
            'Médico creado exitosamente',
            medico
        );

    } catch (error: any) {

        console.error(
            'Error al crear médico:',
            error
        );

        if (error.name === 'ValidationError') {

            const errores = Object.values(
                error.errors
            ).map(
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

        if (error.code === 11000) {

            const campo = Object.keys(
                error.keyPattern
            )[0];

            return respuestaEstandar(
                res,
                400,
                false,
                `El ${campo} ya está registrado en el sistema`
            );
        }

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message || 'Error al crear el médico'
        );
    }
};


// ============================================================
// ACTUALIZAR MÉDICO
// ============================================================

export const updateMedico = async (
    req: MedicoUpdateRequest,
    res: Response
) => {
    try {
        const medico = await medicoService.updateMedico(
            req.params.id,
            req.body
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Médico actualizado exitosamente',
            medico
        );

    } catch (error: any) {

        console.error(
            'Error al actualizar médico:',
            error
        );

        if (error.name === 'ValidationError') {

            const errores = Object.values(
                error.errors
            ).map(
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

        if (error.code === 11000) {

            const campo = Object.keys(
                error.keyPattern
            )[0];

            return respuestaEstandar(
                res,
                400,
                false,
                `El ${campo} ya está registrado en el sistema`
            );
        }

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message || 'Error al actualizar el médico'
        );
    }
};


// ============================================================
// ACTIVAR / DESACTIVAR
// ============================================================

export const toggleActivoMedico = async (
    req: MedicoUpdateRequest,
    res: Response
) => {
    try {
        const medico =
            await medicoService.toggleActivoMedico(
                req.params.id
            );

        const mensaje = medico.activo
            ? 'Médico activado exitosamente'
            : 'Médico desactivado exitosamente';

        return respuestaEstandar(
            res,
            200,
            true,
            mensaje,
            medico
        );

    } catch (error: any) {

        console.error(
            'Error al cambiar estado del médico:',
            error
        );

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message ||
            'Error al cambiar el estado del médico'
        );
    }
};


// ============================================================
// ELIMINAR
// ============================================================

export const deleteMedicoPermanente = async (
    req: MedicoUpdateRequest,
    res: Response
) => {
    try {
        await medicoService.deleteMedicoPermanente(
            req.params.id
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Médico eliminado permanentemente'
        );

    } catch (error: any) {

        console.error(
            'Error al eliminar médico:',
            error
        );

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message ||
            'Error al eliminar permanentemente el médico'
        );
    }
};

