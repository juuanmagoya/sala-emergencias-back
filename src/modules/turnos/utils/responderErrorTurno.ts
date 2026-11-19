import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import { MENSAJES_TURNO } from '../constants/turno.messages';
import {
    esDuplicadoDeCampo,
    esDuplicadoDeTurno,
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
        if (esDuplicadoDeCampo(error, 'dni')) {
            return respuestaEstandar(
                res,
                400,
                false,
                'El DNI ya está registrado',
                'Ya existe un paciente registrado con ese DNI'
            );
        }

        if (esDuplicadoDeCampo(error, 'email')) {
            return respuestaEstandar(
                res,
                400,
                false,
                'El correo electrónico ya está registrado',
                'Ya existe un paciente registrado con ese correo electrónico'
            );
        }

        if (esDuplicadoDeTurno(error)) {
            return respuestaEstandar(
                res,
                409,
                false,
                MENSAJES_TURNO.HORARIO_OCUPADO
            );
        }

        // Un 11000 de un índice que no conocemos no debe disfrazarse
        // de horario ocupado. Se registra y se informa un error general.
        console.error(
            `🔴 ${mensajeGeneral}: duplicado no reconocido`,
            error
        );

        return respuestaEstandar(
            res,
            500,
            false,
            mensajeGeneral
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
