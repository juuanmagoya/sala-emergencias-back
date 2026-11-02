import assert from 'node:assert/strict';
import test from 'node:test';

import historiaClinicaService from '../services/historiaclinica.service';

// ============================================================
// VALIDACIONES DE IDENTIFICADORES (sin acceso a la base)
// ============================================================

test('rechaza un ID inválido al buscar una historia clínica', async () => {
    await assert.rejects(
        historiaClinicaService.getHistoriaClinicaById('id-invalido'),
        /El ID de la historia clínica no es válido/
    );
});

test('rechaza un ID inválido al buscar el historial de un paciente', async () => {
    await assert.rejects(
        historiaClinicaService.getHistorialPaciente('id-invalido'),
        /El ID del paciente no es válido/
    );
});

test('rechaza un ID inválido al actualizar una historia clínica', async () => {
    await assert.rejects(
        historiaClinicaService.updateHistoriaClinica('id-invalido', {}),
        /El ID de la historia clínica no es válido/
    );
});

test('rechaza IDs inválidos al crear una historia clínica', async () => {
    await assert.rejects(
        historiaClinicaService.createHistoriaClinica({
            paciente: 'id-invalido',
            medico: 'id-invalido',
            observaciones: 'Observaciones de prueba',
        }),
        /El ID del paciente no es válido|El ID del médico no es válido/
    );
});

test('rechaza un filtro con ID de paciente inválido', async () => {
    await assert.rejects(
        historiaClinicaService.getHistoriasClinicas({
            paciente: 'id-invalido',
        }),
        /El ID del paciente no es válido/
    );
});

test('rechaza un filtro con ID de médico inválido', async () => {
    await assert.rejects(
        historiaClinicaService.getHistoriasClinicas({
            medico: 'id-invalido',
        }),
        /El ID del médico no es válido/
    );
});
