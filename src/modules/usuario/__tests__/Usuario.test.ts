import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';

import UsuarioModel from '../models/Usuario';
import {
    ROLES_USUARIO,
    esRolUsuario,
} from '../types/usuario.types';

// ============================================================
// HELPERS
// ============================================================

const crearUsuario = (datos: Record<string, unknown> = {}) =>
    new UsuarioModel({
        nombre: 'Usuario de prueba',
        email: 'usuario@prueba.com',
        password: 'secreto123',
        ...datos,
    });

// ============================================================
// ROLES PERMITIDOS
// ============================================================

test('define exactamente los roles admin, medico y recepcionista', () => {
    assert.deepEqual([...ROLES_USUARIO], [
        'admin',
        'medico',
        'recepcionista',
    ]);
});

test('acepta los tres roles permitidos en el modelo', async () => {
    for (const rol of ROLES_USUARIO) {
        const usuario = crearUsuario({ rol });

        await usuario.validate();

        assert.equal(usuario.rol, rol);
    }
});

test('rechaza un rol fuera del conjunto permitido', async () => {
    const usuario = crearUsuario({ rol: 'superadmin' });

    await assert.rejects(usuario.validate(), (error: unknown) => {
        assert.ok(error instanceof mongoose.Error.ValidationError);
        assert.ok(error.errors.rol);

        return true;
    });
});

test('exige un rol explícito y no asigna privilegios por defecto', async () => {
    const usuario = crearUsuario();

    await assert.rejects(usuario.validate(), (error: unknown) => {
        assert.ok(error instanceof mongoose.Error.ValidationError);
        assert.ok(error.errors.rol);

        return true;
    });
});

// ============================================================
// VALIDACIÓN DE ROLES EN TIEMPO DE EJECUCIÓN
// ============================================================

test('reconoce únicamente los roles permitidos', () => {
    assert.equal(esRolUsuario('admin'), true);
    assert.equal(esRolUsuario('medico'), true);
    assert.equal(esRolUsuario('recepcionista'), true);

    assert.equal(esRolUsuario('superadmin'), false);
    assert.equal(esRolUsuario(''), false);
    assert.equal(esRolUsuario(undefined), false);
    assert.equal(esRolUsuario(null), false);
});
