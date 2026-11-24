import 'dotenv/config';

import {
    ErrorEnvioEmail,
    enviarEmailTransaccional,
} from '../services/emailTransaccional.service.js';
import ErrorConfiguracion from '../utils/ErrorConfiguracion.js';

// ============================================================
// PRUEBA MANUAL DEL ENVÍO DE EMAIL TRANSACCIONAL
//
// Uso:
//   npm run probar:correo -- correo@ejemplo.com
//
// No es un endpoint: se ejecuta desde el servidor o una máquina de
// confianza con acceso al .env. La API Key nunca se imprime.
// ============================================================

const ASUNTO_PRUEBA = 'Prueba de correo transaccional';
const CONTENIDO_PRUEBA =
    'Este es un mensaje sencillo de prueba enviado desde el backend de Sala de Emergencias Municipal Goya.';

const enmascararEmail = (email: string): string => {
    const [usuario, dominio] = email.split('@');

    if (!usuario || !dominio) {
        return '***';
    }

    return `${usuario.slice(0, 1)}***@${dominio}`;
};

const main = async (): Promise<void> => {
    const destinatario = process.argv[2]?.trim();

    if (!destinatario) {
        console.error(
            'Uso: npm run probar:correo -- correo@ejemplo.com'
        );
        process.exitCode = 1;

        return;
    }

    const resultado = await enviarEmailTransaccional({
        destinatario,
        asunto: ASUNTO_PRUEBA,
        contenidoTexto: CONTENIDO_PRUEBA,
    });

    console.log('🟢 Correo de prueba enviado correctamente.');
    console.log(
        `Destinatario: ${enmascararEmail(destinatario)}`
    );

    if (resultado.idMensaje) {
        console.log(`ID de mensaje: ${resultado.idMensaje}`);
    }
};

main().catch((error: unknown) => {
    if (
        error instanceof ErrorConfiguracion ||
        error instanceof ErrorEnvioEmail
    ) {
        console.error(`🔴 ${error.message}`);
    } else {
        console.error(
            '🔴 Error inesperado al enviar el correo de prueba.'
        );
    }

    process.exitCode = 1;
});
