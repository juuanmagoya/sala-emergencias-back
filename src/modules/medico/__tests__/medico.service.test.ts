import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';

import mongoose from 'mongoose';

import EspecialidadModel from '../../especialidad/models/Especialidad';
import MedicoModel from '../models/Medico';

import medicoService from '../services/medico.service';

// ============================================================
// HELPERS
// ============================================================

const ESPECIALIDAD_A = '507f1f77bcf86cd799439012';
const ESPECIALIDAD_B = '507f1f77bcf86cd799439016';
const MEDICO_ID = '507f1f77bcf86cd799439013';

interface PopulateRegistrado {
    ruta: string;
    campos?: string;
}

interface RegistroConsulta {
    filtro?: unknown;
    seleccion?: string;
    populates: PopulateRegistrado[];
}

const crearConsulta = (
    resultado: unknown,
    registro?: RegistroConsulta
) => {
    const consulta: Record<string, any> = {
        select(campos: string) {
            if (registro) {
                registro.seleccion = campos;
            }

            return consulta;
        },
        populate(ruta: string, campos?: string) {
            registro?.populates.push({ ruta, campos });

            return consulta;
        },
        sort() {
            return consulta;
        },
        then(
            resolver: (valor: unknown) => unknown,
            rechazar?: (error: unknown) => unknown
        ) {
            return Promise.resolve(resultado).then(
                resolver,
                rechazar
            );
        },
    };

    return consulta;
};

const crearDatosMedico = (
    especialidades: unknown = [ESPECIALIDAD_A]
) => ({
    nombre: 'ANA',
    apellido: 'PEREZ',
    matricula: '123456',
    especialidades,
    email: 'ana@example.com',
    telefono: {
        codigoArea: '11',
        numero: '12345678',
    },
    duracionTurno: 30,
});

const prepararCatalogo = (
    especialidades: Array<{ _id: string; activo: boolean }>
) => {
    const registro: RegistroConsulta = { populates: [] };

    mock.method(
        EspecialidadModel,
        'find',
        () => crearConsulta(especialidades, registro)
    );

    return registro;
};

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// CREACIÓN
// ============================================================

test('crea un médico con varias especialidades existentes y activas', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
        { _id: ESPECIALIDAD_B, activo: true },
    ]);

    let datosCreados: Record<string, unknown> | undefined;

    mock.method(
        MedicoModel,
        'create',
        async (datos: Record<string, unknown>) => {
            datosCreados = datos;

            return datos;
        }
    );

    await medicoService.createMedico(
        crearDatosMedico([
            ESPECIALIDAD_A,
            ESPECIALIDAD_B,
        ]) as any
    );

    assert.deepEqual(datosCreados?.especialidades, [
        ESPECIALIDAD_A,
        ESPECIALIDAD_B,
    ]);
});

test('rechaza un alta sin especialidades', async () => {
    await assert.rejects(
        () =>
            medicoService.createMedico(
                crearDatosMedico([]) as any
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'El médico debe tener al menos una especialidad' &&
            (error as { statusCode?: number }).statusCode === 400
    );
});

test('rechaza especialidades repetidas antes de consultar el catálogo', async () => {
    let consultoCatalogo = false;

    mock.method(EspecialidadModel, 'find', () => {
        consultoCatalogo = true;

        return crearConsulta([]);
    });

    await assert.rejects(
        () =>
            medicoService.createMedico(
                crearDatosMedico([
                    ESPECIALIDAD_A,
                    ESPECIALIDAD_A,
                ]) as any
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'No se puede repetir la misma especialidad'
    );

    assert.equal(consultoCatalogo, false);
});

test('rechaza un ID de especialidad con formato inválido', async () => {
    await assert.rejects(
        () =>
            medicoService.createMedico(
                crearDatosMedico(['no-es-un-objectid']) as any
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'El ID de una de las especialidades no es válido'
    );
});

test('rechaza una especialidad inexistente', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
    ]);

    await assert.rejects(
        () =>
            medicoService.createMedico(
                crearDatosMedico([
                    ESPECIALIDAD_A,
                    ESPECIALIDAD_B,
                ]) as any
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'Una de las especialidades indicadas no existe'
    );
});

test('rechaza una especialidad inactiva', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
        { _id: ESPECIALIDAD_B, activo: false },
    ]);

    await assert.rejects(
        () =>
            medicoService.createMedico(
                crearDatosMedico([
                    ESPECIALIDAD_A,
                    ESPECIALIDAD_B,
                ]) as any
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'Una de las especialidades indicadas no está activa'
    );
});

// ============================================================
// EDICIÓN
// ============================================================

test('actualiza el array completo de especialidades', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
        { _id: ESPECIALIDAD_B, activo: true },
    ]);

    mock.method(
        MedicoModel,
        'findById',
        async () => ({ _id: MEDICO_ID })
    );

    let datosActualizados: Record<string, unknown> | undefined;

    mock.method(
        MedicoModel,
        'findByIdAndUpdate',
        async (_id: string, datos: Record<string, unknown>) => {
            datosActualizados = datos;

            return datos;
        }
    );

    await medicoService.updateMedico(MEDICO_ID, {
        especialidades: [ESPECIALIDAD_B],
    } as any);

    assert.deepEqual(datosActualizados?.especialidades, [
        ESPECIALIDAD_B,
    ]);
});

test('no permite vaciar las especialidades en una edición', async () => {
    mock.method(
        MedicoModel,
        'findById',
        async () => ({ _id: MEDICO_ID })
    );

    await assert.rejects(
        () =>
            medicoService.updateMedico(MEDICO_ID, {
                especialidades: [],
            }),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'El médico debe tener al menos una especialidad'
    );
});

test('una edición sin `especialidades` no toca el array', async () => {
    mock.method(
        MedicoModel,
        'findById',
        async () => ({ _id: MEDICO_ID })
    );

    let datosActualizados: Record<string, unknown> | undefined;

    mock.method(
        MedicoModel,
        'findByIdAndUpdate',
        async (_id: string, datos: Record<string, unknown>) => {
            datosActualizados = datos;

            return datos;
        }
    );

    await medicoService.updateMedico(MEDICO_ID, {
        nombre: 'ANA MARIA',
    });

    assert.equal(
        'especialidades' in (datosActualizados ?? {}),
        false
    );
});

// ============================================================
// CONSULTAS
// ============================================================

test('getMedicos filtra por pertenencia al array y popula especialidades', async () => {
    const registro: RegistroConsulta = { populates: [] };

    mock.method(
        MedicoModel,
        'find',
        (filtro: unknown) => {
            registro.filtro = filtro;

            return crearConsulta([], registro);
        }
    );

    await medicoService.getMedicos({
        especialidad: ESPECIALIDAD_A,
    });

    assert.deepEqual(registro.filtro, {
        especialidades: ESPECIALIDAD_A,
    });
    assert.deepEqual(registro.populates, [
        { ruta: 'especialidades', campos: undefined },
        { ruta: 'consultorios', campos: undefined },
    ]);
});

test('getMedicosDisponibles encuentra médicos por cualquiera de sus especialidades', async () => {
    mock.method(
        EspecialidadModel,
        'findOne',
        () =>
            crearConsulta({ _id: ESPECIALIDAD_A })
    );

    const registro: RegistroConsulta = { populates: [] };

    mock.method(
        MedicoModel,
        'find',
        (filtro: unknown) => {
            registro.filtro = filtro;

            return crearConsulta([], registro);
        }
    );

    await medicoService.getMedicosDisponibles(
        ESPECIALIDAD_A
    );

    assert.deepEqual(registro.filtro, {
        especialidades: ESPECIALIDAD_A,
        activo: true,
    });
    assert.match(
        String(registro.seleccion),
        /especialidades/
    );
    assert.deepEqual(registro.populates, [
        { ruta: 'especialidades', campos: 'nombre' },
    ]);
});

test('getMedicosDisponibles rechaza una especialidad inexistente', async () => {
    mock.method(
        EspecialidadModel,
        'findOne',
        () => crearConsulta(null)
    );
    mock.method(
        EspecialidadModel,
        'exists',
        async () => null
    );

    await assert.rejects(
        () =>
            medicoService.getMedicosDisponibles(
                ESPECIALIDAD_A
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'La especialidad indicada no existe'
    );
});

test('getMedicosDisponibles rechaza una especialidad inactiva', async () => {
    mock.method(
        EspecialidadModel,
        'findOne',
        () => crearConsulta(null)
    );
    mock.method(
        EspecialidadModel,
        'exists',
        async () => ({ _id: ESPECIALIDAD_A })
    );

    await assert.rejects(
        () =>
            medicoService.getMedicosDisponibles(
                ESPECIALIDAD_A
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === 'La especialidad no está activa'
    );
});

test('getMedicos no completa especialidades desde el campo heredado', async () => {
    const legado = MedicoModel.hydrate({
        _id: new mongoose.Types.ObjectId(MEDICO_ID),
        especialidad: new mongoose.Types.ObjectId(
            ESPECIALIDAD_A
        ),
    });

    const registro: RegistroConsulta = { populates: [] };

    mock.method(
        MedicoModel,
        'find',
        () => crearConsulta([legado], registro)
    );

    const populatesManuales: Array<{
        path: string;
        select?: string;
    }> = [];

    mock.method(
        MedicoModel,
        'populate',
        async (_docs: unknown, opciones: any) => {
            populatesManuales.push(opciones);

            return _docs;
        }
    );

    const medicos = await medicoService.getMedicos({});

    assert.equal(medicos[0].especialidades, undefined);
    assert.deepEqual(populatesManuales, []);
});
