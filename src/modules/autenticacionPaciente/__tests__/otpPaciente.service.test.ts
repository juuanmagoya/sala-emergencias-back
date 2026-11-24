import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import PacienteModel from '../../pacientes/models/Paciente';
import CodigoOtpPacienteModel from '../models/CodigoOtpPaciente';
import otpPacienteService, {
    DURACION_CODIGO_OTP_MS,
    INTERVALO_REENVIO_OTP_MS,
    INTENTOS_VERIFICACION_OTP,
} from '../services/otpPaciente.service';
import {
    formatearCodigoOtp,
    generarCodigoOtp,
} from '../utils/generarCodigoOtp';
import {
    ErrorOtpPaciente,
    MOTIVOS_ERROR_OTP,
} from '../utils/erroresOtp';

// ============================================================
// PRESERVACIÓN DEL ENTORNO Y DE LAS DEPENDENCIAS GLOBALES
// ============================================================

const VARIABLES_BREVO = [
    'BREVO_API_KEY',
    'BREVO_SENDER_EMAIL',
    'BREVO_SENDER_NAME',
] as const;

const entornoOriginal = new Map<string, string | undefined>(
    VARIABLES_BREVO.map((variable) => [
        variable,
        process.env[variable],
    ])
);

const fetchOriginal = globalThis.fetch;
const consoleErrorOriginal = console.error;

const configurarBrevo = (): void => {
    process.env.BREVO_API_KEY = 'clave-de-prueba';
    process.env.BREVO_SENDER_EMAIL = 'remitente@ejemplo.com';
    process.env.BREVO_SENDER_NAME =
        'Sala de Emergencias Municipal Goya';
};

// ============================================================
// SUPLANTACIÓN DE MODELOS
// ============================================================

type Consulta<T> = Promise<T> & {
    select: (campos?: string) => Consulta<T>;
};

const crearConsulta = <T>(resultado: T): Consulta<T> => {
    const consulta = Promise.resolve(resultado) as Consulta<T>;

    consulta.select = () => consulta;

    return consulta;
};

interface RegistroOtp {
    _id: mongoose.Types.ObjectId;
    paciente: mongoose.Types.ObjectId;
    codigoHash: string;
    expiraEn: Date;
    intentosRestantes: number;
    proximoEnvioPermitido: Date;
}

type ModeloPacienteSuplantado = {
    findById: (
        id: string
    ) => Consulta<{ email?: string } | null>;
};

type ModeloOtpSuplantado = {
    findOne: (
        filtro: unknown
    ) => Consulta<RegistroOtp | null>;
    findOneAndUpdate: (
        filtro: unknown,
        actualizacion: unknown,
        opciones?: unknown
    ) => Promise<RegistroOtp | null>;
    findOneAndDelete: (
        filtro: unknown
    ) => Promise<RegistroOtp | null>;
    deleteOne: (filtro: unknown) => Promise<unknown>;
};

const modeloPaciente =
    PacienteModel as unknown as ModeloPacienteSuplantado;
const modeloOtp =
    CodigoOtpPacienteModel as unknown as ModeloOtpSuplantado;

const originalesPaciente = {
    findById: modeloPaciente.findById,
};

const originalesOtp = {
    findOne: modeloOtp.findOne,
    findOneAndUpdate: modeloOtp.findOneAndUpdate,
    findOneAndDelete: modeloOtp.findOneAndDelete,
    deleteOne: modeloOtp.deleteOne,
};

afterEach(() => {
    modeloPaciente.findById = originalesPaciente.findById;
    modeloOtp.findOne = originalesOtp.findOne;
    modeloOtp.findOneAndUpdate =
        originalesOtp.findOneAndUpdate;
    modeloOtp.findOneAndDelete =
        originalesOtp.findOneAndDelete;
    modeloOtp.deleteOne = originalesOtp.deleteOne;

    globalThis.fetch = fetchOriginal;
    console.error = consoleErrorOriginal;

    for (const variable of VARIABLES_BREVO) {
        const valor = entornoOriginal.get(variable);

        if (valor === undefined) {
            delete process.env[variable];

            continue;
        }

        process.env[variable] = valor;
    }
});

// ============================================================
// HELPERS
// ============================================================

const configurarPaciente = (
    resultado: { email?: string } | null
): void => {
    modeloPaciente.findById = () =>
        crearConsulta(resultado);
};

const crearRegistro = async (
    pacienteId: string,
    codigo: string,
    opciones: Partial<RegistroOtp> = {}
): Promise<RegistroOtp> => ({
    _id: new mongoose.Types.ObjectId(),
    paciente: new mongoose.Types.ObjectId(pacienteId),
    codigoHash: await bcrypt.hash(codigo, 4),
    expiraEn: new Date(
        Date.now() + DURACION_CODIGO_OTP_MS
    ),
    intentosRestantes: INTENTOS_VERIFICACION_OTP,
    proximoEnvioPermitido: new Date(
        Date.now() + INTERVALO_REENVIO_OTP_MS
    ),
    ...opciones,
});

const extraerCodigo = (texto: unknown): string => {
    const coincidencia = /(\d{6})/.exec(String(texto));

    assert.ok(
        coincidencia,
        'El email no contiene un código de 6 dígitos'
    );

    return coincidencia[1];
};

interface EspiasVerificacion {
    filtroActualizacion: () => Record<string, any>;
    actualizacion: () => Record<string, any>;
    filtroConsumo: () => Record<string, any>;
    filtroBorrado: () => Record<string, any>;
    llamadas: {
        actualizaciones: number;
        consumos: number;
        borrados: number;
    };
}

const configurarVerificacion = (
    registro: RegistroOtp,
    opciones: {
        intentosActualizados?: number;
        consumo?: RegistroOtp | null;
    } = {}
): EspiasVerificacion => {
    let filtroActualizacion: Record<string, any> = {};
    let actualizacion: Record<string, any> = {};
    let filtroConsumo: Record<string, any> = {};
    let filtroBorrado: Record<string, any> = {};

    const llamadas = {
        actualizaciones: 0,
        consumos: 0,
        borrados: 0,
    };

    modeloOtp.findOne = () => crearConsulta(registro);

    modeloOtp.findOneAndUpdate = async (
        filtro,
        cambio
    ) => {
        llamadas.actualizaciones++;
        filtroActualizacion = filtro as Record<string, any>;
        actualizacion = cambio as Record<string, any>;

        return {
            ...registro,
            intentosRestantes:
                opciones.intentosActualizados ??
                registro.intentosRestantes - 1,
        };
    };

    modeloOtp.findOneAndDelete = async (filtro) => {
        llamadas.consumos++;
        filtroConsumo = filtro as Record<string, any>;

        return opciones.consumo === undefined
            ? registro
            : opciones.consumo;
    };

    modeloOtp.deleteOne = async (filtro) => {
        llamadas.borrados++;
        filtroBorrado = filtro as Record<string, any>;

        return { deletedCount: 1 };
    };

    return {
        filtroActualizacion: () => filtroActualizacion,
        actualizacion: () => actualizacion,
        filtroConsumo: () => filtroConsumo,
        filtroBorrado: () => filtroBorrado,
        llamadas,
    };
};

// ============================================================
// GENERACIÓN DEL CÓDIGO
// ============================================================

test('genera códigos de exactamente 6 dígitos', () => {
    for (let intento = 0; intento < 200; intento++) {
        assert.match(generarCodigoOtp(), /^\d{6}$/);
    }
});

test('conserva los ceros a la izquierda', () => {
    assert.equal(formatearCodigoOtp(0), '000000');
    assert.equal(formatearCodigoOtp(42), '000042');
    assert.equal(formatearCodigoOtp(999999), '999999');
});

// ============================================================
// SOLICITUD DE CÓDIGO
// ============================================================

test('solicita un código, lo envía al email del paciente y guarda solo el hash', async () => {
    configurarBrevo();

    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const email = 'paciente@ejemplo.com';

    configurarPaciente({ email });
    modeloOtp.findOne = () => crearConsulta(null);

    let filtro: Record<string, any> = {};
    let actualizacion: Record<string, any> = {};
    let opciones: Record<string, any> = {};
    let urlEmail: string | undefined;
    let cuerpoEmail: Record<string, any> | undefined;

    modeloOtp.findOneAndUpdate = async (
        filtroRecibido,
        actualizacionRecibida,
        opcionesRecibidas
    ) => {
        filtro = filtroRecibido as Record<string, any>;
        actualizacion =
            actualizacionRecibida as Record<string, any>;
        opciones = opcionesRecibidas as Record<string, any>;

        return {
            _id: new mongoose.Types.ObjectId(),
            paciente: new mongoose.Types.ObjectId(pacienteId),
            ...(actualizacion.$set as Record<string, unknown>),
        } as unknown as RegistroOtp;
    };

    globalThis.fetch = (async (entrada, init) => {
        urlEmail = String(entrada);
        cuerpoEmail = JSON.parse(
            String(init?.body)
        ) as Record<string, any>;

        return new Response(
            JSON.stringify({ messageId: 'otp-prueba' }),
            {
                status: 201,
                headers: { 'content-type': 'application/json' },
            }
        );
    }) as typeof fetch;

    const antes = Date.now();
    const resultado =
        await otpPacienteService.solicitarCodigo(pacienteId);
    const despues = Date.now();

    assert.ok(cuerpoEmail);
    assert.ok(actualizacion.$set);

    const datosGuardados = actualizacion.$set as Record<
        string,
        any
    >;
    const codigo = extraerCodigo(
        cuerpoEmail.textContent
    );

    assert.equal(
        urlEmail,
        'https://api.brevo.com/v3/smtp/email'
    );
    assert.deepEqual(cuerpoEmail.to, [{ email }]);
    assert.equal(cuerpoEmail.subject, 'Código de acceso');
    assert.match(codigo, /^\d{6}$/);

    // Nunca se guarda el código en claro.
    assert.notEqual(datosGuardados.codigoHash, codigo);
    assert.match(
        String(datosGuardados.codigoHash),
        /^\$2[aby]\$/
    );
    assert.equal(
        await bcrypt.compare(
            codigo,
            String(datosGuardados.codigoHash)
        ),
        true
    );

    assert.equal(
        datosGuardados.intentosRestantes,
        INTENTOS_VERIFICACION_OTP
    );
    assert.ok(
        datosGuardados.expiraEn.getTime() >=
            antes + DURACION_CODIGO_OTP_MS - 1000
    );
    assert.ok(
        datosGuardados.expiraEn.getTime() <=
            despues + DURACION_CODIGO_OTP_MS + 1000
    );
    assert.ok(
        datosGuardados.proximoEnvioPermitido.getTime() >=
            antes + INTERVALO_REENVIO_OTP_MS - 1000
    );
    assert.ok(
        datosGuardados.proximoEnvioPermitido.getTime() <=
            despues + INTERVALO_REENVIO_OTP_MS + 1000
    );
    assert.equal(
        datosGuardados.expiraEn.getTime() -
            datosGuardados.proximoEnvioPermitido.getTime(),
        DURACION_CODIGO_OTP_MS - INTERVALO_REENVIO_OTP_MS
    );

    // El filtro atómico solo actualiza cuando el reenvío ya está permitido.
    assert.equal(filtro.paciente, pacienteId);
    assert.equal(
        filtro.$or[0].proximoEnvioPermitido.$lte instanceof
            Date,
        true
    );
    assert.equal(
        filtro.$or[1].proximoEnvioPermitido.$exists,
        false
    );
    assert.equal(opciones.upsert, true);
    assert.equal(
        resultado.expiraEn.getTime(),
        datosGuardados.expiraEn.getTime()
    );
});

test('rechaza la solicitud si el paciente no tiene email', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();

    configurarPaciente({ email: undefined });

    let actualizaciones = 0;
    let envios = 0;

    modeloOtp.findOneAndUpdate = async () => {
        actualizaciones++;

        return null;
    };

    globalThis.fetch = (async () => {
        envios++;

        return new Response(null, { status: 201 });
    }) as typeof fetch;

    await assert.rejects(
        otpPacienteService.solicitarCodigo(pacienteId),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.PACIENTE_SIN_EMAIL
            );

            return true;
        }
    );

    assert.equal(actualizaciones, 0);
    assert.equal(envios, 0);
});

test('rechaza un reenvío antes de los 60 segundos sin generar otro código', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const registro = await crearRegistro(
        pacienteId,
        '123456',
        {
            proximoEnvioPermitido: new Date(
                Date.now() + INTERVALO_REENVIO_OTP_MS
            ),
        }
    );

    configurarPaciente({ email: 'paciente@ejemplo.com' });
    modeloOtp.findOne = () => crearConsulta(registro);

    let actualizaciones = 0;
    let envios = 0;

    modeloOtp.findOneAndUpdate = async () => {
        actualizaciones++;

        return null;
    };

    globalThis.fetch = (async () => {
        envios++;

        return new Response(null, { status: 201 });
    }) as typeof fetch;

    await assert.rejects(
        otpPacienteService.solicitarCodigo(pacienteId),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.REENVIO_DEMASIADO_RAPIDO
            );

            return true;
        }
    );

    assert.equal(actualizaciones, 0);
    assert.equal(envios, 0);
});

test('traduce la colisión atómica de dos solicitudes simultáneas', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();

    configurarPaciente({ email: 'paciente@ejemplo.com' });
    modeloOtp.findOne = () => crearConsulta(null);

    let filtro: Record<string, any> = {};
    let envios = 0;

    modeloOtp.findOneAndUpdate = async (
        filtroRecibido
    ) => {
        filtro = filtroRecibido as Record<string, any>;

        throw Object.assign(new Error('duplicado'), {
            code: 11000,
        });
    };

    globalThis.fetch = (async () => {
        envios++;

        return new Response(null, { status: 201 });
    }) as typeof fetch;

    await assert.rejects(
        otpPacienteService.solicitarCodigo(pacienteId),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.REENVIO_DEMASIADO_RAPIDO
            );

            return true;
        }
    );

    assert.equal(envios, 0);
    assert.equal(filtro.paciente, pacienteId);
    assert.ok(Array.isArray(filtro.$or));
});

test('un reenvío permitido reemplaza el hash anterior y reinicia los intentos', async () => {
    configurarBrevo();

    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const hashAnterior = await bcrypt.hash('111111', 4);

    configurarPaciente({ email: 'paciente@ejemplo.com' });
    modeloOtp.findOne = () => crearConsulta(null);

    let filtro: Record<string, any> = {};
    let actualizacion: Record<string, any> = {};

    modeloOtp.findOneAndUpdate = async (
        filtroRecibido,
        actualizacionRecibida
    ) => {
        filtro = filtroRecibido as Record<string, any>;
        actualizacion =
            actualizacionRecibida as Record<string, any>;

        return {
            _id: new mongoose.Types.ObjectId(),
            paciente: new mongoose.Types.ObjectId(pacienteId),
            ...(actualizacion.$set as Record<string, unknown>),
        } as unknown as RegistroOtp;
    };

    globalThis.fetch = (async () =>
        new Response(JSON.stringify({ messageId: 'otp-2' }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
        })) as typeof fetch;

    const antes = Date.now();

    await otpPacienteService.solicitarCodigo(pacienteId);

    const limiteCooldown =
        filtro.$or[0].proximoEnvioPermitido.$lte;

    assert.ok(limiteCooldown instanceof Date);
    assert.ok(limiteCooldown.getTime() <= Date.now());
    assert.ok(limiteCooldown.getTime() >= antes - 1000);

    // La actualización reemplaza el hash existente; no es un $setOnInsert.
    assert.equal('$setOnInsert' in actualizacion, false);
    assert.ok(actualizacion.$set.codigoHash);
    assert.notEqual(
        actualizacion.$set.codigoHash,
        hashAnterior
    );
    assert.equal(
        actualizacion.$set.intentosRestantes,
        INTENTOS_VERIFICACION_OTP
    );
});

test('si falla el envío de Brevo, invalida únicamente el código generado', async () => {
    configurarBrevo();

    const pacienteId =
        new mongoose.Types.ObjectId().toString();

    configurarPaciente({ email: 'paciente@ejemplo.com' });
    modeloOtp.findOne = () => crearConsulta(null);

    let codigoHash: string | undefined;
    let filtroBorrado: Record<string, any> = {};
    let cuerpoEmail: Record<string, any> | undefined;

    modeloOtp.findOneAndUpdate = async (
        _filtro,
        actualizacion
    ) => {
        const set = (actualizacion as Record<string, any>)
            .$set;

        codigoHash = String(set.codigoHash);

        return {
            _id: new mongoose.Types.ObjectId(),
            paciente: new mongoose.Types.ObjectId(pacienteId),
            ...set,
        } as unknown as RegistroOtp;
    };

    modeloOtp.deleteOne = async (filtro) => {
        filtroBorrado = filtro as Record<string, any>;

        return { deletedCount: 1 };
    };

    globalThis.fetch = (async (_entrada, init) => {
        cuerpoEmail = JSON.parse(
            String(init?.body)
        ) as Record<string, any>;

        return new Response(
            JSON.stringify({
                code: 'unauthorized',
                message: 'detalle interno',
            }),
            { status: 401 }
        );
    }) as typeof fetch;

    console.error = () => undefined;

    await assert.rejects(
        otpPacienteService.solicitarCodigo(pacienteId),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.ERROR_ENVIO
            );
            assert.equal(
                error.message.includes('detalle interno'),
                false
            );

            return true;
        }
    );

    assert.ok(codigoHash);
    assert.ok(cuerpoEmail);

    const codigo = extraerCodigo(cuerpoEmail.textContent);

    assert.equal(
        filtroBorrado.paciente,
        pacienteId
    );
    assert.equal(filtroBorrado.codigoHash, codigoHash);
});

// ============================================================
// VERIFICACIÓN DE CÓDIGO
// ============================================================

test('acepta un código correcto y lo consume', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const codigo = '123456';
    const registro = await crearRegistro(
        pacienteId,
        codigo
    );
    const espia = configurarVerificacion(registro);

    await otpPacienteService.verificarCodigo(
        pacienteId,
        codigo
    );

    assert.equal(espia.llamadas.actualizaciones, 1);
    assert.equal(espia.llamadas.consumos, 1);
    assert.equal(espia.llamadas.borrados, 0);

    const filtro = espia.filtroActualizacion();

    assert.equal(filtro.codigoHash, registro.codigoHash);
    assert.ok(filtro.expiraEn.$gt instanceof Date);
    assert.equal(filtro.intentosRestantes.$gt, 0);
    assert.deepEqual(espia.actualizacion(), {
        $inc: { intentosRestantes: -1 },
    });

    const consumo = espia.filtroConsumo();

    assert.equal(consumo.codigoHash, registro.codigoHash);
    assert.equal(consumo.paciente, pacienteId);
});

test('un código incorrecto descuenta un intento', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const registro = await crearRegistro(
        pacienteId,
        '123456'
    );
    const espia = configurarVerificacion(registro, {
        intentosActualizados: 4,
    });

    await assert.rejects(
        otpPacienteService.verificarCodigo(
            pacienteId,
            '654321'
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.CODIGO_INCORRECTO
            );

            return true;
        }
    );

    assert.equal(espia.llamadas.actualizaciones, 1);
    assert.equal(espia.llamadas.consumos, 0);
    assert.equal(espia.llamadas.borrados, 0);
    assert.deepEqual(espia.actualizacion(), {
        $inc: { intentosRestantes: -1 },
    });
});

test('al agotarse los intentos invalida el código', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const registro = await crearRegistro(
        pacienteId,
        '123456',
        { intentosRestantes: 1 }
    );
    const espia = configurarVerificacion(registro, {
        intentosActualizados: 0,
    });

    await assert.rejects(
        otpPacienteService.verificarCodigo(
            pacienteId,
            '654321'
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.CODIGO_BLOQUEADO
            );

            return true;
        }
    );

    assert.equal(espia.llamadas.actualizaciones, 1);
    assert.equal(espia.llamadas.consumos, 0);
    assert.equal(espia.llamadas.borrados, 1);

    const filtro = espia.filtroBorrado();

    assert.equal(filtro._id, registro._id);
    assert.equal(filtro.codigoHash, registro.codigoHash);
});

test('rechaza un código expirado aunque el TTL no lo haya eliminado', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const registro = await crearRegistro(
        pacienteId,
        '123456',
        { expiraEn: new Date(Date.now() - 1000) }
    );
    const espia = configurarVerificacion(registro);

    await assert.rejects(
        otpPacienteService.verificarCodigo(
            pacienteId,
            '123456'
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.CODIGO_EXPIRADO
            );

            return true;
        }
    );

    assert.equal(espia.llamadas.actualizaciones, 0);
    assert.equal(espia.llamadas.consumos, 0);
    assert.equal(espia.llamadas.borrados, 1);
});

test('rechaza un registro bloqueado antes de comparar', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const registro = await crearRegistro(
        pacienteId,
        '123456',
        { intentosRestantes: 0 }
    );
    const espia = configurarVerificacion(registro);

    await assert.rejects(
        otpPacienteService.verificarCodigo(
            pacienteId,
            '123456'
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.CODIGO_BLOQUEADO
            );

            return true;
        }
    );

    assert.equal(espia.llamadas.actualizaciones, 0);
    assert.equal(espia.llamadas.consumos, 0);
    assert.equal(espia.llamadas.borrados, 1);
});

test('un código consumido no puede volver a utilizarse', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const codigo = '123456';
    const registro = await crearRegistro(
        pacienteId,
        codigo
    );
    const espia = configurarVerificacion(registro, {
        consumo: null,
    });

    await assert.rejects(
        otpPacienteService.verificarCodigo(
            pacienteId,
            codigo
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.CODIGO_UTILIZADO
            );

            return true;
        }
    );

    assert.equal(espia.llamadas.consumos, 1);
    assert.equal(espia.llamadas.borrados, 0);
});

test('una segunda verificación tampoco encuentra el código consumido', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const codigo = '123456';
    const registro = await crearRegistro(
        pacienteId,
        codigo
    );
    const espia = configurarVerificacion(registro);

    await otpPacienteService.verificarCodigo(
        pacienteId,
        codigo
    );

    modeloOtp.findOne = () => crearConsulta(null);

    await assert.rejects(
        otpPacienteService.verificarCodigo(
            pacienteId,
            codigo
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.CODIGO_INEXISTENTE
            );

            return true;
        }
    );

    assert.equal(espia.llamadas.consumos, 1);
});

test('no permite dos verificaciones exitosas concurrentes del mismo código', async () => {
    const pacienteId =
        new mongoose.Types.ObjectId().toString();
    const codigo = '123456';
    const registro = await crearRegistro(
        pacienteId,
        codigo
    );

    let consumos = 0;

    modeloOtp.findOne = () => crearConsulta(registro);

    modeloOtp.findOneAndUpdate = async () => ({
        ...registro,
        intentosRestantes: registro.intentosRestantes - 1,
    });

    modeloOtp.findOneAndDelete = async () => {
        consumos++;

        return consumos === 1 ? registro : null;
    };

    modeloOtp.deleteOne = async () => ({
        deletedCount: 0,
    });

    const resultados = await Promise.allSettled([
        otpPacienteService.verificarCodigo(
            pacienteId,
            codigo
        ),
        otpPacienteService.verificarCodigo(
            pacienteId,
            codigo
        ),
    ]);

    const exitos = resultados.filter(
        (resultado) => resultado.status === 'fulfilled'
    );
    const fallos = resultados.filter(
        (resultado) => resultado.status === 'rejected'
    );

    assert.equal(exitos.length, 1);
    assert.equal(fallos.length, 1);
    assert.equal(consumos, 2);

    const error = (
        fallos[0] as PromiseRejectedResult
    ).reason;

    assert.ok(error instanceof ErrorOtpPaciente);
    assert.equal(
        error.motivo,
        MOTIVOS_ERROR_OTP.CODIGO_UTILIZADO
    );
});

test('rechaza un código con formato inválido sin tocar la base', async () => {
    let lecturas = 0;

    modeloOtp.findOne = () => {
        lecturas++;

        return crearConsulta(null);
    };

    await assert.rejects(
        otpPacienteService.verificarCodigo(
            new mongoose.Types.ObjectId().toString(),
            '12345'
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorOtpPaciente);
            assert.equal(
                error.motivo,
                MOTIVOS_ERROR_OTP.CODIGO_INVALIDO
            );

            return true;
        }
    );

    assert.equal(lecturas, 0);
});
