import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import mongoose from 'mongoose';

import MedicoModel from '../../medico/models/Medico';
import UsuarioModel from '../models/Usuario';

// ============================================================
// SUPLANTACIÓN DE LA EXISTENCIA DE MÉDICOS (sin base de datos)
// ============================================================

type ModeloMedicoSuplantado = {
    exists: (filtro: unknown) => Promise<unknown>;
};

const modeloMedico = MedicoModel as unknown as ModeloMedicoSuplantado;
const existsOriginal = modeloMedico.exists;

afterEach(() => {
    modeloMedico.exists = existsOriginal;
});

const crearUsuario = (datos: Record<string, unknown> = {}) =>
    new UsuarioModel({
        nombre: 'Usuario de prueba',
        email: 'usuario@prueba.com',
        password: 'secreto123',
        ...datos,
    });

const obtenerErrorDeMedico = (error: unknown) => {
    if (!(error instanceof mongoose.Error.ValidationError)) {
        return null;
    }

    return error.errors.medico?.message ?? null;
};

// ============================================================
// RELACIÓN USUARIO - MÉDICO
// ============================================================

test('permite vincular un usuario médico con un perfil existente', async () => {
    const medicoId = new mongoose.Types.ObjectId();

    modeloMedico.exists = async () => ({ _id: medicoId });

    const usuario = crearUsuario({
        rol: 'medico',
        medico: medicoId,
    });

    await usuario.validate();

    assert.equal(usuario.medico?.toString(), medicoId.toString());
    // La relación es explícita: no se asume que los _id coincidan.
    assert.notEqual(usuario._id.toString(), medicoId.toString());
});

test('rechaza una referencia a un perfil médico inexistente', async () => {
    modeloMedico.exists = async () => null;

    const usuario = crearUsuario({
        rol: 'medico',
        medico: new mongoose.Types.ObjectId(),
    });

    await assert.rejects(usuario.validate(), (error: unknown) => {
        assert.equal(
            obtenerErrorDeMedico(error),
            'El médico indicado no existe'
        );

        return true;
    });
});

test('rechaza vincular un perfil médico a un usuario que no es médico', async () => {
    const medicoId = new mongoose.Types.ObjectId();

    modeloMedico.exists = async () => ({ _id: medicoId });

    const usuario = crearUsuario({
        rol: 'recepcionista',
        medico: medicoId,
    });

    await assert.rejects(usuario.validate(), (error: unknown) => {
        assert.match(
            String(obtenerErrorDeMedico(error)),
            /Solo un usuario con rol médico/
        );

        return true;
    });
});

test('permite usuarios médicos todavía sin perfil asociado', async () => {
    modeloMedico.exists = async () => {
        throw new Error('No debería consultarse la existencia de un médico');
    };

    const usuario = crearUsuario({ rol: 'medico' });

    await usuario.validate();

    assert.equal(usuario.medico, undefined);
});

test('rechaza un identificador de médico con formato inválido', async () => {
    modeloMedico.exists = async () => ({ _id: 'valor' });

    const usuario = crearUsuario({
        rol: 'medico',
        medico: 'no-es-un-object-id',
    });

    await assert.rejects(usuario.validate(), (error: unknown) => {
        assert.ok(error instanceof mongoose.Error.ValidationError);
        assert.ok(error.errors.medico);

        return true;
    });
});

test('define un índice único y sparse sobre el perfil médico', () => {
    const indices = UsuarioModel.schema.indexes() as Array<
        [Record<string, number>, Record<string, unknown>]
    >;

    const indiceMedico = indices.find(
        ([campos]) => campos.medico === 1
    );

    assert.ok(indiceMedico, 'Falta el índice sobre el campo medico');
    assert.equal(indiceMedico[1].unique, true);
    assert.equal(indiceMedico[1].sparse, true);
});
