import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';

import mongoose from 'mongoose';

import EspecialidadModel from '../../especialidad/models/Especialidad';
import MedicoModel from '../../medico/models/Medico';
import PacienteModel from '../../pacientes/models/Paciente';
import UsuarioModel from '../../usuario/models/Usuario';

import TurnoModel from '../models/Turno';
import turnoService from '../services/turno.service';
import { obtenerDisponibilidad } from '../services/disponibilidad.service';

import { MENSAJES_TURNO } from '../constants/turno.messages';

import type { IMedico } from '../../medico/interfaces/Medico.interface';
import type { CrearTurnoDTO } from '../dtos/TurnoDTO';
import type { MedicoDocumento } from '../services/disponibilidad.service';

const ZONA = 'America/Argentina/Buenos_Aires';
const PACIENTE_ID = '507f1f77bcf86cd799439011';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const USUARIO_ID = '507f1f77bcf86cd799439014';
const TURNO_ID = '507f1f77bcf86cd799439015';

const AHORA = new Date('2026-11-02T03:00:00.000Z');
const FECHA_VALIDA = '2026-11-02T09:00';

const crearMedico = (
    overrides: Partial<IMedico> = {}
): MedicoDocumento =>
    ({
        _id: new mongoose.Types.ObjectId(MEDICO_ID),
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
        especialidad: new mongoose.Types.ObjectId(
            ESPECIALIDAD_ID
        ),
        email: 'ana@example.com',
        telefono: {
            tipo: 'CELULAR',
            codigoArea: '11',
            numero: '12345678',
        },
        consultorios: [],
        horariosAtencion: [
            {
                dia: 'LUNES',
                horaInicio: '08:00',
                horaFin: '12:00',
            },
            {
                dia: 'LUNES',
                horaInicio: '16:00',
                horaFin: '20:00',
            },
        ],
        duracionTurno: 30,
        activo: true,
        ...overrides,
    }) as unknown as MedicoDocumento;

const crearDatos = (
    overrides: Partial<CrearTurnoDTO> = {}
): CrearTurnoDTO => ({
    paciente: PACIENTE_ID,
    especialidad: ESPECIALIDAD_ID,
    medico: MEDICO_ID,
    fechaTurno: FECHA_VALIDA,
    observaciones: '  control  ',
    ...overrides,
});

const fechaLocal = (hora: string): Date =>
    new Date(`2026-11-02T${hora}:00.000-03:00`);

const prepararDependencias = (
    medico: MedicoDocumento = crearMedico()
) => {
    mock.method(PacienteModel, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));
    mock.method(EspecialidadModel, 'exists', async () => ({
        _id: ESPECIALIDAD_ID,
    }));
    mock.method(MedicoModel, 'findById', async () => medico);
    mock.method(TurnoModel, 'find', async () => []);
};

const prepararCreacion = (
    turnoCompleto: Record<string, unknown>
) => {
    let datosCreados: Record<string, unknown> | undefined;

    mock.method(
        TurnoModel,
        'create',
        async (datos: Record<string, unknown>) => {
            datosCreados = datos;

            return {
                _id: new mongoose.Types.ObjectId(),
                ...datos,
            };
        }
    );

    const consulta = Promise.resolve(
        turnoCompleto
    ) as unknown as Promise<Record<string, unknown>> & {
        populate: () => typeof consulta;
    };

    consulta.populate = () => consulta;

    mock.method(TurnoModel, 'findById', () => consulta);

    return () => datosCreados;
};

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// CREACIÓN
// ============================================================

test('crea el turno con estado y duración derivados en el servidor', async () => {
    prepararDependencias();

    const turnoCompleto = {
        _id: new mongoose.Types.ObjectId(),
        estado: 'pendiente',
    };
    const obtenerDatosCreados = prepararCreacion(turnoCompleto);

    const resultado = await turnoService.createTurno(
        {
            ...crearDatos(),
            // Aunque un cliente los envíe, el servidor los ignora.
            estado: 'atendido',
            duracionTurno: 60,
        } as CrearTurnoDTO,
        { ahora: AHORA, zonaHoraria: ZONA }
    );

    const datosCreados = obtenerDatosCreados();

    assert.equal(resultado, turnoCompleto);
    assert.equal(datosCreados?.estado, 'pendiente');
    assert.equal(
        (datosCreados?.fechaFin as Date).toISOString(),
        '2026-11-02T12:30:00.000Z'
    );
    assert.equal(datosCreados?.observaciones, 'control');
    assert.equal(datosCreados?.medico, MEDICO_ID);
    assert.equal('duracionTurno' in (datosCreados ?? {}), false);
});

test('consulta los turnos ocupados con la regla de estados del proyecto', async () => {
    prepararDependencias();

    let filtroConsultado: Record<string, unknown> | undefined;

    mock.method(
        TurnoModel,
        'find',
        async (filtro: Record<string, unknown>) => {
            filtroConsultado = filtro;
            return [];
        }
    );

    prepararCreacion({ _id: new mongoose.Types.ObjectId() });

    await turnoService.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    });

    assert.deepEqual(filtroConsultado?.estado, {
        $ne: 'cancelado',
    });
    assert.deepEqual(filtroConsultado?.activo, {
        $ne: false,
    });
});

test('rechaza un médico inactivo', async () => {
    prepararDependencias(crearMedico({ activo: false }));

    await assert.rejects(
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.MEDICO_INACTIVO
    );
});

test('rechaza una especialidad que no corresponde al médico', async () => {
    prepararDependencias(
        crearMedico({
            especialidad: new mongoose.Types.ObjectId(),
        })
    );

    await assert.rejects(
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE
    );
});

test('rechaza fechas inválidas y fechas pasadas', async () => {
    prepararDependencias();

    await assert.rejects(
        turnoService.createTurno(
            crearDatos({ fechaTurno: '2026-02-30T09:00' }),
            { ahora: AHORA, zonaHoraria: ZONA }
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.FECHA_INVALIDA
    );

    await assert.rejects(
        turnoService.createTurno(
            crearDatos({ fechaTurno: '2026-11-01T23:00' }),
            { ahora: AHORA, zonaHoraria: ZONA }
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.FECHA_PASADA
    );
});

test('rechaza un turno superpuesto con uno existente', async () => {
    prepararDependencias();

    mock.method(TurnoModel, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);

    await assert.rejects(
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.HORARIO_OCUPADO
    );
});

test('rechaza relaciones inexistentes', async () => {
    prepararDependencias();

    mock.method(PacienteModel, 'exists', async () => null);

    await assert.rejects(
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.PACIENTE_NO_EXISTE
    );

    mock.restoreAll();
    prepararDependencias();
    mock.method(EspecialidadModel, 'exists', async () => null);

    await assert.rejects(
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.ESPECIALIDAD_NO_EXISTE
    );
});

test('traduce el duplicado de la base a un conflicto de horario', async () => {
    prepararDependencias();

    mock.method(TurnoModel, 'create', async () => {
        throw Object.assign(new Error('duplicado'), {
            code: 11000,
        });
    });

    await assert.rejects(
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.HORARIO_OCUPADO
    );
});

test('dos reservas simultáneas del mismo horario no se confirman juntas', async () => {
    prepararDependencias();

    let creaciones = 0;

    mock.method(TurnoModel, 'create', async (datos: unknown) => {
        creaciones += 1;

        if (creaciones === 2) {
            throw Object.assign(new Error('duplicado'), {
                code: 11000,
            });
        }

        return {
            _id: new mongoose.Types.ObjectId(),
            ...(datos as Record<string, unknown>),
        };
    });

    const consulta = Promise.resolve({
        _id: new mongoose.Types.ObjectId(),
    }) as unknown as Promise<Record<string, unknown>> & {
        populate: () => typeof consulta;
    };

    consulta.populate = () => consulta;

    mock.method(TurnoModel, 'findById', () => consulta);

    const resultados = await Promise.allSettled([
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        turnoService.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
    ]);

    assert.equal(
        resultados.filter(
            (resultado) => resultado.status === 'fulfilled'
        ).length,
        1
    );

    const rechazado = resultados.find(
        (resultado) => resultado.status === 'rejected'
    );

    assert.ok(rechazado && rechazado.status === 'rejected');
    assert.equal(
        (rechazado.reason as Error).message,
        MENSAJES_TURNO.HORARIO_OCUPADO
    );
});

test('la disponibilidad ofrecida puede reservarse con la misma regla', async () => {
    prepararDependencias();

    const disponibilidad = await obtenerDisponibilidad(
        MEDICO_ID,
        '2026-11-02',
        { zonaHoraria: ZONA, ahora: AHORA }
    );

    const primerHorario = disponibilidad.horarios[0];

    assert.ok(primerHorario);

    prepararCreacion({ _id: new mongoose.Types.ObjectId() });

    const turno = await turnoService.createTurno(
        crearDatos({
            fechaTurno: primerHorario.inicio.toISOString(),
        }),
        { ahora: AHORA, zonaHoraria: ZONA }
    );

    assert.ok(turno);
});

// ============================================================
// ACTUALIZACIÓN DE ESTADO
// ============================================================

const prepararActualizacionEstado = (
    turno: Record<string, unknown> | null
) => {
    let actualizacionConsultada:
        | {
              id: string;
              cambios: Record<string, unknown>;
              opciones: Record<string, unknown>;
          }
        | undefined;

    const consulta = Promise.resolve(turno) as unknown as Promise<
        Record<string, unknown> | null
    > & {
        populate: () => typeof consulta;
    };

    consulta.populate = () => consulta;

    mock.method(
        TurnoModel,
        'findByIdAndUpdate',
        (
            id: string,
            cambios: Record<string, unknown>,
            opciones: Record<string, unknown>
        ) => {
            actualizacionConsultada = { id, cambios, opciones };
            return consulta;
        }
    );

    return () => actualizacionConsultada;
};

test('actualiza únicamente el campo estado del turno', async () => {
    const turnoActualizado = {
        _id: TURNO_ID,
        estado: 'atendido',
    };

    const obtenerActualizacion =
        prepararActualizacionEstado(turnoActualizado);

    const resultado = await turnoService.actualizarEstadoTurno(
        TURNO_ID,
        { estado: 'atendido' }
    );

    const actualizacion = obtenerActualizacion();

    assert.equal(resultado, turnoActualizado);
    assert.equal(actualizacion?.id, TURNO_ID);
    assert.deepEqual(actualizacion?.cambios, {
        $set: { estado: 'atendido' },
    });
    assert.equal(actualizacion?.opciones.new, true);
    assert.equal(actualizacion?.opciones.runValidators, true);
});

test('rechaza un ID de turno inválido', async () => {
    await assert.rejects(
        turnoService.actualizarEstadoTurno('no-es-un-id', {
            estado: 'atendido',
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.TURNO_ID_INVALIDO
    );
});

test('exige un estado y rechaza los no permitidos', async () => {
    await assert.rejects(
        turnoService.actualizarEstadoTurno(
            TURNO_ID,
            {} as { estado: 'atendido' }
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.ESTADO_REQUERIDO
    );

    await assert.rejects(
        turnoService.actualizarEstadoTurno(
            TURNO_ID,
            { estado: 'en-espera' } as unknown as {
                estado: 'atendido';
            }
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.ESTADO_INVALIDO
    );
});

test('rechaza campos distintos de estado en el body', async () => {
    await assert.rejects(
        turnoService.actualizarEstadoTurno(TURNO_ID, {
            estado: 'atendido',
            observaciones: 'otra cosa',
        } as unknown as { estado: 'atendido' }),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.SOLO_ESTADO_MODIFICABLE
    );
});

test('rechaza un turno inexistente', async () => {
    prepararActualizacionEstado(null);

    await assert.rejects(
        turnoService.actualizarEstadoTurno(TURNO_ID, {
            estado: 'atendido',
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.TURNO_NO_ENCONTRADO
    );
});

// ============================================================
// AGENDA DEL MÉDICO AUTENTICADO
// ============================================================

test('mis-turnos filtra por la relación explícita del usuario', async () => {
    const medico = crearMedico();

    mock.method(UsuarioModel, 'findById', async () => ({
        rol: 'medico',
        medico: new mongoose.Types.ObjectId(MEDICO_ID),
    }));
    mock.method(MedicoModel, 'findById', async () => medico);

    let filtroConsultado: Record<string, unknown> | undefined;
    let ordenConsultado: Record<string, unknown> | undefined;

    const cadena = {
        populate: () => cadena,
        sort: (orden: Record<string, unknown>) => {
            ordenConsultado = orden;
            return Promise.resolve([]);
        },
    };

    mock.method(
        TurnoModel,
        'find',
        (filtro: Record<string, unknown>) => {
            filtroConsultado = filtro;
            return cadena;
        }
    );

    const turnos = await turnoService.getTurnosDelMedico(
        USUARIO_ID
    );

    assert.deepEqual(filtroConsultado, { medico: medico._id });
    assert.deepEqual(ordenConsultado, { fechaTurno: 1 });
    assert.deepEqual(turnos, []);
});

test('mis-turnos rechaza usuarios sin perfil médico', async () => {
    mock.method(UsuarioModel, 'findById', async () => ({
        rol: 'recepcionista',
    }));

    await assert.rejects(
        turnoService.getTurnosDelMedico(USUARIO_ID),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.SIN_PERFIL_MEDICO
    );
});
