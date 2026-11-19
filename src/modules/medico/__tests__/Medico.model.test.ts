import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';

import MedicoModel from '../models/Medico';

// ============================================================
// HELPERS
// ============================================================

const crearMedico = (datos: Record<string, unknown> = {}) =>
    new MedicoModel({
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
        email: 'ana@example.com',
        telefono: {
            codigoArea: '11',
            numero: '12345678',
        },
        especialidades: [new mongoose.Types.ObjectId()],
        duracionTurno: 30,
        ...datos,
    });

interface OpcionesIndice {
    name?: string;
    unique?: boolean;
}

const obtenerIndices = () =>
    MedicoModel.schema.indexes() as Array<
        [Record<string, unknown>, OpcionesIndice]
    >;

// ============================================================
// ESPECIALIDADES
// ============================================================

test('valida un médico con una sola especialidad', async () => {
    const medico = crearMedico();

    await medico.validate();

    assert.equal(medico.especialidades.length, 1);
});

test('valida un médico con varias especialidades', async () => {
    const medico = crearMedico({
        especialidades: [
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
        ],
    });

    await medico.validate();

    assert.equal(medico.especialidades.length, 3);
});

test('rechaza un array de especialidades vacío', async () => {
    const medico = crearMedico({ especialidades: [] });

    await assert.rejects(
        () => medico.validate(),
        (error: unknown) =>
            error instanceof mongoose.Error.ValidationError &&
            error.errors['especialidades']?.message ===
                'El médico debe tener al menos una especialidad'
    );
});

test('rechaza especialidades repetidas', async () => {
    const especialidadId = new mongoose.Types.ObjectId();

    const medico = crearMedico({
        especialidades: [especialidadId, especialidadId],
    });

    await assert.rejects(
        () => medico.validate(),
        (error: unknown) =>
            error instanceof mongoose.Error.ValidationError &&
            error.errors['especialidades']?.message ===
                'No se puede repetir la misma especialidad'
    );
});

test('el schema admite un documento hidratado sin `especialidades`', async () => {
    const medico = new MedicoModel({
        nombre: 'LEGACY',
        apellido: 'PEREZ',
        matricula: '654321',
        email: 'legacy@example.com',
        telefono: {
            codigoArea: '11',
            numero: '12345678',
        },
        duracionTurno: 30,
    });

    await medico.validate();

    assert.equal(medico.especialidades, undefined);
});

// ============================================================
// RESPUESTA
// ============================================================

test('`toJSON` expone `especialidades` y descarta el campo heredado', () => {
    const primera = new mongoose.Types.ObjectId();
    const segunda = new mongoose.Types.ObjectId();

    const medico = MedicoModel.hydrate({
        _id: new mongoose.Types.ObjectId(),
        especialidades: [primera, segunda],
        // Campo obsoleto que pueden conservar documentos viejos.
        especialidad: primera,
    });

    const json = medico.toJSON() as Record<string, any>;

    assert.equal('especialidad' in json, false);
    assert.deepEqual(
        json.especialidades.map(String),
        [String(primera), String(segunda)]
    );
    assert.ok(json.id);
    assert.equal('_id' in json, false);
    assert.equal('__v' in json, false);
});

// ============================================================
// ÍNDICES
// ============================================================

test('declara un índice multikey sobre `especialidades`', () => {
    const indices = obtenerIndices();

    const tieneIndice = indices.some(
        ([campos]) =>
            Object.keys(campos).length === 1 &&
            campos.especialidades === 1
    );

    const tieneIndiceEscalar = indices.some(
        ([campos]) => 'especialidad' in campos
    );

    assert.equal(tieneIndice, true);
    assert.equal(tieneIndiceEscalar, false);
});

test('el schema no define el campo ni el virtual `especialidad`', () => {
    assert.ok(MedicoModel.schema.path('especialidades'));
    assert.equal(MedicoModel.schema.path('especialidad'), undefined);
    assert.equal(MedicoModel.schema.virtuals['especialidad'], undefined);
});
