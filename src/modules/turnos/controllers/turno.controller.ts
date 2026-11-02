import type { Request, Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import turnoService from '../services/turno.service';

import { responderErrorTurno } from '../utils/responderErrorTurno';

import type {
    CrearTurnoRequest,
    DisponibilidadRequest,
    TurnoIdRequest,
} from '../request/Turnos.request';

// ============================================================
// OBTENER TURNOS
// ============================================================

export const getTurnos = async (_req: Request, res: Response) => {
    try {
        const turnos = await turnoService.getTurnos();

        return respuestaEstandar(
            res,
            200,
            true,
            'Turnos obtenidos exitosamente',
            turnos
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error interno del servidor'
        );
    }
};

// ============================================================
// CONSULTAR DISPONIBILIDAD
// ============================================================

export const getDisponibilidad = async (
    req: DisponibilidadRequest,
    res: Response
) => {
    try {
        const disponibilidad =
            await turnoService.getDisponibilidad(
                req.query.medicoId ?? '',
                req.query.fecha ?? ''
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Disponibilidad obtenida exitosamente',
            disponibilidad
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al consultar la disponibilidad'
        );
    }
};

// ============================================================
// TURNOS DEL MÉDICO AUTENTICADO
// ============================================================

export const getMisTurnos = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.usuario) {
            return respuestaEstandar(
                res,
                401,
                false,
                'No autenticado'
            );
        }

        const turnos = await turnoService.getTurnosDelMedico(
            req.usuario.id
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Turnos del médico obtenidos exitosamente',
            turnos
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al obtener los turnos del médico'
        );
    }
};

// ============================================================
// CREAR TURNO
// ============================================================

export const createTurno = async (
    req: CrearTurnoRequest,
    res: Response
) => {
    try {
        const origenPeticion = req.headers['x-origen'];

        console.log('🌎 Peticion realizada desde:', origenPeticion);

        // El estado inicial, la duración y la fecha de fin se derivan
        // en el servidor. El cliente no puede imponerlos.
        const turnoCompleto = await turnoService.createTurno(
            req.body
        );

        return respuestaEstandar(
            res,
            201,
            true,
            'Turno creado exitosamente',
            turnoCompleto
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error interno del servidor'
        );
    }
};

// ============================================================
// ELIMINAR TURNO
// ============================================================

export const deleteTurno = async (
    req: TurnoIdRequest,
    res: Response
) => {
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

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al eliminar el turno'
        );
    }
};
