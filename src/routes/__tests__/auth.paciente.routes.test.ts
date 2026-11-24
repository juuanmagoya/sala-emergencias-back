
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, test } from 'node:test';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../../app';
import PacienteModel from '../../modules/pacientes/models/Paciente';
import otpPacienteService from '../../modules/autenticacionPaciente/services/otpPaciente.service';
import medicoService from '../../modules/medico/services/medico.service';
import usuarioService from '../../modules/usuario/services/usuario.service';
import type { RolUsuario } from '../../modules/usuario/types/usuario.types';

// ============================================================
// SERVIDOR REAL CON TODAS LAS RUTAS MONTADAS
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-paciente-rutas';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
});

// ============================================================
// HELPERS
// ============================================================

type ConsultaPacientes = Promise<unknown[]> & {
    select: () => ConsultaPacientes;
    limit: () => ConsultaPacientes;
};

const crearConsulta = (resultado: unknown[]): ConsultaPacientes => {
    const consulta = Promise.resolve(resultado) as ConsultaPacientes;

    consulta.select = () => consulta;
    consulta.limit = () => consulta;

    return consulta;
};

type ModeloPacienteSuplantado = {
    find: (filtro: unknown) => ConsultaPacientes;
    exists: (filtro: unknown) => Promise<unknown>;
};

const modeloPaciente = PacienteModel as unknown as ModeloPacienteSuplantado;

const originalesPaciente = {
    find: modeloPaciente.find,
    exists: modeloPaciente.exists,
};

type ServicioUsuarios = {
    getUsuarios: (filtro: unknown) => Promise<unknown>;
};

type ServicioMedicos = {
    getMedicos: (filtro: unknown) => Promise<unknown>;
};

type ServicioOtpPaciente = {
    solicitarCodigo: (
        pacienteId: string
    ) => Promise<{
        expiraEn: Date;
        proximoEnvioPermitido: Date;
    }>;

    verificarCodigo: (
        pacienteId: string,
        codigo: string
    ) => Promise<void>;
};

const usuarios = usuarioService as unknown as ServicioUsuarios;
const medicos = medicoService as unknown as ServicioMedicos;
const servicioOtp = otpPacienteService as unknown as ServicioOtpPaciente;

const originalesUsuarios = {
    getUsuarios: usuarios.getUsuarios,
};

const originalesMedicos = {
    getMedicos: medicos.getMedicos,
};

const originalSolicitarCodigo = servicioOtp.solicitarCodigo;
const originalVerificarCodigo = servicioOtp.verificarCodigo;

afterEach(() => {
    modeloPaciente.find = originalesPaciente.find;
    modeloPaciente.exists = originalesPaciente.exists;

    usuarios.getUsuarios = originalesUsuarios.getUsuarios;
    medicos.getMedicos = originalesMedicos.getMedicos;

    servicioOtp.solicitarCodigo = originalSolicitarCodigo;
    servicioOtp.verificarCodigo = originalVerificarCodigo;
});

interface PacientePersistido {
    _id: mongoose.Types.ObjectId;
    nombre: string;
    telefono: {
        tipo: 'CELULAR';
        codigoArea: string;
        numero: string;
    };
}

const crearPaciente = (): PacientePersistido => ({
    _id: new mongoose.Types.ObjectId(),
    nombre: 'PACIENTE DE PRUEBA',
    telefono: {
        tipo: 'CELULAR',
        codigoArea: '3777',
        numero: '1234567',
    },
});

const crearTokenInterno = (
    rol: RolUsuario,
    incluirTipo = false
) =>
    jwt.sign(
        {
            ...(incluirTipo ? { tipo: 'usuario' } : {}),
            id: '507f1f77bcf86cd799439011',
            email: 'prueba@sala.com',
            rol,
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const crearTokenPaciente = (
    id: string,
    rol: string = 'paciente',
    secreto: string = JWT_SECRET_PRUEBA
) =>
    jwt.sign(
        {
            tipo: 'paciente',
            id,
            rol,
        },
        secreto,
        { expiresIn: '1h' }
    );

interface OpcionesSolicitud {
    token?: string;
    cuerpo?: unknown;
}

const solicitar = (
    metodo: string,
    ruta: string,
    opciones: OpcionesSolicitud = {}
) => {
    const headers: Record<string, string> = {};

    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }

    if (opciones.cuerpo !== undefined) {
        headers['content-type'] = 'application/json';
    }

    return fetch(`${urlBase}${ruta}`, {
        method: metodo,
        headers,
        body:
            opciones.cuerpo === undefined
                ? undefined
                : JSON.stringify(opciones.cuerpo),
    });
};

const leerCuerpo = async (respuesta: Response) =>
    (await respuesta.json()) as Record<string, unknown>;

const verificarFormatoEstandar = (cuerpo: Record<string, unknown>) => {
    assert.equal(typeof cuerpo.success, 'boolean');
    assert.equal(typeof cuerpo.timestamp, 'string');
    assert.equal(typeof cuerpo.message, 'string');
    assert.ok('total' in cuerpo);
    assert.ok('data' in cuerpo);
};

const habilitarPacienteExistente = () => {
    modeloPaciente.exists = async () => ({
        _id: new mongoose.Types.ObjectId(),
    });
};

const simularSolicitudOtp = () => {
    servicioOtp.solicitarCodigo = async () => ({
        expiraEn: new Date(Date.now() + 5 * 60 * 1000),
        proximoEnvioPermitido: new Date(Date.now() + 60 * 1000),
    });
};
const simularVerificacionOtp = () => {
    servicioOtp.verificarCodigo = async () => undefined;
};

const simularFalloVerificacionOtp = (
    mensaje: string,
    statusCode = 401
) => {
    servicioOtp.verificarCodigo = async () => {
        throw Object.assign(new Error(mensaje), { statusCode });
    };
};


// ============================================================
// ENDPOINT DE LOGIN DE PACIENTES
// ============================================================

test('el login de pacientes es público y exige DNI y teléfono', async () => {
    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/login',
        { cuerpo: {} }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.message, 'DNI y teléfono son obligatorios');

    verificarFormatoEstandar(cuerpo);
});

test('el login de pacientes solicita un código OTP sin entregar un JWT', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    simularSolicitudOtp();

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/login',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);
    const datos = cuerpo.data as Record<string, unknown>;

    assert.equal(respuesta.status, 202);
    assert.equal(cuerpo.success, true);

    assert.equal(
        cuerpo.message,
        'Te enviamos un código de verificación al correo registrado'
    );

    assert.equal(typeof datos.expiraEn, 'string');
    assert.equal(typeof datos.proximoEnvioPermitido, 'string');

    assert.equal('token' in datos, false);
    assert.equal('paciente' in datos, false);

    verificarFormatoEstandar(cuerpo);
});

test('el login de paciente ignora email, contraseña, rol y tipo enviados por el cliente', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    simularSolicitudOtp();

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/login',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                email: 'otro@correo.com',
                password: 'no-se-usa',
                rol: 'admin',
                tipo: 'usuario',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);
    const datos = cuerpo.data as Record<string, unknown>;

    assert.equal(respuesta.status, 202);
    assert.equal(cuerpo.success, true);

    assert.equal('token' in datos, false);
    assert.equal('paciente' in datos, false);
    assert.equal('email' in datos, false);
    assert.equal('rol' in datos, false);
    assert.equal('tipo' in datos, false);

    verificarFormatoEstandar(cuerpo);
});

test('el login de pacientes responde igual ante DNI o teléfono incorrectos', async () => {
    modeloPaciente.find = () => crearConsulta([]);

    const porDni = await solicitar(
        'POST',
        '/api/v1/auth/paciente/login',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
            },
        }
    );

    const cuerpoPorDni = await leerCuerpo(porDni);

    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    const porTelefono = await solicitar(
        'POST',
        '/api/v1/auth/paciente/login',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-9999999',
            },
        }
    );

    const cuerpoPorTelefono = await leerCuerpo(porTelefono);

    assert.equal(porDni.status, 401);
    assert.equal(porTelefono.status, 401);

    assert.equal(cuerpoPorDni.message, cuerpoPorTelefono.message);
    assert.equal(cuerpoPorDni.message, 'DNI o teléfono incorrectos');

    assert.equal(cuerpoPorDni.data, null);
    assert.equal(cuerpoPorTelefono.data, null);
});


// ============================================================
// VERIFICACIÓN OTP Y EMISIÓN DEL JWT
// ============================================================

test('un OTP correcto permite iniciar sesión y devuelve un JWT de paciente', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);
    simularVerificacionOtp();

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                codigo: '123456',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);
    const datos = cuerpo.data as Record<string, unknown>;
    const pacienteRespuesta = datos.paciente as Record<string, unknown>;

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.success, true);
    assert.equal(cuerpo.message, 'Login de paciente exitoso');

    assert.equal(typeof datos.token, 'string');
    assert.equal(pacienteRespuesta.rol, 'paciente');
    assert.equal(pacienteRespuesta.nombre, paciente.nombre);
    assert.equal(pacienteRespuesta.id, paciente._id.toString());

    const payload = jwt.verify(
        datos.token as string,
        JWT_SECRET_PRUEBA
    ) as jwt.JwtPayload;

    assert.equal(payload.tipo, 'paciente');
    assert.equal(payload.id, paciente._id.toString());
    assert.equal(payload.rol, 'paciente');

    // El JWT no debe contener información personal del paciente.
    assert.equal('dni' in payload, false);
    assert.equal('telefono' in payload, false);
    assert.equal('email' in payload, false);
    assert.equal('password' in payload, false);

    verificarFormatoEstandar(cuerpo);
});

test('un OTP incorrecto no permite emitir un JWT', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    simularFalloVerificacionOtp('Código incorrecto');

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                codigo: '999999',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);

    verificarFormatoEstandar(cuerpo);
});

test('un OTP expirado no permite emitir un JWT', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    simularFalloVerificacionOtp('El código ha expirado');

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                codigo: '123456',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
});

test('un OTP bloqueado no permite emitir un JWT', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    simularFalloVerificacionOtp('Se agotaron los intentos de verificación');

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                codigo: '123456',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
});

test('un OTP ya utilizado no permite emitir otro JWT', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    simularFalloVerificacionOtp('El código ya fue utilizado');

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                codigo: '123456',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
});

test('la verificación exige DNI, teléfono y código', async () => {
    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);

    verificarFormatoEstandar(cuerpo);
});

test('la verificación rechaza DNI o teléfono incorrectos sin emitir JWT', async () => {
    modeloPaciente.find = () => crearConsulta([]);

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                codigo: '123456',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
});

test('la verificación rechaza un código con formato inválido sin emitir JWT', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    simularFalloVerificacionOtp('El código debe tener 6 dígitos', 400);

    const respuesta = await solicitar(
        'POST',
        '/api/v1/auth/paciente/verificar',
        {
            cuerpo: {
                dni: '30123456',
                telefono: '3777-1234567',
                codigo: 'ABC',
            },
        }
    );

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 400);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
});



// ============================================================
// AUTORIZACIÓN DE PACIENTES
// ============================================================

test('un token de paciente no accede a rutas administrativas ni de gestión', async () => {
    habilitarPacienteExistente();

    const token = crearTokenPaciente(
        new mongoose.Types.ObjectId().toString()
    );

    const rutas = [
        '/api/v1/usuarios',
        '/api/v1/pacientes',
        '/api/v1/medicos',
        '/api/v1/turnos',
        '/api/v1/historias-clinicas',
        '/api/v1/consultorios',
        '/api/v1/especialidades',
    ];

    for (const ruta of rutas) {
        const respuesta = await solicitar('GET', ruta, { token });

        assert.equal(respuesta.status, 403, `Ruta inesperada: ${ruta}`);
    }
});

test('un token de paciente con un paciente inexistente es rechazado', async () => {
    modeloPaciente.exists = async () => null;

    const token = crearTokenPaciente(
        new mongoose.Types.ObjectId().toString()
    );

    const respuesta = await solicitar('GET', '/api/v1/pacientes', {
        token,
    });

    assert.equal(respuesta.status, 401);
});

test('un token de paciente no puede elevar su rol a administrador', async () => {
    habilitarPacienteExistente();

    const token = crearTokenPaciente(
        new mongoose.Types.ObjectId().toString(),
        'admin'
    );

    const respuesta = await solicitar('GET', '/api/v1/usuarios', {
        token,
    });

    assert.equal(respuesta.status, 401);
});

test('un token interno no puede declararse paciente para saltar la autorización', async () => {
    const token = jwt.sign(
        {
            tipo: 'usuario',
            id: '507f1f77bcf86cd799439011',
            email: 'prueba@sala.com',
            rol: 'paciente',
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

    const respuesta = await solicitar('GET', '/api/v1/usuarios', {
        token,
    });

    assert.equal(respuesta.status, 401);
});

test('un token de paciente con un identificador inválido es rechazado', async () => {
    const token = crearTokenPaciente('paciente', 'no-es-un-objectid');

    const respuesta = await solicitar('GET', '/api/v1/pacientes', {
        token,
    });

    assert.equal(respuesta.status, 401);
});

test('un token de paciente firmado con otro secreto es rechazado', async () => {
    habilitarPacienteExistente();

    const token = crearTokenPaciente(
        new mongoose.Types.ObjectId().toString(),
        'paciente',
        'otro-secreto'
    );

    const respuesta = await solicitar('GET', '/api/v1/pacientes', {
        token,
    });

    assert.equal(respuesta.status, 401);
});

// ============================================================
// COMPATIBILIDAD CON USUARIOS INTERNOS
// ============================================================

test('los JWT internos legacy y nuevos siguen siendo reconocidos', async () => {
    usuarios.getUsuarios = async () => [];
    medicos.getMedicos = async () => [];

    const adminLegacy = await solicitar('GET', '/api/v1/usuarios', {
        token: crearTokenInterno('admin'),
    });

    const adminNuevo = await solicitar('GET', '/api/v1/usuarios', {
        token: crearTokenInterno('admin', true),
    });

    const medicoLegacy = await solicitar('GET', '/api/v1/medicos', {
        token: crearTokenInterno('medico'),
    });

    const recepcionistaLegacy = await solicitar(
        'GET',
        '/api/v1/medicos',
        {
            token: crearTokenInterno('recepcionista'),
        }
    );

    assert.equal(adminLegacy.status, 200);
    assert.equal(adminNuevo.status, 200);
    assert.equal(medicoLegacy.status, 200);
    assert.equal(recepcionistaLegacy.status, 200);
});

test('los permisos de los roles internos no cambiaron', async () => {
    usuarios.getUsuarios = async () => [];

    const medico = await solicitar('GET', '/api/v1/usuarios', {
        token: crearTokenInterno('medico'),
    });

    const recepcionista = await solicitar(
        'GET',
        '/api/v1/usuarios',
        {
            token: crearTokenInterno('recepcionista'),
        }
    );

    assert.equal(medico.status, 403);
    assert.equal(recepcionista.status, 403);
});
