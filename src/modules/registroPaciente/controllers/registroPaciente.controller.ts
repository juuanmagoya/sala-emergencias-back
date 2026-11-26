
import type { Request, Response } from 'express';

import registroPacienteService, {
    ErrorRegistroPaciente,
} from '../services/registroPaciente.service.js';

import respuestaEstandar from '../../../utils/respuestaEstandar.js';

export const registrarPaciente = async (
    req: Request,
    res: Response
) => {
    try {
        const resultado = await registroPacienteService.registrar(
            req.body
        );

        return respuestaEstandar(
            res,
            201,
            true,
            'Paciente registrado correctamente. Ya podés iniciar sesión.',
            resultado
        );
    } catch (error: unknown) {
        if (error instanceof ErrorRegistroPaciente) {
            return respuestaEstandar(
                res,
                error.statusCode,
                false,
                error.message
            );
        }

        console.error(
            '🔴 Error al registrar paciente públicamente'
        );

        return respuestaEstandar(
            res,
            500,
            false,
            'Error interno del servidor'
        );
    }
};
