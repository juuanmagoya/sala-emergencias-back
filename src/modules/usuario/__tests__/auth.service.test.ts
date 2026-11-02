import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import Usuario from '../models/Usuario';
import {
    loginUsuario,
    registrarUsuario,
} from '../../../services/auth.service';
import { login as loginController } from '../../../controllers/auth.controller';
import ErrorConfiguracion from '../../../utils/ErrorConfiguracion';
import {
    ROL_POR_DEFECTO,
    type RolUsuario,
} from '../types/usuario.types';
import type { Response } from 'express';

// Secreto por defecto para los tests que no evalúan la configuración.
process.env.JWT_SECRET ??= 'secreto-de-prueba-login';

// ============================================================
// SUPLANTACIÓN DEL MODELO (sin acceso a la base de datos)
// ============================================================

type ModeloSuplantado = {
    findOne: () => Promise<unknown>;
    create: (datos: Record<string, unknown>) => Promise<unknown>;
};

const modelo = Usuario as unknown as ModeloSuplantado;
const findOneOriginal = modelo.findOne;
const createOriginal = modelo.create;

afterEach(() => {
    modelo.findOne = findOneOriginal;
    modelo.create = createOriginal;
});

const crearUsuarioPersistido = async (
    rol: RolUsuario,
    passwordPlano = 'secreto123',
    medico?: mongoose.Types.ObjectId
) => ({
    _id: new mongoose.Types.ObjectId(),
    nombre: 'Usuario de prueba',
    email: 'usuario@prueba.com',
    password: await bcrypt.hash(passwordPlano, 4),
    rol,
    medico,
});

const guardarJwtSecret = () => process.env.JWT_SECRET;

const restaurarJwtSecret = (valor: string | undefined) => {
    if (valor === undefined) {
        delete process.env.JWT_SECRET;

        return;
    }

    process.env.JWT_SECRET = valor;
};

interface RespuestaFalsa {
    statusCode: number;
    cuerpo?: Record<string, unknown>;
    status: (codigo: number) => RespuestaFalsa;
    json: (cuerpo: Record<string, unknown>) => RespuestaFalsa;
}

const crearRespuestaFalsa = (): RespuestaFalsa => {
    const respuesta: RespuestaFalsa = {
        statusCode: 0,
        status(codigo) {
            this.statusCode = codigo;

            return this;
        },
        json(cuerpo) {
            this.cuerpo = cuerpo;

            return this;
        },
    };

    return respuesta;
};

// ============================================================
// REGISTRO PÚBLICO
// ============================================================

test('el registro público no permite asignarse privilegios', async () => {
    let datosCreados: Record<string, unknown> | undefined;

    modelo.findOne = async () => null;
    modelo.create = async (datos) => {
        datosCreados = datos;

        return {
            _id: new mongoose.Types.ObjectId(),
            ...datos,
        };
    };

    // Simula un cliente que intenta forzar un rol privilegiado.
    const datosDelCliente = {
        nombre: 'Usuario de prueba',
        email: 'usuario@prueba.com',
        password: 'secreto123',
        rol: 'admin',
    };

    const usuario = await registrarUsuario(datosDelCliente);

    assert.equal(datosCreados?.rol, ROL_POR_DEFECTO);
    assert.equal(usuario.rol, ROL_POR_DEFECTO);
});

test('el registro público guarda la contraseña hasheada', async () => {
    let datosCreados: Record<string, unknown> | undefined;

    modelo.findOne = async () => null;
    modelo.create = async (datos) => {
        datosCreados = datos;

        return {
            _id: new mongoose.Types.ObjectId(),
            ...datos,
        };
    };

    await registrarUsuario({
        nombre: 'Usuario de prueba',
        email: 'usuario@prueba.com',
        password: 'secreto123',
    });

    assert.notEqual(datosCreados?.password, 'secreto123');
    assert.match(String(datosCreados?.password), /^\$2[aby]\$/);
});

test('el registro público rechaza un email ya registrado', async () => {
    modelo.findOne = async () => ({ email: 'usuario@prueba.com' });

    await assert.rejects(
        registrarUsuario({
            nombre: 'Usuario de prueba',
            email: 'usuario@prueba.com',
            password: 'secreto123',
        }),
        /El email ya está registrado/
    );
});

// ============================================================
// INICIO DE SESIÓN
// ============================================================

test('el login devuelve un token con el rol real y sin la contraseña', async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba-login';

    const usuarioPersistido = await crearUsuarioPersistido('medico');

    modelo.findOne = async () => usuarioPersistido;

    const resultado = await loginUsuario({
        email: usuarioPersistido.email,
        password: 'secreto123',
    });

    assert.equal(resultado.usuario.rol, 'medico');

    const decodificado = jwt.decode(resultado.token);

    if (decodificado === null || typeof decodificado === 'string') {
        assert.fail('El token no contiene un payload válido');
    }

    assert.equal(decodificado.rol, 'medico');
    assert.equal(decodificado.email, usuarioPersistido.email);
    assert.equal(decodificado.id, usuarioPersistido._id.toString());
    assert.equal('password' in decodificado, false);
    assert.equal('rol' in decodificado, true);
});

test('el login rechaza una contraseña incorrecta', async () => {
    const usuarioPersistido = await crearUsuarioPersistido('admin');

    modelo.findOne = async () => usuarioPersistido;

    await assert.rejects(
        loginUsuario({
            email: usuarioPersistido.email,
            password: 'contraseña-incorrecta',
        }),
        /Credenciales inválidas/
    );
});

test('el login rechaza un usuario inexistente', async () => {
    modelo.findOne = async () => null;

    await assert.rejects(
        loginUsuario({
            email: 'inexistente@prueba.com',
            password: 'secreto123',
        }),
        /Credenciales inválidas/
    );
});

test('el login rechaza un usuario persistido con rol inválido', async () => {
    const usuarioPersistido = await crearUsuarioPersistido('medico');

    modelo.findOne = async () => ({
        ...usuarioPersistido,
        rol: 'superadmin',
    });

    await assert.rejects(
        loginUsuario({
            email: usuarioPersistido.email,
            password: 'secreto123',
        }),
        /El usuario no tiene un rol válido/
    );
});

test('el login incluye el perfil médico asociado en el token', async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba-login';

    const medicoId = new mongoose.Types.ObjectId();
    const usuarioPersistido = await crearUsuarioPersistido(
        'medico',
        'secreto123',
        medicoId
    );

    modelo.findOne = async () => usuarioPersistido;

    const resultado = await loginUsuario({
        email: usuarioPersistido.email,
        password: 'secreto123',
    });

    assert.equal(resultado.usuario.medico, medicoId.toString());

    const decodificado = jwt.decode(resultado.token);

    if (decodificado === null || typeof decodificado === 'string') {
        assert.fail('El token no contiene un payload válido');
    }

    assert.equal(decodificado.medico, medicoId.toString());
});

test('el login no inventa un perfil médico inexistente', async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba-login';

    const usuarioPersistido = await crearUsuarioPersistido(
        'recepcionista'
    );

    modelo.findOne = async () => usuarioPersistido;

    const resultado = await loginUsuario({
        email: usuarioPersistido.email,
        password: 'secreto123',
    });

    assert.equal(resultado.usuario.medico, null);

    const decodificado = jwt.decode(resultado.token);

    if (decodificado === null || typeof decodificado === 'string') {
        assert.fail('El token no contiene un payload válido');
    }

    assert.equal('medico' in decodificado, false);
});

// ============================================================
// CONFIGURACIÓN DE JWT
// ============================================================

test('el login trata la ausencia de JWT_SECRET como error de configuración', async () => {
    const secretoOriginal = guardarJwtSecret();

    delete process.env.JWT_SECRET;

    try {
        modelo.findOne = async () => null;

        await assert.rejects(
            loginUsuario({
                email: 'usuario@prueba.com',
                password: 'secreto123',
            }),
            (error: unknown) => {
                assert.ok(error instanceof ErrorConfiguracion);
                assert.match(
                    (error as Error).message,
                    /JWT_SECRET no está configurado/
                );

                return true;
            }
        );

    } finally {
        restaurarJwtSecret(secretoOriginal);
    }
});

test('el controller de login responde 500 y no 401 si falta JWT_SECRET', async () => {
    const secretoOriginal = guardarJwtSecret();

    delete process.env.JWT_SECRET;

    try {
        const respuestaFalsa = crearRespuestaFalsa();

        await loginController(
            {
                body: {
                    email: 'usuario@prueba.com',
                    password: 'secreto123',
                },
            } as unknown as Parameters<typeof loginController>[0],
            respuestaFalsa as unknown as Response
        );

        assert.equal(respuestaFalsa.statusCode, 500);
        assert.equal(respuestaFalsa.cuerpo?.success, false);
        assert.equal(
            respuestaFalsa.cuerpo?.message,
            'Error interno del servidor'
        );
        // No se expone el nombre de la variable ni detalles de configuración.
        assert.equal(
            String(respuestaFalsa.cuerpo?.message).includes('JWT_SECRET'),
            false
        );
        assert.equal(typeof respuestaFalsa.cuerpo?.timestamp, 'string');
        assert.ok('total' in (respuestaFalsa.cuerpo ?? {}));
        assert.ok('data' in (respuestaFalsa.cuerpo ?? {}));

    } finally {
        restaurarJwtSecret(secretoOriginal);
    }
});
