import type { Request, Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import especialidadService from '../services/especialidad.service';

import type { EspecialidadCreateRequest } from '../requests/EspecialidadCreateRequest';
import type { EspecialidadUpdateRequest } from '../requests/EspecialidadUpdateRequest';
import type { EspecialidadFilterRequest } from '../requests/EspecialidadFilterRequest';


// ============================================================
// OBTENER ESPECIALIDADES
// ============================================================

export const getEspecialidades = async (
    req: EspecialidadFilterRequest,
    res: Response
) => {
    try {
        const especialidades =
            await especialidadService.getEspecialidades(req.query);

        return respuestaEstandar(
            res,
            200,
            true,
            'Especialidades obtenidas exitosamente',
            especialidades
        );

    } catch (error: any) {
        console.error(
            '🔴 Error al obtener especialidades:',
            error
        );

        if (error.message === 'El ID de la especialidad no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        if (error.message === 'Especialidad no encontrada') {
            return respuestaEstandar(
                res,
                404,
                false,
                'Especialidad no encontrada'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al obtener las especialidades',
            error.message
        );
    }
};


// ============================================================
// OBTENER ESPECIALIDADES DISPONIBLES PARA PACIENTES
// ============================================================

export const getEspecialidadesDisponibles = async (
    _req: Request,
    res: Response
) => {
    try {
        const especialidades =
            await especialidadService.getEspecialidadesDisponibles();

        return respuestaEstandar(
            res,
            200,
            true,
            'Especialidades disponibles obtenidas exitosamente',
            especialidades
        );

    } catch (error: any) {
        console.error(
            '🔴 Error al obtener especialidades disponibles:',
            error
        );

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al obtener las especialidades disponibles'
        );
    }
};


// ============================================================
// CREAR ESPECIALIDAD
// ============================================================

export const createEspecialidad = async (
    req: EspecialidadCreateRequest,
    res: Response
) => {
    try {
        console.log('🟡 BODY RECIBIDO:', req.body);

        const nuevaEspecialidad =
            await especialidadService.createEspecialidad(req.body);

        console.log(
            '🟢 ESPECIALIDAD CREADA:',
            nuevaEspecialidad
        );

        return respuestaEstandar(
            res,
            201,
            true,
            'Especialidad creada exitosamente',
            nuevaEspecialidad
        );

    } catch (error: any) {
        console.error(
            '🔴 ERROR AL CREAR ESPECIALIDAD:',
            error
        );

        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors)
                .map((err: any) => err.message);

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
            500,
            false,
            'Error al crear la especialidad',
            error.message
        );
    }
};


// ============================================================
// ACTUALIZAR ESPECIALIDAD
// ============================================================

export const updateEspecialidad = async (
    req: EspecialidadUpdateRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const especialidadActualizada =
            await especialidadService.updateEspecialidad(
                id,
                req.body
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Especialidad actualizada exitosamente',
            especialidadActualizada
        );

    } catch (error: any) {
        console.error(
            '🔴 Error al actualizar especialidad:',
            error
        );

        if (
            error.message ===
            'El ID de la especialidad no es válido'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        if (
            error.message ===
            'Especialidad no encontrada o está inactiva'
        ) {
            return respuestaEstandar(
                res,
                404,
                false,
                'Especialidad no encontrada'
            );
        }

        if (
            error.message ===
            'Ya existe una especialidad con ese nombre'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                'Ya existe otra especialidad con ese nombre'
            );
        }

        if (
            error.message ===
            'Ya existe una especialidad con ese código'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                'Ya existe otra especialidad con ese código'
            );
        }

        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors)
                .map((err: any) => err.message);

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
            500,
            false,
            'Error al actualizar la especialidad',
            error.message
        );
    }
};


// ============================================================
// CAMBIAR ESTADO
// ============================================================

export const toggleActivoEspecialidad = async (
    req: EspecialidadUpdateRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const resultado =
            await especialidadService.toggleActivoEspecialidad(id);

        return respuestaEstandar(
            res,
            200,
            true,
            resultado.mensaje,
            resultado.especialidad
        );

    } catch (error: any) {
        console.error(
            '🔴 Error al cambiar estado de especialidad:',
            error
        );

        if (
            error.message ===
            'El ID de la especialidad no es válido'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        if (
            error.message ===
            'Especialidad no encontrada'
        ) {
            return respuestaEstandar(
                res,
                404,
                false,
                'Especialidad no encontrada'
            );
        }

        if (
            error.message.includes(
                'No se puede desactivar la especialidad'
            )
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                error.message
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al cambiar el estado de la especialidad',
            error.message
        );
    }
};


// ============================================================
// ELIMINAR PERMANENTEMENTE
// ============================================================

export const deleteEspecialidadPermanente = async (
    req: EspecialidadUpdateRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        await especialidadService.deleteEspecialidadPermanente(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Especialidad eliminada permanentemente'
        );

    } catch (error: any) {
        console.error(
            '🔴 Error al eliminar especialidad:',
            error
        );

        if (
            error.message ===
            'El ID de la especialidad no es válido'
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        if (
            error.message ===
            'Especialidad no encontrada'
        ) {
            return respuestaEstandar(
                res,
                404,
                false,
                'Especialidad no encontrada'
            );
        }

        if (
            error.message.includes(
                'No se puede eliminar la especialidad'
            )
        ) {
            return respuestaEstandar(
                res,
                400,
                false,
                error.message
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al eliminar permanentemente la especialidad',
            error.message
        );
    }
};