import assert from 'node:assert/strict';
import test from 'node:test';

import historiaClinicaRouter from '../routes/historiaclinica.routes';

// ============================================================
// RUTAS REGISTRADAS
// ============================================================

test('registra las rutas del módulo de historia clínica', () => {
    const stack = (historiaClinicaRouter as any).stack;

    const rutas = stack
        .filter((capa: any) => capa.route)
        .map((capa: any) => {
            const metodo = Object.keys(capa.route.methods)[0].toUpperCase();

            return `${metodo} ${capa.route.path}`;
        });

    assert.deepEqual(rutas, [
        'GET /',
        'GET /paciente/:pacienteId',
        'GET /:id',
        'POST /',
        'PUT /:id',
    ]);
});

test('no expone un endpoint DELETE para registros clínicos', () => {
    const stack = (historiaClinicaRouter as any).stack;

    const metodos = stack
        .filter((capa: any) => capa.route)
        .flatMap((capa: any) => Object.keys(capa.route.methods));

    assert.equal(metodos.includes('delete'), false);
});
