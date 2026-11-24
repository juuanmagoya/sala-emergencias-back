import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
    ErrorEnvioEmail,
    enviarEmailTransaccional,
} from '../emailTransaccional.service';
import ErrorConfiguracion from '../../utils/ErrorConfiguracion';

// ============================================================
// PRESERVACIÓN DEL ENTORNO Y DE LAS DEPENDENCIAS GLOBALES
// ============================================================

const VARIABLES = [
    'BREVO_API_KEY',
    'BREVO_SENDER_EMAIL',
    'BREVO_SENDER_NAME',
] as const;

const entornoOriginal = new Map<string, string | undefined>(
    VARIABLES.map((variable) => [variable, process.env[variable]])
);

const fetchOriginal = globalThis.fetch;
const consoleErrorOriginal = console.error;

const configurarBrevo = (): void => {
    process.env.BREVO_API_KEY = 'clave-de-prueba';
    process.env.BREVO_SENDER_EMAIL = 'remitente@ejemplo.com';
    process.env.BREVO_SENDER_NAME =
        'Sala de Emergencias Municipal Goya';
};

afterEach(() => {
    for (const variable of VARIABLES) {
        const valor = entornoOriginal.get(variable);

        if (valor === undefined) {
            delete process.env[variable];

            continue;
        }

        process.env[variable] = valor;
    }

    globalThis.fetch = fetchOriginal;
    console.error = consoleErrorOriginal;
});

const datosValidos = () => ({
    destinatario: 'destinatario@ejemplo.com',
    asunto: 'Asunto de prueba',
    contenidoTexto: 'Contenido de prueba',
});

// ============================================================
// ENVÍO CORRECTO
// ============================================================

test('envía el correo a la API de Brevo con la configuración del entorno', async () => {
    configurarBrevo();

    let urlRecibida: string | undefined;
    let opcionesRecibidas: Parameters<typeof fetch>[1];

    globalThis.fetch = (async (url, opciones) => {
        urlRecibida = String(url);
        opcionesRecibidas = opciones;

        return new Response(
            JSON.stringify({ messageId: 'mensaje-de-prueba' }),
            {
                status: 201,
                headers: { 'content-type': 'application/json' },
            }
        );
    }) as typeof fetch;

    const resultado = await enviarEmailTransaccional(
        datosValidos()
    );

    assert.equal(resultado.idMensaje, 'mensaje-de-prueba');
    assert.equal(
        urlRecibida,
        'https://api.brevo.com/v3/smtp/email'
    );

    const encabezados = new Headers(
        opcionesRecibidas?.headers
    );

    assert.equal(
        encabezados.get('api-key'),
        'clave-de-prueba'
    );
    assert.equal(
        encabezados.get('content-type'),
        'application/json'
    );
    assert.ok(opcionesRecibidas?.signal instanceof AbortSignal);

    const cuerpo = JSON.parse(
        String(opcionesRecibidas?.body)
    ) as Record<string, unknown>;

    assert.deepEqual(cuerpo.sender, {
        name: 'Sala de Emergencias Municipal Goya',
        email: 'remitente@ejemplo.com',
    });
    assert.deepEqual(cuerpo.to, [
        { email: 'destinatario@ejemplo.com' },
    ]);
    assert.equal(cuerpo.subject, 'Asunto de prueba');
    assert.equal(cuerpo.textContent, 'Contenido de prueba');
    assert.equal('htmlContent' in cuerpo, false);
});

test('incluye el contenido HTML cuando se proporciona', async () => {
    configurarBrevo();

    let cuerpos: Record<string, unknown>[] = [];

    globalThis.fetch = (async (_url, opciones) => {
        cuerpos.push(
            JSON.parse(String(opciones?.body)) as Record<
                string,
                unknown
            >
        );

        return new Response(
            JSON.stringify({ messageId: 'mensaje-html' }),
            { status: 201 }
        );
    }) as typeof fetch;

    await enviarEmailTransaccional({
        ...datosValidos(),
        contenidoHtml: '<p>Contenido HTML</p>',
    });

    assert.equal(cuerpos.length, 1);
    assert.equal(
        cuerpos[0].htmlContent,
        '<p>Contenido HTML</p>'
    );
});

// ============================================================
// MANEJO DE ERRORES
// ============================================================

test('oculta los detalles internos ante un error HTTP de Brevo', async () => {
    configurarBrevo();
    console.error = () => undefined;

    globalThis.fetch = (async () =>
        new Response(
            JSON.stringify({
                code: 'invalid_parameter',
                message: 'detalle interno de Brevo',
            }),
            { status: 400 }
        )) as typeof fetch;

    await assert.rejects(
        enviarEmailTransaccional(datosValidos()),
        (error: unknown) => {
            assert.ok(error instanceof ErrorEnvioEmail);
            assert.equal(
                error.message,
                'No se pudo enviar el correo transaccional'
            );
            assert.equal(
                error.message.includes(
                    'detalle interno de Brevo'
                ),
                false
            );
            assert.equal(
                error.message.includes('clave-de-prueba'),
                false
            );

            return true;
        }
    );
});

test('convierte un error de conexión en un error genérico', async () => {
    configurarBrevo();
    console.error = () => undefined;

    globalThis.fetch = (async () => {
        throw new TypeError('fetch failed');
    }) as typeof fetch;

    await assert.rejects(
        enviarEmailTransaccional(datosValidos()),
        ErrorEnvioEmail
    );
});

test('convierte un tiempo de espera agotado en un error genérico', async () => {
    configurarBrevo();
    console.error = () => undefined;

    globalThis.fetch = (async () => {
        const error = new Error('tiempo agotado');
        error.name = 'TimeoutError';

        throw error;
    }) as typeof fetch;

    await assert.rejects(
        enviarEmailTransaccional(datosValidos()),
        ErrorEnvioEmail
    );
});

// ============================================================
// VALIDACIONES
// ============================================================

test('exige la configuración de Brevo', async () => {
    configurarBrevo();
    delete process.env.BREVO_API_KEY;

    await assert.rejects(
        enviarEmailTransaccional(datosValidos()),
        ErrorConfiguracion
    );
});

test('rechaza un destinatario inválido sin llamar a Brevo', async () => {
    configurarBrevo();

    let llamadas = 0;

    globalThis.fetch = (async () => {
        llamadas += 1;

        return new Response(null, { status: 201 });
    }) as typeof fetch;

    await assert.rejects(
        enviarEmailTransaccional({
            ...datosValidos(),
            destinatario: 'no-es-un-email',
        }),
        ErrorEnvioEmail
    );

    assert.equal(llamadas, 0);
});
