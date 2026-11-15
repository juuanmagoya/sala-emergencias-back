import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, beforeEach, test, mock } from 'node:test';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../../../app';

import EspecialidadModel from '../../especialidad/models/Especialidad';
import especialidadService from '../../especialidad/services/especialidad.service';
import MedicoModel from '../../medico/models/Medico';
import medicoService from '../../medico/services/medico.service';
import PacienteModel from '../../pacientes/models/Paciente';
import TurnoModel from '../models/Turno';
import turnoService from '../services/turno.service';
import { obtenerDisponibilidad } from '../services/disponibilidad.service';

import { MENSAJES_TURNO } from '../constants/turno.messages';

import type { IMedico } from '../../medico/interfaces/Medico.interface';
import type { CrearTurnoPacienteDTO } from '../dtos/TurnoDTO';
import type { MedicoDocumento } from '../services/disponibilidad.service';
import type { RolUsuario } from '../../usuario/types/usuario.types';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const ZONA = 'America/Argentina/Buenos_Aires';
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-turno-paciente';

const PACIENTE_ID = '507f1f77bcf86cd799439011';
const OTRO_PACIENTE_ID = '507f1f77bcf86cd799439099';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const TURNO_ID = '507f1f77bcf86cd799439015';

// 2035-01-01 es lunes. Se usa una fecha lejana para que los tests de
// creación no dependan del reloj real del entorno.
const FECHA_BASE = '2035-01-01';
const FECHA_VALIDA = `${FECHA_BASE}T09:00`;
const AHORA = new Date(`${FECHA_BASE}T03:00:00.000Z`);

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
});

// ============================================================
// HELPERS
// ============================================================

const fechaLocal = (hora: string): Date =>
    new Date(`${FECHA_BASE}T${hora}:00.000-03:00`);

const crearMedico = (
    overrides: Partial<IMedico> = {}
): MedicoDocumento =>
    ({
        _id: new mongoose.Types.ObjectId(MEDICO_ID),
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
        especialidad: new mongoose.Types.ObjectId(ESPECIALIDAD_ID),
        duracionTurno: 30,
        activo: true,
        horariosAtencion: [
            { dia: 'LUNES', horaInicio: '08:00', horaFin: '12:00' },
            { dia: 'LUNES', horaInicio: '16:00', horaFin: '20:00' },
        ],
        ...overrides,
    }) as unknown as MedicoDocumento;

const crearDatosPaciente = (
    overrides: Partial<CrearTurnoPacienteDTO> = {}
): CrearTurnoPacienteDTO => ({
    especialidad: ESPECIALIDAD_ID,
    medico: MEDICO_ID,
    fechaTurno: FECHA_VALIDA,
    observaciones: '  control  ',
    ...overrides,
});

interface RegistroConsulta {
    filtro?: unknown;
    seleccion?: unknown;
    orden?: unknown;
    populates: Array<{ ruta: string; campos?: unknown }>;
}

type ConsultaSimulada<T> = Promise<T> & {
    select: (campos: unknown) => ConsultaSimulada<T>;
    sort: (orden: unknown) => ConsultaSimulada<T>;
    populate: (
        ruta: string,
        campos?: unknown
    ) => ConsultaSimulada<T>;
    session: () => ConsultaSimulada<T>;
};

const crearConsulta = <T>(
    resultado: T,
    registro: RegistroConsulta
): ConsultaSimulada<T> => {
    const consulta = Promise.resolve(
        resultado
    ) as ConsultaSimulada<T>;

    consulta.select = (campos) => {
        registro.seleccion = campos;
        return consulta;
    };
    consulta.sort = (orden) => {
        registro.orden = orden;
        return consulta;
    };
    consulta.populate = (ruta, campos) => {
        registro.populates.push({ ruta, campos });
        return consulta;
    };
    consulta.session = () => consulta;

    return consulta;
};

type ServicioTurnos = {
    createTurnoParaPaciente: (
        idPaciente: string,
        datos: unknown
    ) => Promise<unknown>;
    createTurno: (datos: unknown) => Promise<unknown>;
    getDisponibilidad: (
        medicoId: string,
        fecha: string,
        opciones?: unknown
    ) => Promise<unknown>;
};

type ServicioEspecialidades = {
    getEspecialidadesDisponibles: () => Promise<unknown>;
};

type ServicioMedicos = {
    getMedicosDisponibles: (
        especialidadId: string
    ) => Promise<unknown>;
};

const turnos = turnoService as unknown as ServicioTurnos;
const especialidades =
    especialidadService as unknown as ServicioEspecialidades;
const medicos = medicoService as unknown as ServicioMedicos;

const turnosOriginal = {
    createTurnoParaPaciente: turnos.createTurnoParaPaciente,
    createTurno: turnos.createTurno,
    getDisponibilidad: turnos.getDisponibilidad,
};

const especialidadesOriginal = {
    getEspecialidadesDisponibles:
        especialidades.getEspecialidadesDisponibles,
};

const medicosOriginal = {
    getMedicosDisponibles: medicos.getMedicosDisponibles,
};

let registro: RegistroConsulta;
let datosCreados: Record<string, unknown> | undefined;

const prepararDependencias = (
    medico: MedicoDocumento = crearMedico()
) => {
    mock.method(PacienteModel, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));

    mock.method(
        EspecialidadModel,
        'exists',
        async () => ({ _id: ESPECIALIDAD_ID })
    );

    mock.method(MedicoModel, 'findById', async () => medico);
    mock.method(TurnoModel, 'find', async () => []);
};

const prepararCreacion = () => {
    mock.method(
        TurnoModel,
        'create',
        async (datos: Record<string, unknown>) => {
            datosCreados = datos;
            return {
                _id: new mongoose.Types.ObjectId(TURNO_ID),
                ...datos,
            };
        }
    );

    const turnoCompleto = {
        id: TURNO_ID,
        fechaTurno: fechaLocal('09:00'),
        fechaFin: fechaLocal('09:30'),
        estado: 'pendiente',
        observaciones: 'control',
        especialidad: {
            id: ESPECIALIDAD_ID,
            nombre: 'CARDIOLOGIA',
        },
        medico: {
            id: MEDICO_ID,
            nombre: 'ANA',
            apellido: 'PEREZ',
            matricula: '123456',
        },
    };

    mock.method(TurnoModel, 'findById', () =>
        crearConsulta(turnoCompleto, registro)
    );
};

const crearTokenPaciente = (id: string): string =>
    jwt.sign(
        { tipo: 'paciente', id, rol: 'paciente' },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const crearTokenInterno = (rol: RolUsuario): string =>
    jwt.sign(
        {
            tipo: 'usuario',
            id: new mongoose.Types.ObjectId().toString(),
            email: 'prueba@sala.com',
            rol,
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const solicitar = (
    metodo: string,
    ruta: string,
    opciones: { token?: string; cuerpo?: unknown } = {}
): Promise<Response> => {
    const headers: Record<string, string> = {};
    const incluirCuerpo =
        opciones.cuerpo !== undefined &&
        metodo !== 'GET' &&
        metodo !== 'HEAD';

    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }

    if (incluirCuerpo) {
        headers['content-type'] = 'application/json';
    }

    return fetch(`${urlBase}${ruta}`, {
        method: metodo,
        headers,
        body: incluirCuerpo
            ? JSON.stringify(opciones.cuerpo)
            : undefined,
    });
};

const leerCuerpo = async (
    respuesta: Response
): Promise<Record<string, any>> =>
    (await respuesta.json()) as Record<string, any>;

beforeEach(() => {
    registro = { populates: [] };
    datosCreados = undefined;

    // El middleware de autenticación de pacientes valida que exista.
    mock.method(PacienteModel, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));
});

afterEach(() => {
    mock.restoreAll();

    turnos.createTurnoParaPaciente =
        turnosOriginal.createTurnoParaPaciente;
    turnos.createTurno = turnosOriginal.createTurno;
    turnos.getDisponibilidad = turnosOriginal.getDisponibilidad;

    especialidades.getEspecialidadesDisponibles =
        especialidadesOriginal.getEspecialidadesDisponibles;

    medicos.getMedicosDisponibles =
        medicosOriginal.getMedicosDisponibles;
});

// ============================================================
// SERVICIO: CREACIÓN DEL TURNO DEL PACIENTE
// ============================================================

test('createTurnoParaPaciente usa el ID autenticado e ignora el paciente del body', async () => {
    prepararDependencias();
    prepararCreacion();

    await turnoService.createTurnoParaPaciente(
        PACIENTE_ID,
        {
            ...crearDatosPaciente(),
            paciente: OTRO_PACIENTE_ID,
        } as unknown as CrearTurnoPacienteDTO
    );

    assert.equal(datosCreados?.paciente, PACIENTE_ID);
});

test('createTurnoParaPaciente ignora estado, fechaFin, duración y activo enviados por el cliente', async () => {
    prepararDependencias();
    prepararCreacion();

    await turnoService.createTurnoParaPaciente(
        PACIENTE_ID,
        {
            ...crearDatosPaciente(),
            estado: 'atendido',
            fechaFin: fechaLocal('10:00'),
            duracionTurno: 60,
            activo: false,
        } as unknown as CrearTurnoPacienteDTO
    );

    assert.equal(datosCreados?.estado, 'pendiente');
    assert.equal(
        (datosCreados?.fechaFin as Date).toISOString(),
        `${FECHA_BASE}T12:30:00.000Z`
    );
    assert.equal(
        'duracionTurno' in (datosCreados ?? {}),
        false
    );
    assert.equal('activo' in (datosCreados ?? {}), false);
});

test('createTurnoParaPaciente devuelve una proyección mínima sin paciente', async () => {
    prepararDependencias();
    prepararCreacion();

    const resultado =
        await turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente()
        );

    assert.equal(
        registro.seleccion,
        'fechaTurno fechaFin estado observaciones especialidad medico'
    );
    assert.deepEqual(registro.populates, [
        { ruta: 'especialidad', campos: 'nombre' },
        {
            ruta: 'medico',
            campos: 'nombre apellido matricula',
        },
    ]);
    assert.equal('paciente' in (resultado as object), false);
});

test('createTurnoParaPaciente rechaza un horario que no pertenece a la grilla ofrecida', async () => {
    prepararDependencias();
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente({
                fechaTurno: `${FECHA_BASE}T09:10`,
            })
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.HORARIO_NO_DISPONIBLE
    );
});

test('createTurnoParaPaciente rechaza un horario fuera del horario de atención', async () => {
    prepararDependencias();
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente({
                fechaTurno: `${FECHA_BASE}T12:30`,
            })
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.FUERA_DE_HORARIO
    );
});

test('createTurnoParaPaciente rechaza un horario superpuesto', async () => {
    prepararDependencias();
    mock.method(TurnoModel, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente()
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.HORARIO_OCUPADO
    );
});

test('createTurnoParaPaciente rechaza una especialidad inactiva', async () => {
    prepararDependencias();
    mock.method(
        EspecialidadModel,
        'exists',
        async (filtro: any) => {
            if (filtro?.activo === true) {
                return null;
            }
            return { _id: ESPECIALIDAD_ID };
        }
    );
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente()
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.ESPECIALIDAD_INACTIVA
    );
});

test('createTurnoParaPaciente rechaza un médico inactivo', async () => {
    prepararDependencias(crearMedico({ activo: false }));
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente()
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.MEDICO_INACTIVO
    );
});

test('createTurnoParaPaciente rechaza una especialidad que no corresponde al médico', async () => {
    prepararDependencias(
        crearMedico({
            especialidad: new mongoose.Types.ObjectId(),
        })
    );
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente()
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE
    );
});

test('createTurnoParaPaciente rechaza observaciones de más de 500 caracteres', async () => {
    prepararDependencias();
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente({
                observaciones: 'a'.repeat(501),
            })
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.OBSERVACIONES_DEMASIADO_LARGAS
    );
});

test('createTurnoParaPaciente rechaza un ID de paciente inválido', async () => {
    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            'no-es-un-object-id',
            crearDatosPaciente()
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.PACIENTE_ID_INVALIDO
    );
});

test('createTurnoParaPaciente rechaza datos nulos', async () => {
    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            null as unknown as CrearTurnoPacienteDTO
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.DATOS_INVALIDOS
    );
});

test('createTurnoParaPaciente rechaza una fecha pasada', async () => {
    prepararDependencias();
    prepararCreacion();

    await assert.rejects(
        turnoService.createTurnoParaPaciente(
            PACIENTE_ID,
            crearDatosPaciente({
                fechaTurno: '2020-01-06T09:00',
            })
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.FECHA_PASADA
    );
});

// ============================================================
// DISPONIBILIDAD
// ============================================================

test('la disponibilidad del paciente exige una especialidad activa', async () => {
    mock.method(
        MedicoModel,
        'findById',
        async () => crearMedico()
    );
    mock.method(EspecialidadModel, 'exists', async () => null);
    mock.method(TurnoModel, 'find', async () => []);

    await assert.rejects(
        obtenerDisponibilidad(MEDICO_ID, FECHA_BASE, {
            zonaHoraria: ZONA,
            ahora: AHORA,
            validarEspecialidadActiva: true,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.ESPECIALIDAD_INACTIVA
    );
});

test('la disponibilidad interna conserva el comportamiento sin exigir especialidad activa', async () => {
    mock.method(
        MedicoModel,
        'findById',
        async () => crearMedico()
    );
    mock.method(EspecialidadModel, 'exists', async () => null);
    mock.method(TurnoModel, 'find', async () => []);

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        FECHA_BASE,
        {
            zonaHoraria: ZONA,
            ahora: AHORA,
        }
    );

    assert.ok(resultado.horarios.length > 0);
    assert.equal(
        resultado.horarios[0].inicio.toISOString(),
        `${FECHA_BASE}T11:00:00.000Z`
    );
});

test('la disponibilidad del paciente no ofrece horarios pasados', async () => {
    mock.method(
        MedicoModel,
        'findById',
        async () => crearMedico()
    );
    mock.method(
        EspecialidadModel,
        'exists',
        async () => ({ _id: ESPECIALIDAD_ID })
    );
    mock.method(TurnoModel, 'find', async () => []);

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        FECHA_BASE,
        {
            zonaHoraria: ZONA,
            ahora: new Date(`${FECHA_BASE}T23:00:00.000Z`),
            validarEspecialidadActiva: true,
        }
    );

    assert.equal(resultado.horarios.length, 0);
});

test('la disponibilidad del paciente excluye los horarios ocupados', async () => {
    mock.method(
        MedicoModel,
        'findById',
        async () => crearMedico()
    );
    mock.method(
        EspecialidadModel,
        'exists',
        async () => ({ _id: ESPECIALIDAD_ID })
    );
    mock.method(TurnoModel, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        FECHA_BASE,
        {
            zonaHoraria: ZONA,
            ahora: AHORA,
            validarEspecialidadActiva: true,
        }
    );

    assert.equal(
        resultado.horarios.some(
            (horario) =>
                horario.inicio.toISOString() ===
                `${FECHA_BASE}T12:00:00.000Z`
        ),
        false
    );
});

// ============================================================
// SERVICIO: CATÁLOGO DE ESPECIALIDADES
// ============================================================

test('getEspecialidadesDisponibles filtra activas y proyecta solo campos públicos', async () => {
    const consultaRegistro: RegistroConsulta = {
        populates: [],
    };
    const especialidadesSimuladas = [
        {
            id: 'esp-1',
            nombre: 'CARDIOLOGIA',
            descripcion: 'Corazón',
            codigo: 'CARD',
        },
    ];

    mock.method(
        EspecialidadModel as any,
        'find',
        (filtro: unknown) => {
            consultaRegistro.filtro = filtro;
            return crearConsulta(
                especialidadesSimuladas,
                consultaRegistro
            );
        }
    );

    const resultado =
        await especialidadService.getEspecialidadesDisponibles();

    assert.deepEqual(consultaRegistro.filtro, {
        activo: true,
    });
    assert.equal(
        consultaRegistro.seleccion,
        'nombre descripcion codigo'
    );
    assert.deepEqual(consultaRegistro.orden, {
        nombre: 1,
    });
    assert.equal(resultado, especialidadesSimuladas);
});

// ============================================================
// SERVICIO: CATÁLOGO DE MÉDICOS
// ============================================================

test('getMedicosDisponibles filtra por especialidad y activo con proyección segura', async () => {
    const consultaRegistro: RegistroConsulta = {
        populates: [],
    };

    mock.method(
        EspecialidadModel as any,
        'findOne',
        () =>
            crearConsulta(
                { _id: ESPECIALIDAD_ID },
                consultaRegistro
            )
    );

    const medicosSimulados = [
        {
            id: MEDICO_ID,
            nombre: 'ANA',
            apellido: 'PEREZ',
            matricula: '123456',
            duracionTurno: 30,
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
            },
        },
    ];

    mock.method(
        MedicoModel as any,
        'find',
        (filtro: unknown) => {
            consultaRegistro.filtro = filtro;
            return crearConsulta(
                medicosSimulados,
                consultaRegistro
            );
        }
    );

    const resultado =
        await medicoService.getMedicosDisponibles(
            ESPECIALIDAD_ID
        );

    assert.deepEqual(consultaRegistro.filtro, {
        especialidad: ESPECIALIDAD_ID,
        activo: true,
    });
    assert.equal(
        consultaRegistro.seleccion,
        'nombre apellido matricula especialidad duracionTurno'
    );
    assert.deepEqual(consultaRegistro.populates, [
        { ruta: 'especialidad', campos: 'nombre' },
    ]);
    assert.equal(resultado, medicosSimulados);
});

test('getMedicosDisponibles rechaza un ID de especialidad inválido', async () => {
    await assert.rejects(
        medicoService.getMedicosDisponibles('no-es-id'),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'El ID de la especialidad no es válido'
    );
});

test('getMedicosDisponibles rechaza una especialidad inexistente', async () => {
    const consultaRegistro: RegistroConsulta = {
        populates: [],
    };

    mock.method(
        EspecialidadModel as any,
        'findOne',
        () => crearConsulta(null, consultaRegistro)
    );
    mock.method(
        EspecialidadModel as any,
        'exists',
        async () => null
    );

    await assert.rejects(
        medicoService.getMedicosDisponibles(
            ESPECIALIDAD_ID
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'La especialidad indicada no existe'
    );
});

test('getMedicosDisponibles rechaza una especialidad inactiva', async () => {
    const consultaRegistro: RegistroConsulta = {
        populates: [],
    };

    mock.method(
        EspecialidadModel as any,
        'findOne',
        () => crearConsulta(null, consultaRegistro)
    );
    mock.method(
        EspecialidadModel as any,
        'exists',
        async () => ({ _id: ESPECIALIDAD_ID })
    );

    await assert.rejects(
        medicoService.getMedicosDisponibles(
            ESPECIALIDAD_ID
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                'La especialidad no está activa'
    );
});

// ============================================================
// ENDPOINTS: AUTORIZACIÓN E IDENTIDAD
// ============================================================

test('POST /turnos/mi-turno rechaza solicitudes sin token', async () => {
    const respuesta = await solicitar(
        'POST',
        '/api/v1/turnos/mi-turno',
        { cuerpo: crearDatosPaciente() }
    );

    assert.equal(respuesta.status, 401);
});

test('POST /turnos/mi-turno rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ] as const) {
        const respuesta = await solicitar(
            'POST',
            '/api/v1/turnos/mi-turno',
            {
                token: crearTokenInterno(rol),
                cuerpo: crearDatosPaciente(),
            }
        );

        assert.equal(
            respuesta.status,
            403,
            `El rol ${rol} no debería acceder`
        );
    }
});

test('POST /turnos/mi-turno registra el turno para el paciente del JWT', async () => {
    let capturado:
        | { idPaciente: string; datos: unknown }
        | undefined;

    turnos.createTurnoParaPaciente = async (
        idPaciente,
        datos
    ) => {
        capturado = { idPaciente, datos };
        return {
            id: TURNO_ID,
            estado: 'pendiente',
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
            },
            medico: {
                id: MEDICO_ID,
                nombre: 'ANA',
                apellido: 'PEREZ',
            },
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        };
    };

    const cuerpo = {
        ...crearDatosPaciente(),
        paciente: OTRO_PACIENTE_ID,
        estado: 'atendido',
        fechaFin: fechaLocal('10:00'),
        activo: false,
    };

    const respuesta = await solicitar(
        'POST',
        '/api/v1/turnos/mi-turno',
        {
            token: crearTokenPaciente(PACIENTE_ID),
            cuerpo,
        }
    );
    const body = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 201);
    assert.equal(body.success, true);
    assert.equal(
        body.message,
        'Turno registrado exitosamente'
    );
    assert.equal(body.data.id, TURNO_ID);
    assert.equal(capturado?.idPaciente, PACIENTE_ID);
    assert.equal(
        (capturado?.datos as Record<string, unknown>).paciente,
        OTRO_PACIENTE_ID
    );
});

test('POST /turnos/mi-turno rechaza un token de paciente inexistente', async () => {
    mock.method(
        PacienteModel,
        'exists',
        async () => null
    );

    const respuesta = await solicitar(
        'POST',
        '/api/v1/turnos/mi-turno',
        {
            token: crearTokenPaciente(PACIENTE_ID),
            cuerpo: crearDatosPaciente(),
        }
    );

    assert.equal(respuesta.status, 401);
});

// ============================================================
// ENDPOINTS: CATÁLOGO DE ESPECIALIDADES
// ============================================================

test('GET /especialidades/disponibles devuelve solo campos públicos al paciente', async () => {
    especialidades.getEspecialidadesDisponibles =
        async () => [
            {
                id: 'esp-1',
                nombre: 'CARDIOLOGIA',
                descripcion: 'Corazón',
                codigo: 'CARD',
            },
        ];

    const respuesta = await solicitar(
        'GET',
        '/api/v1/especialidades/disponibles',
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );
    const body = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 200);
    assert.equal(body.total, 1);

    const [especialidad] = body.data;
    assert.deepEqual(
        Object.keys(especialidad).sort(),
        ['codigo', 'descripcion', 'id', 'nombre'].sort()
    );
    assert.equal('activo' in especialidad, false);
    assert.equal('createdAt' in especialidad, false);
});

test('GET /especialidades/disponibles rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ] as const) {
        const respuesta = await solicitar(
            'GET',
            '/api/v1/especialidades/disponibles',
            { token: crearTokenInterno(rol) }
        );

        assert.equal(
            respuesta.status,
            403,
            `El rol ${rol} no debería acceder`
        );
    }
});

test('GET /especialidades conserva el acceso restringido al personal', async () => {
    const respuesta = await solicitar(
        'GET',
        '/api/v1/especialidades',
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );

    assert.equal(respuesta.status, 403);
});

// ============================================================
// ENDPOINTS: CATÁLOGO DE MÉDICOS
// ============================================================

test('GET /turnos/medicos-disponibles devuelve solo campos públicos al paciente', async () => {
    medicos.getMedicosDisponibles = async () => [
        {
            id: MEDICO_ID,
            nombre: 'ANA',
            apellido: 'PEREZ',
            matricula: '123456',
            duracionTurno: 30,
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
            },
        },
    ];

    const respuesta = await solicitar(
        'GET',
        `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`,
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );
    const body = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 200);
    assert.equal(body.total, 1);

    const [medico] = body.data;
    assert.deepEqual(
        Object.keys(medico).sort(),
        [
            'apellido',
            'duracionTurno',
            'especialidad',
            'id',
            'matricula',
            'nombre',
        ].sort()
    );
    assert.equal('email' in medico, false);
    assert.equal('telefono' in medico, false);
    assert.equal('consultorios' in medico, false);
    assert.equal('horariosAtencion' in medico, false);
});

test('GET /turnos/medicos-disponibles rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ] as const) {
        const respuesta = await solicitar(
            'GET',
            `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`,
            { token: crearTokenInterno(rol) }
        );

        assert.equal(
            respuesta.status,
            403,
            `El rol ${rol} no debería acceder`
        );
    }
});

test('GET /turnos/medicos-disponibles rechaza un ObjectId inválido', async () => {
    const respuesta = await solicitar(
        'GET',
        '/api/v1/turnos/medicos-disponibles?especialidad=no-es-id',
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );

    assert.equal(respuesta.status, 400);
});

test('GET /turnos/medicos-disponibles responde 404 si la especialidad no existe', async () => {
    const consultaRegistro: RegistroConsulta = {
        populates: [],
    };

    mock.method(
        EspecialidadModel as any,
        'findOne',
        () => crearConsulta(null, consultaRegistro)
    );
    mock.method(
        EspecialidadModel as any,
        'exists',
        async () => null
    );

    const respuesta = await solicitar(
        'GET',
        `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`,
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );

    assert.equal(respuesta.status, 404);
});

test('GET /turnos/medicos-disponibles responde 409 si la especialidad está inactiva', async () => {
    const consultaRegistro: RegistroConsulta = {
        populates: [],
    };

    mock.method(
        EspecialidadModel as any,
        'findOne',
        () => crearConsulta(null, consultaRegistro)
    );
    mock.method(
        EspecialidadModel as any,
        'exists',
        async () => ({ _id: ESPECIALIDAD_ID })
    );

    const respuesta = await solicitar(
        'GET',
        `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`,
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );

    assert.equal(respuesta.status, 409);
});

// ============================================================
// ENDPOINTS: DISPONIBILIDAD
// ============================================================

test('GET /turnos/disponibilidad permite al paciente y exige especialidad activa', async () => {
    let opcionesRecibidas: unknown;

    turnos.getDisponibilidad = async (
        _medicoId,
        _fecha,
        opciones
    ) => {
        opcionesRecibidas = opciones;
        return { horarios: [] };
    };

    const respuesta = await solicitar(
        'GET',
        `/api/v1/turnos/disponibilidad?medicoId=${MEDICO_ID}&fecha=${FECHA_BASE}`,
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );

    assert.equal(respuesta.status, 200);
    assert.deepEqual(opcionesRecibidas, {
        validarEspecialidadActiva: true,
    });
});

test('GET /turnos/disponibilidad conserva el comportamiento interno', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ] as const) {
        let opcionesRecibidas: unknown;

        turnos.getDisponibilidad = async (
            _medicoId,
            _fecha,
            opciones
        ) => {
            opcionesRecibidas = opciones;
            return { horarios: [] };
        };

        const respuesta = await solicitar(
            'GET',
            `/api/v1/turnos/disponibilidad?medicoId=${MEDICO_ID}&fecha=${FECHA_BASE}`,
            { token: crearTokenInterno(rol) }
        );

        assert.equal(respuesta.status, 200);
        assert.deepEqual(opcionesRecibidas, {
            validarEspecialidadActiva: false,
        });
    }
});

// ============================================================
// REGRESIONES DE PERMISOS INTERNOS
// ============================================================

test('el paciente no puede acceder a las rutas internas de turnos', async () => {
    const solicitudes: Array<[string, string]> = [
        ['GET', '/api/v1/turnos'],
        ['GET', '/api/v1/turnos/mis-turnos'],
        ['POST', '/api/v1/turnos'],
        ['PATCH', `/api/v1/turnos/${TURNO_ID}/estado`],
        ['DELETE', `/api/v1/turnos/${TURNO_ID}`],
    ];

    for (const [metodo, ruta] of solicitudes) {
        const respuesta = await solicitar(metodo, ruta, {
            token: crearTokenPaciente(PACIENTE_ID),
            cuerpo: {},
        });

        assert.equal(
            respuesta.status,
            403,
            `${metodo} ${ruta} debería estar restringido`
        );
    }
});

test('la creación interna de turnos sigue funcionando para admin y recepción', async () => {
    turnos.createTurno = async () => ({
        id: TURNO_ID,
        estado: 'pendiente',
    });

    for (const rol of ['admin', 'recepcionista'] as const) {
        const respuesta = await solicitar(
            'POST',
            '/api/v1/turnos',
            {
                token: crearTokenInterno(rol),
                cuerpo: {},
            }
        );

        assert.equal(
            respuesta.status,
            201,
            `El rol ${rol} debería crear turnos`
        );
    }
});

test('el paciente no puede acceder al directorio interno de médicos', async () => {
    const respuesta = await solicitar(
        'GET',
        '/api/v1/medicos',
        {
            token: crearTokenPaciente(PACIENTE_ID),
        }
    );

    assert.equal(respuesta.status, 403);
});





