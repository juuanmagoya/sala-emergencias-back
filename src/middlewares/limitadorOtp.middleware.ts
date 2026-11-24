
import rateLimit from 'express-rate-limit';

import { leerEnteroPositivo } from '../config/entorno';
import respuestaEstandar from '../utils/respuestaEstandar';

const VENTANA_OTP_MS = 15 * 60 * 1000;

const crearLimitadorOtp = (limite: number, mensaje: string) =>
    rateLimit({
        windowMs: VENTANA_OTP_MS,
        limit: limite,
        standardHeaders: 'draft-7',
        legacyHeaders: false,

        // A diferencia del login interno, todos los intentos cuentan.
        skipSuccessfulRequests: false,

        handler: (_req, res) =>
            respuestaEstandar(res, 429, false, mensaje),
    });

export const limitadorSolicitarOtp = crearLimitadorOtp(
    leerEnteroPositivo(
        process.env.OTP_SOLICITUD_RATE_LIMIT_MAX,
        10
    ),
    'Demasiadas solicitudes de códigos. Intentá nuevamente más tarde.'
);

export const limitadorVerificarOtp = crearLimitadorOtp(
    leerEnteroPositivo(
        process.env.OTP_VERIFICACION_RATE_LIMIT_MAX,
        20
    ),
    'Demasiados intentos de verificación. Intentá nuevamente más tarde.'
);
