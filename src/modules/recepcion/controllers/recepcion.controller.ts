import type { Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import recepcionService from '../services/recepcion.service';

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

    } catch (error: any) {
        console.error('🔴 Error al registrar el ingreso:', error);

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
            'Error al registrar el ingreso',
            error.message
        );
    }
};
