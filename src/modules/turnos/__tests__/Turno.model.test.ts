import assert from 'node:assert/strict';
import { test } from 'node:test';

import TurnoModel from '../models/Turno';

// ============================================================
// ESQUEMA
// ============================================================

test('el turno exige médico y fecha de fin para los registros nuevos', () => {
    const medico = TurnoModel.schema.path('medico');
    const fechaFin = TurnoModel.schema.path('fechaFin');

    assert.equal(medico?.isRequired, true);
    assert.equal(fechaFin?.isRequired, true);
    assert.equal(
        (medico as unknown as { options: { ref?: string } })
            .options.ref,
        'Medico'
    );
});

test('el estado inicial por defecto es pendiente', () => {
    const estado = TurnoModel.schema.path('estado') as unknown as {
        defaultValue?: unknown;
    };

    assert.equal(estado.defaultValue, 'pendiente');
});

// ============================================================
// ÍNDICES
// ============================================================

interface OpcionesIndice {
    name?: string;
    unique?: boolean;
    partialFilterExpression?: unknown;
}

const obtenerIndices = () =>
    TurnoModel.schema.indexes() as Array<
        [Record<string, unknown>, OpcionesIndice]
    >;

test('existe un índice único parcial para reservas activas', () => {
    const indices = obtenerIndices();

    const indiceUnico = indices.find(
        (indice) =>
            indice[1].name ===
            'turnos_activos_unicos_por_medico_fecha'
    );

    assert.ok(indiceUnico);

    const [campos, opciones] = indiceUnico;

    assert.deepEqual(campos, {
        medico: 1,
        fechaTurno: 1,
    });
    assert.equal(opciones.unique, true);

    const filtro = opciones.partialFilterExpression as {
        $or?: Array<Record<string, string>>;
    };

    assert.deepEqual(filtro.$or, [
        { estado: 'pendiente' },
        { estado: 'atendido' },
    ]);
});

test('existe un índice de consulta por médico y fecha', () => {
    const indices = obtenerIndices();

    const indiceConsulta = indices.find(
        (indice) =>
            indice[1].name === 'turnos_por_medico_fecha'
    );

    assert.ok(indiceConsulta);
    assert.equal(indiceConsulta[1]?.unique, undefined);
});

test('existe un índice de historial por paciente y fecha', () => {
    const indices = obtenerIndices();

    const indiceHistorial = indices.find(
        (indice) =>
            indice[1].name === 'turnos_por_paciente_fecha'
    );

    assert.ok(indiceHistorial);

    const [campos, opciones] = indiceHistorial;

    assert.deepEqual(campos, {
        paciente: 1,
        fechaTurno: -1,
    });
    assert.equal(opciones.unique, undefined);
});
