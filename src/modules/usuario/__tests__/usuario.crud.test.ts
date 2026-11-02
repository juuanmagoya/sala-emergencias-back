import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import MedicoModel from '../../medico/models/Medico';
import UsuarioModel from '../models/Usuario';
import usuarioService from '../services/usuario.service';

// ============================================================
// HELPERS
// ============================================================

const crearConsulta = (resultado: unknown) => {
    const consulta = Promise.resolve(resultado) as Promise<unknown> & {
        select: () => typeof consulta;
        populate: () => typeof consulta;
        sort: () => typeof consulta;
    };

    consulta.select = () => consulta;
    consulta.populate = () => consulta;
    consulta.sort = () => consulta;

    return consulta;
};

const crearUsuarioBase = (
    datos: Record<string, unknown> = {}
) => ({
    _id: new mongoose.Types.ObjectId(),
    nombre: 'Usuario de prueba',
    email: 'usuario@prueba.com',
    password: 'hash-de-prueba',
    rol: 'recepcionista',
    activo: true,
    ...datos,
});

const obtenerError = async (promesa: Promise<unknown>) => {
    try {
        await promesa;
    } catch (error: unknown) {
        return error as Error & { statusCode?: number };
    }

    assert.fail('Se esperaba un error');
};

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// CREACIÓN
// ============================================================

test('rechaza crear un usuario con rol admin', async () => {
    const error = await obtenerError(
        usuarioService.createUsuario({
            nombre: 'Admin',
            email: 'admin@prueba.com',
            password: 'secreto123',
            rol: 'admin' as never,
        })
    );

    assert.equal(error.statusCode, 400);
    assert.match(error.message, /rol debe ser medico o recepcionista/);
});

test('exige un médico cuando el rol es medico', async () => {
    const error = await obtenerError(
        usuarioService.createUsuario({
            nombre: 'Médico',
            email: 'medico@prueba.com',
            password: 'secreto123',
            rol: 'medico',
        })
    );

    assert.equal(error.statusCode, 400);
    assert.match(error.message, /médico es obligatorio/);
});

test('rechaza asociar un médico a un recepcionista', async () => {
    const error = await obtenerError(
        usuarioService.createUsuario({
            nombre: 'Recepción',
            email: 'recepcion@prueba.com',
            password: 'secreto123',
            rol: 'recepcionista',
            medico: new mongoose.Types.ObjectId().toString(),
        })
    );

    assert.equal(error.statusCode, 400);
    assert.match(error.message, /no puede tener un médico asociado/);
});

test('hashea la contraseña y guarda la relación con el médico', async () => {
    const medicoId = new mongoose.Types.ObjectId();
    let datosCreados: Record<string, unknown> | undefined;

    mock.method(MedicoModel, 'exists', async () => ({
        _id: medicoId,
    }));

    mock.method(UsuarioModel, 'exists', async () => null);

    mock.method(
        UsuarioModel,
        'create',
        async (datos: Record<string, unknown>) => {
            datosCreados = datos;

            return {
                _id: new mongoose.Types.ObjectId(),
                ...datos,
            };
        }
    );

    mock.method(
        usuarioService,
        'getUsuarioById',
        async () => ({ id: 'usuario-creado' })
    );

    await usuarioService.createUsuario({
        nombre: '  Médico de prueba  ',
        email: 'MEDICO@PRUEBA.COM',
        password: 'secreto123',
        rol: 'medico',
        medico: medicoId.toString(),
    });

    assert.equal(datosCreados?.nombre, 'Médico de prueba');
    assert.equal(datosCreados?.email, 'medico@prueba.com');
    assert.equal(datosCreados?.rol, 'medico');
    assert.equal(
        String(datosCreados?.medico),
        medicoId.toString()
    );
    assert.notEqual(datosCreados?.password, 'secreto123');
    assert.match(String(datosCreados?.password), /^\$2[aby]\$/);
    assert.equal(
        await bcrypt.compare(
            'secreto123',
            String(datosCreados?.password)
        ),
        true
    );
});

test('rechaza un email duplicado', async () => {
    mock.method(UsuarioModel, 'exists', async () => ({
        _id: new mongoose.Types.ObjectId(),
    }));

    const error = await obtenerError(
        usuarioService.createUsuario({
            nombre: 'Recepción',
            email: 'repetido@prueba.com',
            password: 'secreto123',
            rol: 'recepcionista',
        })
    );

    assert.equal(error.statusCode, 409);
    assert.match(error.message, /email ya está registrado/);
});

test('rechaza un médico ya asociado a otro usuario', async () => {
    const medicoId = new mongoose.Types.ObjectId();

    mock.method(MedicoModel, 'exists', async () => ({
        _id: medicoId,
    }));

    mock.method(
        UsuarioModel,
        'exists',
        async (filtro: Record<string, unknown>) =>
            filtro.medico
                ? { _id: new mongoose.Types.ObjectId() }
                : null
    );

    const error = await obtenerError(
        usuarioService.createUsuario({
            nombre: 'Médico',
            email: 'medico@prueba.com',
            password: 'secreto123',
            rol: 'medico',
            medico: medicoId.toString(),
        })
    );

    assert.equal(error.statusCode, 409);
    assert.match(
        error.message,
        /médico ya está asociado a otro usuario/
    );
});

test('traduce el duplicado del índice único ante solicitudes simultáneas', async () => {
    const medicoId = new mongoose.Types.ObjectId();

    mock.method(MedicoModel, 'exists', async () => ({
        _id: medicoId,
    }));

    mock.method(UsuarioModel, 'exists', async () => null);

    mock.method(UsuarioModel, 'create', async () => {
        throw Object.assign(new Error('E11000 duplicate key'), {
            code: 11000,
            keyPattern: { medico: 1 },
        });
    });

    const error = await obtenerError(
        usuarioService.createUsuario({
            nombre: 'Médico',
            email: 'medico@prueba.com',
            password: 'secreto123',
            rol: 'medico',
            medico: medicoId.toString(),
        })
    );

    assert.equal(error.statusCode, 409);
    assert.match(
        error.message,
        /médico ya está asociado a otro usuario/
    );
});

// ============================================================
// ACTUALIZACIÓN
// ============================================================

test('al pasar de medico a recepcionista elimina la asociación', async () => {
    const usuario = crearUsuarioBase({
        rol: 'medico',
        medico: new mongoose.Types.ObjectId(),
    });

    let actualizacion: Record<string, any> | undefined;

    mock.method(UsuarioModel, 'findById', () =>
        crearConsulta(usuario)
    );

    mock.method(
        UsuarioModel,
        'findByIdAndUpdate',
        (_id: unknown, datos: Record<string, any>) => {
            actualizacion = datos;

            return crearConsulta({
                ...usuario,
                rol: 'recepcionista',
                medico: undefined,
            });
        }
    );

    await usuarioService.updateUsuario(
        usuario._id.toString(),
        { rol: 'recepcionista' }
    );

    assert.equal(
        actualizacion?.$set?.rol,
        'recepcionista'
    );
    assert.equal(actualizacion?.$unset?.medico, 1);
    assert.equal(
        'medico' in (actualizacion?.$set ?? {}),
        false
    );
});

test('al pasar de recepcionista a medico exige un médico', async () => {
    const usuario = crearUsuarioBase({
        rol: 'recepcionista',
    });

    mock.method(UsuarioModel, 'findById', () =>
        crearConsulta(usuario)
    );

    const error = await obtenerError(
        usuarioService.updateUsuario(
            usuario._id.toString(),
            { rol: 'medico' }
        )
    );

    assert.equal(error.statusCode, 400);
    assert.match(error.message, /médico es obligatorio/);
});

test('no permite modificar un usuario administrador', async () => {
    const usuario = crearUsuarioBase({ rol: 'admin' });

    mock.method(UsuarioModel, 'findById', () =>
        crearConsulta(usuario)
    );

    const error = await obtenerError(
        usuarioService.updateUsuario(
            usuario._id.toString(),
            { nombre: 'Otro nombre' }
        )
    );

    assert.equal(error.statusCode, 403);
    assert.match(
        error.message,
        /No se puede modificar un usuario administrador/
    );
});

// ============================================================
// BAJA LÓGICA
// ============================================================

test('desactivar un usuario no modifica su perfil médico', async () => {
    const medicoId = new mongoose.Types.ObjectId();
    const usuario = crearUsuarioBase({
        rol: 'medico',
        medico: medicoId,
    });

    let actualizacion: Record<string, any> | undefined;

    mock.method(UsuarioModel, 'findById', () =>
        crearConsulta(usuario)
    );

    mock.method(
        UsuarioModel,
        'findByIdAndUpdate',
        (_id: unknown, datos: Record<string, any>) => {
            actualizacion = datos;

            return crearConsulta({
                ...usuario,
                activo: false,
            });
        }
    );

    await usuarioService.desactivarUsuario(
        usuario._id.toString()
    );

    assert.deepEqual(actualizacion, {
        $set: { activo: false },
    });
});

test('rechaza desactivar un usuario ya desactivado', async () => {
    const usuario = crearUsuarioBase({ activo: false });

    mock.method(UsuarioModel, 'findById', () =>
        crearConsulta(usuario)
    );

    const error = await obtenerError(
        usuarioService.desactivarUsuario(
            usuario._id.toString()
        )
    );

    assert.equal(error.statusCode, 409);
    assert.match(error.message, /ya está desactivado/);
});

// ============================================================
// MODELO Y SERIALIZACIÓN
// ============================================================

test('la cuenta se crea activa y nunca serializa la contraseña', async () => {
    const usuario = new UsuarioModel({
        nombre: 'Recepción',
        email: 'recepcion@prueba.com',
        password: 'hash-de-prueba',
        rol: 'recepcionista',
    });

    await usuario.validate();

    const json = usuario.toJSON() as Record<string, any>;

    assert.equal(json.activo, true);
    assert.equal(json.id.toString(), usuario._id.toString());
    assert.equal(json._id, undefined);
    assert.equal(json.__v, undefined);
    assert.equal(json.password, undefined);
});
