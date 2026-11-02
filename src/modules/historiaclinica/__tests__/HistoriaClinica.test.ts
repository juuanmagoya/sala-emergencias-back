import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';

import HistoriaClinicaModel from '../models/HistoriaClinica';

// ============================================================
// HELPERS
// ============================================================

const pacienteId = new mongoose.Types.ObjectId();
const medicoId = new mongoose.Types.ObjectId();

const crearHistoria = (datos: Record<string, unknown> = {}) =>
    new HistoriaClinicaModel({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Paciente con dolor de cabeza y fiebre leve',
        ...datos,
    });

const crearMedicamento = (datos: Record<string, unknown> = {}) => ({
    nombre: 'Ibuprofeno',
    dosis: '400 mg',
    frecuencia: 'Cada 8 horas',
    ...datos,
});

// ============================================================
// VALORES PREDETERMINADOS
// ============================================================

test('aplica fecha de atención y recetario vacío por defecto', async () => {
    const antes = Date.now();
    const historia = crearHistoria();

    await historia.validate();

    assert.ok(historia.fechaAtencion instanceof Date);
    assert.ok(historia.fechaAtencion.getTime() >= antes);
    assert.deepEqual(historia.recetario, []);
});

test('acepta una fecha de atención explícita', async () => {
    const fechaAtencion = new Date('2026-01-15T10:30:00.000Z');
    const historia = crearHistoria({ fechaAtencion });

    await historia.validate();

    assert.equal(
        historia.fechaAtencion.toISOString(),
        fechaAtencion.toISOString()
    );
});

// ============================================================
// REFERENCIAS OBLIGATORIAS
// ============================================================

test('exige el paciente', async () => {
    const historia = crearHistoria({ paciente: undefined });

    await assert.rejects(
        historia.validate(),
        /El paciente es obligatorio/
    );
});

test('exige el médico responsable', async () => {
    const historia = crearHistoria({ medico: undefined });

    await assert.rejects(
        historia.validate(),
        /El médico es obligatorio/
    );
});

// ============================================================
// OBSERVACIONES
// ============================================================

test('normaliza las observaciones con trim', async () => {
    const historia = crearHistoria({
        observaciones: '  Control de rutina  ',
    });

    await historia.validate();

    assert.equal(historia.observaciones, 'Control de rutina');
});

test('rechaza observaciones vacías', async () => {
    const historia = crearHistoria({ observaciones: '   ' });

    await assert.rejects(
        historia.validate(),
        /Las observaciones son obligatorias/
    );
});

test('rechaza observaciones de más de 2000 caracteres', async () => {
    const historia = crearHistoria({
        observaciones: 'a'.repeat(2001),
    });

    await assert.rejects(
        historia.validate(),
        /no pueden superar los 2000 caracteres/
    );
});

// ============================================================
// RECETARIO
// ============================================================

test('acepta un recetario vacío', async () => {
    const historia = crearHistoria({ recetario: [] });

    await historia.validate();

    assert.deepEqual(historia.recetario, []);
});

test('acepta medicamentos sin campos opcionales', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento()],
    });

    await historia.validate();

    assert.equal(historia.recetario.length, 1);
    assert.equal(historia.recetario[0].duracion, undefined);
    assert.equal(historia.recetario[0].indicaciones, undefined);
});

test('acepta medicamentos con duración e indicaciones', async () => {
    const historia = crearHistoria({
        recetario: [
            crearMedicamento({
                duracion: '5 días',
                indicaciones: 'Tomar después de las comidas',
            }),
        ],
    });

    await historia.validate();

    assert.equal(historia.recetario[0].duracion, '5 días');
    assert.equal(
        historia.recetario[0].indicaciones,
        'Tomar después de las comidas'
    );
});

test('exige el nombre del medicamento', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento({ nombre: undefined })],
    });

    await assert.rejects(
        historia.validate(),
        /El nombre del medicamento es obligatorio/
    );
});

test('exige la dosis del medicamento', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento({ dosis: undefined })],
    });

    await assert.rejects(
        historia.validate(),
        /La dosis del medicamento es obligatoria/
    );
});

test('exige la frecuencia del medicamento', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento({ frecuencia: undefined })],
    });

    await assert.rejects(
        historia.validate(),
        /La frecuencia del medicamento es obligatoria/
    );
});

// ============================================================
// SERIALIZACIÓN
// ============================================================

test('serializa _id como id y elimina __v', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento()],
    });

    await historia.validate();

    const json = historia.toJSON() as Record<string, any>;

    assert.equal(json.id.toString(), historia._id.toString());
    assert.equal(json._id, undefined);
    assert.equal(json.__v, undefined);
    assert.equal(json.recetario[0]._id, undefined);
});
