import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';

import mongoose from 'mongoose';

import ConsultorioModel from '../../consultorio/models/Consultorio';
import MedicoModel from '../../medico/models/Medico';
import TurnoModel from '../../turnos/models/Turno';

import EspecialidadModel from '../models/Especialidad';
import especialidadService from '../services/especialidad.service';

const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';

const crearEspecialidad = () => ({
    _id: new mongoose.Types.ObjectId(ESPECIALIDAD_ID),
    activo: true,
    save: mock.fn(async () => undefined),
});

afterEach(() => {
    mock.restoreAll();
});

test('detecta el uso por un médico mediante pertenencia al array', async () => {
    mock.method(
        EspecialidadModel,
        'findById',
        async () => crearEspecialidad()
    );

    let filtroMedicos: Record<string, unknown> | undefined;

    mock.method(
        MedicoModel,
        'findOne',
        async (filtro: Record<string, unknown>) => {
            filtroMedicos = filtro;

            return { _id: new mongoose.Types.ObjectId() };
        }
    );

    await assert.rejects(
        especialidadService.toggleActivoEspecialidad(
            ESPECIALIDAD_ID
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message.includes(
                'está siendo utilizada por uno o más médicos activos'
            )
    );

    // La igualdad sobre un array multikey alcanza cualquier posición.
    assert.deepEqual(filtroMedicos, {
        especialidades: ESPECIALIDAD_ID,
        activo: true,
    });
});

test('también bloquea la eliminación por un médico que tiene la especialidad', async () => {
    mock.method(
        EspecialidadModel,
        'findById',
        async () => crearEspecialidad()
    );

    let filtroMedicos: Record<string, unknown> | undefined;

    mock.method(
        MedicoModel,
        'findOne',
        async (filtro: Record<string, unknown>) => {
            filtroMedicos = filtro;

            return { _id: new mongoose.Types.ObjectId() };
        }
    );

    await assert.rejects(
        especialidadService.deleteEspecialidadPermanente(
            ESPECIALIDAD_ID
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message.includes(
                'está siendo utilizada por uno o más médicos activos'
            )
    );

    assert.deepEqual(filtroMedicos, {
        especialidades: ESPECIALIDAD_ID,
        activo: true,
    });
});

test('bloquea la desactivación si la usa un consultorio activo', async () => {
    mock.method(
        EspecialidadModel,
        'findById',
        async () => crearEspecialidad()
    );
    mock.method(
        MedicoModel,
        'findOne',
        async () => null
    );
    mock.method(
        ConsultorioModel,
        'findOne',
        async () => ({ _id: new mongoose.Types.ObjectId() })
    );

    await assert.rejects(
        especialidadService.toggleActivoEspecialidad(
            ESPECIALIDAD_ID
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message.includes(
                'está siendo utilizada por uno o más consultorios activos'
            )
    );
});

test('bloquea la desactivación si la usa un turno activo', async () => {
    mock.method(
        EspecialidadModel,
        'findById',
        async () => crearEspecialidad()
    );
    mock.method(
        MedicoModel,
        'findOne',
        async () => null
    );
    mock.method(
        ConsultorioModel,
        'findOne',
        async () => null
    );
    mock.method(
        TurnoModel,
        'findOne',
        async () => ({ _id: new mongoose.Types.ObjectId() })
    );

    await assert.rejects(
        especialidadService.toggleActivoEspecialidad(
            ESPECIALIDAD_ID
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message.includes(
                'está siendo utilizada por uno o más turnos activos'
            )
    );
});
