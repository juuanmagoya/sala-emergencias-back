import type { Request, Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import turnoService from '../services/turno.service';

import type { CrearTurnoRequest, TurnoIdRequest } from '../request/Turnos.request';

// ============================================================
// OBTENER TURNOS
// ============================================================

export const getTurnos = async (req: Request, res: Response) => {
    try {
        const turnos = await turnoService.getTurnos();

        return respuestaEstandar(
            res,
            200,
            true,
            'Turnos obtenidos exitosamente',
            turnos
        );

    } catch (error: any) {
        console.error('🔴 Error al obtener turnos:', error);

        return respuestaEstandar(
            res,
            500,
            false,
            'Error interno del servidor',
            error.message
        );
    }
};

// ============================================================
// CREAR TURNO
// ============================================================

export const createTurno = async (req: CrearTurnoRequest, res: Response) => {
    try {
        const origenPeticion = req.headers['x-origen'];
        const tokenSeguridad = req.headers['authorization'];

        console.log('🌎 Peticion realizada desde:', origenPeticion);

        // Control heredado del código original, se conserva durante la migración
        if (tokenSeguridad !== 'token123') {
            return respuestaEstandar(res, 401, false, 'no tiene permisos');
        }

        const urgente = req.query.urgencia === 'true';

        const turnoCompleto = await turnoService.createTurno(req.body, urgente);

        return respuestaEstandar(
            res,
            201,
            true,
            'Turno creado exitosamente',
            turnoCompleto
        );

    } catch (error: any) {
        console.error('🔴 Error al crear turno:', error);

        // Error de validación de Mongoose
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
            'Error interno del servidor',
            error.message
        );
    }
};

// ============================================================
// ELIMINAR TURNO
// ============================================================

export const deleteTurno = async (req: TurnoIdRequest, res: Response) => {
    try {
        const { id } = req.params;

        const turnoBorrado = await turnoService.deleteTurno(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Turno eliminado exitosamente',
            turnoBorrado
        );

    } catch (error: any) {
        console.error('🔴 Error al eliminar turno:', error);

        if (error.message === 'El ID del turno no es válido') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de turno inválido'
            );
        }

        if (error.message === 'Turno no encontrado') {
            return respuestaEstandar(
                res,
                404,
                false,
                'Turno no encontrado'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al eliminar el turno',
            error.message
        );
    }
};
