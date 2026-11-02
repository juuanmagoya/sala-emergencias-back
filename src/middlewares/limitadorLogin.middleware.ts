import rateLimit from 'express-rate-limit';

import {
    LIMITE_LOGIN_POR_DEFECTO,
    VENTANA_LOGIN_POR_DEFECTO_MS,
    leerEnteroPositivo,
} from '../config/entorno';
import respuestaEstandar from '../utils/respuestaEstandar';

export interface OpcionesLimitadorLogin {
    limite: number;
    ventanaMs: number;
}

// Limitador de intentos de login.
//
// Los inicios de sesión exitosos no consumen cuota: solo cuentan los intentos
// fallidos. La clave por defecto es la IP del cliente.
//
// Limitación conocida: el almacenamiento por defecto vive en memoria y es
// propio de cada proceso. Con varias instancias o un balanceador de carga, el
// límite efectivo se multiplica por la cantidad de instancias y se reinicia al
// reiniciar el proceso. Para producción distribuida hace falta un store
// compartido (por ejemplo Redis). Además, si la aplicación corre detrás de un
// proxy, hay que configurar `trust proxy` para que la IP sea la real.
export const crearLimitadorLogin = ({
    limite,
    ventanaMs,
}: OpcionesLimitadorLogin) =>
    rateLimit({
        windowMs: ventanaMs,
        limit: limite,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        handler: (_req, res) =>
            respuestaEstandar(
                res,
                429,
                false,
                'Demasiados intentos de inicio de sesión. Intentá nuevamente más tarde.'
            ),
    });

const limitadorLogin = crearLimitadorLogin({
    limite: leerEnteroPositivo(
        process.env.LOGIN_RATE_LIMIT_MAX,
        LIMITE_LOGIN_POR_DEFECTO
    ),
    ventanaMs: leerEnteroPositivo(
        process.env.LOGIN_RATE_LIMIT_WINDOW_MS,
        VENTANA_LOGIN_POR_DEFECTO_MS
    ),
});

export default limitadorLogin;
