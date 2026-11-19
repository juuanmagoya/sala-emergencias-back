import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';

import PacienteModel from '../models/Paciente';

// ============================================================
// HELPERS
// ============================================================

const crearPaciente = (datos: Record<string, unknown> = {}) =>
    new PacienteModel({
        nombre: 'Paciente de prueba',
        dni: '12345678',
        telefono: {
            codigoArea: '11',
            numero: '12345678',
        },
        ...datos,
    });

interface OpcionesIndice {
    name?: string;
    unique?: boolean;
    partialFilterExpression?: unknown;
}

const obtenerIndices = () =>
    PacienteModel.schema.indexes() as Array<
        [Record<string, unknown>, OpcionesIndice]
    >;

// ============================================================
// ALTA MÍNIMA
// ============================================================

test('valida un paciente con solo nombre, DNI y teléfono', async () => {
    const paciente = crearPaciente();

    await paciente.validate();

    assert.equal(paciente.email, undefined);
    assert.equal(paciente.direccion, undefined);
    assert.equal(paciente.obraSocial.nombre, 'NINGUNA');
    assert.equal(paciente.telefono.tipo, 'CELULAR');
});

test('mantiene los datos opcionales cuando se proporcionan', async () => {
    const paciente = crearPaciente({
        email: '  PACIENTE@EJEMPLO.COM  ',
        direccion: {
            calle: 'San Martín',
            numero: '123',
            barrio: 'Centro',
        },
        obraSocial: {
            nombre: 'OSDE',
            numeroAfiliado: '123456',
        },
    });

    await paciente.validate();

    assert.equal(paciente.email, 'paciente@ejemplo.com');
    assert.equal(paciente.direccion?.calle, 'San Martín');
    assert.equal(paciente.obraSocial.nombre, 'OSDE');
});

// ============================================================
// VALIDACIONES
// ============================================================

test('rechaza un DNI inválido', async () => {
    const paciente = crearPaciente({ dni: '123' });

    await assert.rejects(paciente.validate(), (error: unknown) => {
        assert.ok(error instanceof mongoose.Error.ValidationError);
        assert.ok(error.errors.dni);

        return true;
    });
});

test('rechaza un teléfono incompleto', async () => {
    const paciente = crearPaciente({
        telefono: { codigoArea: '11' },
    });

    await assert.rejects(paciente.validate(), (error: unknown) => {
        assert.ok(error instanceof mongoose.Error.ValidationError);
        assert.ok(error.errors['telefono.numero']);

        return true;
    });
});

test('rechaza un email con formato inválido', async () => {
    const paciente = crearPaciente({ email: 'no-es-un-email' });

    await assert.rejects(paciente.validate(), (error: unknown) => {
        assert.ok(error instanceof mongoose.Error.ValidationError);
        assert.ok(error.errors.email);

        return true;
    });
});

// ============================================================
// ÍNDICES
// ============================================================

test('define un índice único parcial para el email', () => {
    const indices = obtenerIndices();

    const indiceEmail = indices.find(
        (indice) => indice[1].name === 'pacientes_email_unico'
    );

    assert.ok(indiceEmail, 'Falta el índice parcial de email');

    const [campos, opciones] = indiceEmail;

    assert.deepEqual(campos, { email: 1 });
    assert.equal(opciones.unique, true);

    const filtro = opciones.partialFilterExpression as {
        email?: { $type?: string };
    };

    assert.deepEqual(filtro, { email: { $type: 'string' } });
});

test('no conserva un índice único simple sobre el email', () => {
    const indices = obtenerIndices();

    const indiceSimple = indices.find(([campos, opciones]) => {
        const esEmail = campos.email === 1;
        const esUnico = opciones.unique === true;

        return (
            esEmail &&
            esUnico &&
            !opciones.partialFilterExpression
        );
    });

    assert.equal(indiceSimple, undefined);
});
