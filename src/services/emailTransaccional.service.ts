import { leerConfiguracionBrevo } from '../config/entorno.js';

const URL_API_BREVO = 'https://api.brevo.com/v3/smtp/email';
const TIEMPO_ESPERA_MS = 5000;
const PATRON_EMAIL =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Mensaje público y genérico: nunca incluye detalles de Brevo ni datos del
// destinatario. Los detalles técnicos se registran solo del lado servidor.
export class ErrorEnvioEmail extends Error {
    constructor(
        mensaje = 'No se pudo enviar el correo transaccional'
    ) {
        super(mensaje);
        this.name = 'ErrorEnvioEmail';
    }
}

export interface DatosEmailTransaccional {
    destinatario: string;
    asunto: string;
    contenidoTexto: string;
    // Opcional para que el mismo servicio sirva a plantillas HTML (por
    // ejemplo, el código OTP en una etapa posterior).
    contenidoHtml?: string;
}

export interface ResultadoEnvioEmail {
    idMensaje: string | null;
}

interface RespuestaBrevo {
    messageId?: unknown;
}

interface ErrorBrevo {
    code?: unknown;
}

const textoObligatorio = (
    valor: unknown,
    nombre: string
): string => {
    if (typeof valor !== 'string' || !valor.trim()) {
        throw new ErrorEnvioEmail(
            `El campo ${nombre} del correo es obligatorio`
        );
    }

    return valor.trim();
};

const validarDestinatario = (destinatario: unknown): string => {
    const limpio = textoObligatorio(destinatario, 'destinatario');

    if (!PATRON_EMAIL.test(limpio)) {
        throw new ErrorEnvioEmail(
            'El destinatario del correo no es válido'
        );
    }

    return limpio;
};

const esErrorDeTiempoAgotado = (error: unknown): boolean =>
    error instanceof Error &&
    (error.name === 'TimeoutError' ||
        error.name === 'AbortError');

const leerIdMensaje = async (
    respuesta: Response
): Promise<string | null> => {
    const texto = await respuesta.text();

    if (!texto) {
        return null;
    }

    try {
        const datos = JSON.parse(texto) as RespuestaBrevo;

        return typeof datos.messageId === 'string'
            ? datos.messageId
            : null;
    } catch {
        return null;
    }
};

// Registra un código de error de Brevo si la respuesta lo incluye. No se
// registra el mensaje completo porque podría contener datos del destinatario.
const registrarErrorBrevo = async (
    respuesta: Response
): Promise<void> => {
    let codigo: string | undefined;

    try {
        const datos = JSON.parse(
            await respuesta.text()
        ) as ErrorBrevo;

        if (typeof datos.code === 'string') {
            codigo = datos.code;
        }
    } catch {
        // La respuesta de error no es JSON o no se pudo leer.
    }

    const detalle = codigo ? ` (${codigo})` : '';

    console.error(
        `🔴 Brevo: respuesta HTTP ${respuesta.status}${detalle}`
    );
};

/**
 * Envía un email transaccional mediante la API HTTP de Brevo.
 *
 * La configuración del remitente y la API Key se obtienen del mecanismo
 * centralizado de variables de entorno (`leerConfiguracionBrevo`).
 */
export const enviarEmailTransaccional = async ({
    destinatario,
    asunto,
    contenidoTexto,
    contenidoHtml,
}: DatosEmailTransaccional): Promise<ResultadoEnvioEmail> => {
    const { apiKey, remitenteEmail, remitenteNombre } =
        leerConfiguracionBrevo();

    const destinatarioLimpio = validarDestinatario(destinatario);
    const asuntoLimpio = textoObligatorio(asunto, 'asunto');
    const textoLimpio = textoObligatorio(
        contenidoTexto,
        'contenidoTexto'
    );
    const htmlLimpio =
        contenidoHtml === undefined
            ? undefined
            : textoObligatorio(contenidoHtml, 'contenidoHtml');

    const cuerpo = {
        sender: {
            name: remitenteNombre,
            email: remitenteEmail,
        },
        to: [{ email: destinatarioLimpio }],
        subject: asuntoLimpio,
        textContent: textoLimpio,
        ...(htmlLimpio ? { htmlContent: htmlLimpio } : {}),
    };

    let respuesta: Response;

    try {
        respuesta = await fetch(URL_API_BREVO, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify(cuerpo),
            signal: AbortSignal.timeout(TIEMPO_ESPERA_MS),
        });
    } catch (error: unknown) {
        if (esErrorDeTiempoAgotado(error)) {
            console.error(
                '🔴 Brevo: tiempo de espera agotado al enviar el correo'
            );
        } else {
            console.error(
                '🔴 Brevo: error de conexión al enviar el correo'
            );
        }

        throw new ErrorEnvioEmail();
    }

    if (!respuesta.ok) {
        await registrarErrorBrevo(respuesta);

        throw new ErrorEnvioEmail();
    }

    return {
        idMensaje: await leerIdMensaje(respuesta),
    };
};
