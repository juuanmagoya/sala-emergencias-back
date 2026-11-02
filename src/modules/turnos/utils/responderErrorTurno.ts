import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import { MENSAJES_TURNO } from '../constants/turno.messages';
import {
    esErrorDuplicado,
    estadoHttpParaErrorTurno,
} from './erroresTurno';

interface ErrorValidacion {
    name?: string;
    message?: string;
    errors?: Record<string, { message: string }>;
}

// Respuesta uniforme para los endpoints que crean o consultan turnos,
// incluido el ingreso por recepción.
export const responderErrorTurno = (
    res: Response,
    error: unknown,
    mensajeGeneral: string
) => {
    const errorTipado = error as ErrorValidacion;

    if (errorTipado?.name === 'ValidationError') {
        const errores = Object.values(
            errorTipado.errors ?? {}
        ).map((detalle) => detalle.message);

        return respuestaEstandar(
            res,
            400,
            false,
            'Error de validación',
            errores
        );
    }

    if (esErrorDuplicado(error)) {
        return respuestaEstandar(
            res,
            409,
            false,
            MENSAJES_TURNO.HORARIO_OCUPADO
        );
    }

    const mensaje =
        error instanceof Error ? error.message : '';

    const status = estadoHttpParaErrorTurno(mensaje);

    if (status) {
        return respuestaEstandar(res, status, false, mensaje);
    }

    console.error(`🔴 ${mensajeGeneral}:`, error);

    return respuestaEstandar(res, 500, false, mensajeGeneral);
};
