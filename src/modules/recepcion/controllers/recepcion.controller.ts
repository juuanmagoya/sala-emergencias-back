import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import recepcionService from '../services/recepcion.service';

import { responderErrorTurno } from '../../turnos/utils/responderErrorTurno';

import type { RegistrarIngresoRequest } from '../request/RegistrarIngresoRequest';

// ============================================================
// REGISTRAR INGRESO
// ============================================================

export const registrarIngreso = async (
    req: RegistrarIngresoRequest,
    res: Response
) => {
    try {
        const turnoCompleto =
            await recepcionService.registrarIngreso(req.body);

        return respuestaEstandar(
            res,
            201,
            true,
            'Ingreso registrado exitosamente',
            turnoCompleto
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al registrar el ingreso'
        );
    }
};
