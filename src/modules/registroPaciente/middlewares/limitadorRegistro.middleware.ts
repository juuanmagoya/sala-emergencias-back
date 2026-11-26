
import rateLimit from 'express-rate-limit';

import respuestaEstandar from '../../../utils/respuestaEstandar.js';

const limitadorRegistro = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
        respuestaEstandar(
            res,
            429,
            false,
            'Demasiados intentos de registro. Intentá nuevamente dentro de 15 minutos.'
        ),
});

export default limitadorRegistro;
