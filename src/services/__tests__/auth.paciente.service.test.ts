import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import PacienteModel from '../../modules/pacientes/models/Paciente';
import UsuarioModel from '../../modules/usuario/models/Usuario';
import { loginPaciente } from '../auth.service';
import ErrorConfiguracion from '../../utils/ErrorConfiguracion';
import {
    coincideTelefono,
    normalizarDni,
    normalizarTelefono,
} from '../../utils/credencialesPaciente';

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-paciente';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

// ============================================================
// SUPLANTACIÓN DEL MODELO (sin acceso a la base de datos)
// ============================================================

type ConsultaPacientes = Promise<unknown[]> & {
    select: (campos?: string) => ConsultaPacientes;
    limit: (cantidad?: number) => ConsultaPacientes;
};

const crearConsulta = (resultado: unknown[]): ConsultaPacientes => {
    const consulta = Promise.resolve(resultado) as ConsultaPacientes;

    consulta.select = () => consulta;
    consulta.limit = () => consulta;

    return consulta;
};

type ModeloPacienteSuplantado = {
    find: (filtro: unknown) => ConsultaPacientes;
};

const modeloPaciente = PacienteModel as unknown as ModeloPacienteSuplantado;
const findOriginal = modeloPaciente.find;

afterEach(() => {
    modeloPaciente.find = findOriginal;
    process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
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

const crearPaciente = (
    telefono: PacientePersistido['telefono'] = {
        tipo: 'CELULAR',
        codigoArea: '3777',
        numero: '1234567',
    }
): PacientePersistido => ({
    _id: new mongoose.Types.ObjectId(),
    nombre: 'PACIENTE DE PRUEBA',
    telefono,
});

const decodificarToken = (token: string): Record<string, unknown> => {
    const decodificado = jwt.decode(token);

    if (decodificado === null || typeof decodificado === 'string') {
        assert.fail('El token no contiene un payload válido');
    }

    return decodificado as Record<string, unknown>;
};

// ============================================================
// LOGIN EXITOSO
// ============================================================

test('el login de paciente devuelve un JWT de tipo paciente y sin datos personales', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    const resultado = await loginPaciente({
        dni: '30.123.456',
        telefono: '3777-1234567',
    });

    assert.equal(resultado.paciente.id, paciente._id.toString());
    assert.equal(resultado.paciente.nombre, paciente.nombre);
    assert.equal(resultado.paciente.rol, 'paciente');
    assert.equal('dni' in resultado.paciente, false);
    assert.equal('telefono' in resultado.paciente, false);
    assert.equal('email' in resultado.paciente, false);

    const decodificado = decodificarToken(resultado.token);

    assert.equal(decodificado.tipo, 'paciente');
    assert.equal(decodificado.rol, 'paciente');
    assert.equal(decodificado.id, paciente._id.toString());
    assert.equal('dni' in decodificado, false);
    assert.equal('telefono' in decodificado, false);
    assert.equal('email' in decodificado, false);
    assert.equal('medico' in decodificado, false);
    assert.equal(
        Number(decodificado.exp) - Number(decodificado.iat),
        5 * 60 * 60
    );

    assert.ok(jwt.verify(resultado.token, JWT_SECRET_PRUEBA));
});

test('acepta variantes de formato del teléfono sin modificar la base', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    const variantes = [
        '37771234567',
        '3777-1234567',
        '+54 3777 1234567',
        '+54 9 3777 1234567',
        '03777 1234567',
        '3777 15 1234567',
    ];

    for (const telefono of variantes) {
        const resultado = await loginPaciente({
            dni: '30123456',
            telefono,
        });

        assert.equal(resultado.paciente.id, paciente._id.toString());
    }
});

test('normaliza el DNI, limita la consulta y proyecta solo datos necesarios', async () => {
    const paciente = crearPaciente();
    let filtro: unknown;
    let proyeccion: string | undefined;
    let limite: number | undefined;

    const consulta = crearConsulta([paciente]);

    consulta.select = (campos) => {
        proyeccion = campos;

        return consulta;
    };
    consulta.limit = (cantidad) => {
        limite = cantidad;

        return consulta;
    };

    modeloPaciente.find = (filtroRecibido) => {
        filtro = filtroRecibido;

        return consulta;
    };

    await loginPaciente({
        dni: '01234567',
        telefono: '3777-1234567',
    });

    assert.deepEqual(filtro, {
        dni: { $in: ['01234567', '1234567'] },
    });
    assert.equal(proyeccion, 'nombre telefono');
    assert.equal(limite, 2);
});

// ============================================================
// CREDENCIALES INCORRECTAS
// ============================================================

test('rechaza un DNI inexistente con un mensaje genérico', async () => {
    modeloPaciente.find = () => crearConsulta([]);

    await assert.rejects(
        loginPaciente({
            dni: '30123456',
            telefono: '3777-1234567',
        }),
        (error: unknown) => {
            assert.ok(error instanceof Error);
            assert.equal(error.message, 'DNI o teléfono incorrectos');
            assert.equal(
                (error as { statusCode?: number }).statusCode,
                401
            );

            return true;
        }
    );
});

test('rechaza un teléfono incorrecto sin revelar si el DNI existe', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    await assert.rejects(
        loginPaciente({
            dni: '30123456',
            telefono: '3777-9999999',
        }),
        /DNI o teléfono incorrectos/
    );
});

test('rechaza el teléfono de otro paciente', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    await assert.rejects(
        loginPaciente({
            dni: '30123456',
            telefono: '3777-7654321',
        }),
        /DNI o teléfono incorrectos/
    );
});

test('rechaza datos ambiguos si el DNI coincide con más de un documento', async () => {
    modeloPaciente.find = () =>
        crearConsulta([crearPaciente(), crearPaciente()]);

    await assert.rejects(
        loginPaciente({
            dni: '30123456',
            telefono: '3777-1234567',
        }),
        /DNI o teléfono incorrectos/
    );
});

test('rechaza una ficha sin teléfono con el mismo error genérico', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () =>
        crearConsulta([{ ...paciente, telefono: undefined }]);

    await assert.rejects(
        loginPaciente({
            dni: '30123456',
            telefono: '3777-1234567',
        }),
        /DNI o teléfono incorrectos/
    );
});

test('rechaza una ficha con teléfono legacy no estructurado', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () =>
        crearConsulta([{ ...paciente, telefono: '3777-1234567' }]);

    await assert.rejects(
        loginPaciente({
            dni: '30123456',
            telefono: '3777-1234567',
        }),
        /DNI o teléfono incorrectos/
    );
});

test('rechaza un DNI con formato inválido', async () => {
    await assert.rejects(
        loginPaciente({
            dni: '123',
            telefono: '3777-1234567',
        }),
        /El DNI no es válido/
    );
});

test('rechaza un teléfono con formato inválido', async () => {
    await assert.rejects(
        loginPaciente({
            dni: '30123456',
            telefono: 'sin-numeros',
        }),
        /El teléfono no es válido/
    );
});

// ============================================================
// SEGURIDAD
// ============================================================

test('el login de paciente no modifica el documento del paciente', async () => {
    const paciente = crearPaciente();
    const copia = JSON.parse(JSON.stringify(paciente)) as unknown;

    modeloPaciente.find = () => crearConsulta([paciente]);

    await loginPaciente({
        dni: '30123456',
        telefono: '3777-1234567',
    });

    assert.deepEqual(JSON.parse(JSON.stringify(paciente)), copia);
});

test('el login de paciente no crea documentos en Usuario', async () => {
    const paciente = crearPaciente();

    modeloPaciente.find = () => crearConsulta([paciente]);

    const modeloUsuario = UsuarioModel as unknown as {
        create: (...argumentos: unknown[]) => Promise<unknown>;
    };
    const createOriginal = modeloUsuario.create;
    let creaciones = 0;

    modeloUsuario.create = async () => {
        creaciones += 1;

        return {};
    };

    try {
        await loginPaciente({
            dni: '30123456',
            telefono: '3777-1234567',
        });
    } finally {
        modeloUsuario.create = createOriginal;
    }

    assert.equal(creaciones, 0);
});

test('no acepta solo el número sin código de área', () => {
    const variantes = normalizarTelefono('1234567');

    assert.equal(
        coincideTelefono(variantes, {
            tipo: 'CELULAR',
            codigoArea: '3777',
            numero: '1234567',
        }),
        false
    );
});

test('normalizarDni descarta valores que no son texto', () => {
    assert.deepEqual(normalizarDni(undefined), []);
    assert.deepEqual(normalizarDni(30123456), []);
});

test('el login de paciente trata la ausencia de JWT_SECRET como error de configuración', async () => {
    const secretoOriginal = process.env.JWT_SECRET;

    delete process.env.JWT_SECRET;

    try {
        await assert.rejects(
            loginPaciente({
                dni: '30123456',
                telefono: '3777-1234567',
            }),
            (error: unknown) => error instanceof ErrorConfiguracion
        );
    } finally {
        process.env.JWT_SECRET = secretoOriginal;
    }
});
