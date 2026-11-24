import ErrorConfiguracion from '../utils/ErrorConfiguracion';
import { esZonaHorariaValida } from '../utils/fechaHora';

export const LIMITE_LOGIN_POR_DEFECTO = 5;
export const VENTANA_LOGIN_POR_DEFECTO_MS = 15 * 60 * 1000;

// Los turnos se interpretan en la hora local del centro médico. Argentina
// no aplica horario de verano, pero se usa la zona IANA para no depender de
// la zona horaria de la máquina donde corre Node.js.
export const ZONA_HORARIA_POR_DEFECTO =
    'America/Argentina/Buenos_Aires';

// Lee un entero positivo y, si falta o es inválido, devuelve el valor por
// defecto. validarConfiguracion() se encarga de rechazar valores inválidos
// al arrancar la aplicación.
export const leerEnteroPositivo = (
    valor: string | undefined,
    porDefecto: number
): number => {
    if (valor === undefined || valor.trim() === '') {
        return porDefecto;
    }

    const numero = Number(valor);

    return Number.isInteger(numero) && numero > 0
        ? numero
        : porDefecto;
};

const validarEnteroPositivo = (
    nombre: string,
    valor: string | undefined
) => {
    if (valor === undefined || valor.trim() === '') {
        return;
    }

    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero <= 0) {
        throw new ErrorConfiguracion(
            `La variable ${nombre} debe ser un número entero positivo`
        );
    }
};

export interface ConfiguracionEntorno {
    puerto: number;
    limiteIntentosLogin: number;
    ventanaLimiteLoginMs: number;
    zonaHoraria: string;
}

export interface ConfiguracionBrevo {
    apiKey: string;
    remitenteEmail: string;
    remitenteNombre: string;
}

export const NOMBRE_REMITENTE_BREVO_POR_DEFECTO =
    'Sala de Emergencias Municipal Goya';

const PATRON_EMAIL_BREVO =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const leerVariableObligatoria = (
    nombre: string,
    valor: string | undefined
): string => {
    const limpio = valor?.trim();

    if (!limpio) {
        throw new ErrorConfiguracion(
            `Falta configurar ${nombre}`
        );
    }

    return limpio;
};

// La API HTTP de Brevo se configura por entorno, igual que el resto de la
// aplicación. Se lee en el momento del envío para que los tests puedan
// definir sus propias variables sin depender de un archivo .env.
export const leerConfiguracionBrevo = (): ConfiguracionBrevo => {
    const apiKey = leerVariableObligatoria(
        'BREVO_API_KEY',
        process.env.BREVO_API_KEY
    );

    const remitenteEmail = leerVariableObligatoria(
        'BREVO_SENDER_EMAIL',
        process.env.BREVO_SENDER_EMAIL
    );

    if (!PATRON_EMAIL_BREVO.test(remitenteEmail)) {
        throw new ErrorConfiguracion(
            'BREVO_SENDER_EMAIL no es una dirección válida'
        );
    }

    const remitenteNombre =
        process.env.BREVO_SENDER_NAME?.trim() ||
        NOMBRE_REMITENTE_BREVO_POR_DEFECTO;

    return {
        apiKey,
        remitenteEmail,
        remitenteNombre,
    };
};

// La integración de email es opcional en entornos de prueba. Si hay al
// menos una variable de Brevo configurada, se exige el conjunto completo
// para no arrancar con una configuración a medias.
const validarConfiguracionBrevoSiCorresponde = (): void => {
    const hayConfiguracion =
        Boolean(process.env.BREVO_API_KEY?.trim()) ||
        Boolean(process.env.BREVO_SENDER_EMAIL?.trim());

    if (hayConfiguracion) {
        leerConfiguracionBrevo();
    }
};

export const leerZonaHoraria = (): string =>
    process.env.ZONA_HORARIA?.trim() || ZONA_HORARIA_POR_DEFECTO;

// Valida la configuración mínima al iniciar el servidor. No expone valores.
export const validarConfiguracion = (): ConfiguracionEntorno => {
    if (!process.env.JWT_SECRET?.trim()) {
        throw new ErrorConfiguracion(
            'Falta configurar JWT_SECRET'
        );
    }

    if (!process.env.DATABASE_URL_ATLAS?.trim()) {
        throw new ErrorConfiguracion(
            'Falta configurar DATABASE_URL_ATLAS'
        );
    }

    validarEnteroPositivo('PORT', process.env.PORT);
    validarEnteroPositivo(
        'LOGIN_RATE_LIMIT_MAX',
        process.env.LOGIN_RATE_LIMIT_MAX
    );
    validarEnteroPositivo(
        'LOGIN_RATE_LIMIT_WINDOW_MS',
        process.env.LOGIN_RATE_LIMIT_WINDOW_MS
    );

    const zonaHoraria = leerZonaHoraria();

    if (!esZonaHorariaValida(zonaHoraria)) {
        throw new ErrorConfiguracion(
            'La variable ZONA_HORARIA no es una zona horaria válida'
        );
    }

    validarConfiguracionBrevoSiCorresponde();

    return {
        puerto: leerEnteroPositivo(process.env.PORT, 3000),
        limiteIntentosLogin: leerEnteroPositivo(
            process.env.LOGIN_RATE_LIMIT_MAX,
            LIMITE_LOGIN_POR_DEFECTO
        ),
        ventanaLimiteLoginMs: leerEnteroPositivo(
            process.env.LOGIN_RATE_LIMIT_WINDOW_MS,
            VENTANA_LOGIN_POR_DEFECTO_MS
        ),
        zonaHoraria,
    };
};
