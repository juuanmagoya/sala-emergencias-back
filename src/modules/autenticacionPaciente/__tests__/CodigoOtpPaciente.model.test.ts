import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';

import CodigoOtpPacienteModel from '../models/CodigoOtpPaciente';

// ============================================================
// HELPERS
// ============================================================

const crearCodigo = (datos: Record<string, unknown> = {}) =>
    new CodigoOtpPacienteModel({
        paciente: new mongoose.Types.ObjectId(),
        codigoHash: '$2b$10$hash-de-prueba',
        expiraEn: new Date(Date.now() + 5 * 60 * 1000),
        intentosRestantes: 5,
        proximoEnvioPermitido: new Date(
            Date.now() + 60 * 1000
        ),
        ...datos,
    });

interface OpcionesIndice {
    name?: string;
    unique?: boolean;
    expireAfterSeconds?: number;
}

const obtenerIndices = () =>
    CodigoOtpPacienteModel.schema.indexes() as Array<
        [Record<string, unknown>, OpcionesIndice]
    >;

// ============================================================
// VALIDACIÓN DEL DOCUMENTO
// ============================================================

test('valida un código OTP completo', async () => {
    const codigo = crearCodigo();

    await codigo.validate();

    assert.equal(codigo.intentosRestantes, 5);
    assert.equal(codigo.codigoHash, '$2b$10$hash-de-prueba');
});

test('exige todos los campos obligatorios', async () => {
    const codigo = new CodigoOtpPacienteModel({});

    await assert.rejects(codigo.validate(), (error: unknown) => {
        assert.ok(
            error instanceof mongoose.Error.ValidationError
        );

        for (const campo of [
            'paciente',
            'codigoHash',
            'expiraEn',
            'intentosRestantes',
            'proximoEnvioPermitido',
        ]) {
            assert.ok(
                error.errors[campo],
                `Falta la validación de ${campo}`
            );
        }

        return true;
    });
});

test('rechaza intentos restantes negativos', async () => {
    const codigo = crearCodigo({ intentosRestantes: -1 });

    await assert.rejects(codigo.validate(), (error: unknown) => {
        assert.ok(
            error instanceof mongoose.Error.ValidationError
        );
        assert.ok(error.errors.intentosRestantes);

        return true;
    });
});

test('referencia al modelo Paciente', () => {
    const path = CodigoOtpPacienteModel.schema.path(
        'paciente'
    );

    assert.equal(path.options.ref, 'Paciente');
});

// ============================================================
// PROTECCIÓN DEL HASH
// ============================================================

test('el hash del código no se selecciona por defecto', () => {
    const path = CodigoOtpPacienteModel.schema.path(
        'codigoHash'
    );

    assert.equal(path.options.select, false);
});

test('el hash no aparece en la representación JSON', () => {
    const codigo = crearCodigo();
    const json = codigo.toJSON() as Record<string, unknown>;

    assert.equal('codigoHash' in json, false);
    assert.equal(String(json.id), codigo._id.toString());
    assert.equal('_id' in json, false);
});

// ============================================================
// ÍNDICES
// ============================================================

test('define un índice único sobre paciente', () => {
    const indice = obtenerIndices().find(
        ([, opciones]) =>
            opciones.name === 'codigos_otp_paciente_unico'
    );

    assert.ok(indice, 'Falta el índice único de paciente');

    const [campos, opciones] = indice;

    assert.deepEqual(campos, { paciente: 1 });
    assert.equal(opciones.unique, true);
});

test('define un índice TTL sobre expiraEn', () => {
    const indice = obtenerIndices().find(
        ([, opciones]) =>
            opciones.name === 'codigos_otp_paciente_ttl'
    );

    assert.ok(indice, 'Falta el índice TTL de expiración');

    const [campos, opciones] = indice;

    assert.deepEqual(campos, { expiraEn: 1 });
    assert.equal(opciones.expireAfterSeconds, 0);
});

test('usa timestamps de Mongoose', () => {
    assert.equal(
        CodigoOtpPacienteModel.schema.options.timestamps,
        true
    );
});
