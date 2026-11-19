import type { Request, Response } from 'express';

import respuestaEstandar from '../../../utils/respuestaEstandar';

import medicoService from '../../medico/services/medico.service';

import turnoService from '../services/turno.service';

import { responderErrorTurno } from '../utils/responderErrorTurno';

import type {
    ActualizarEstadoTurnoRequest,
    CrearTurnoPacienteRequest,
    CrearTurnoRequest,
    DisponibilidadRequest,
    MedicosDisponiblesRequest,
    TurnoIdRequest,
} from '../request/Turnos.request';

// ============================================================
// OBTENER TURNOS
// ============================================================

export const getTurnos = async (_req: Request, res: Response) => {
    try {
        const turnos = await turnoService.getTurnos();

        return respuestaEstandar(
            res,
            200,
            true,
            'Turnos obtenidos exitosamente',
            turnos
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error interno del servidor'
        );
    }
};

// ============================================================
// CONSULTAR DISPONIBILIDAD
// ============================================================

export const getDisponibilidad = async (
    req: DisponibilidadRequest,
    res: Response
) => {
    try {
        const disponibilidad =
            await turnoService.getDisponibilidad(
                req.query.medicoId ?? '',
                req.query.fecha ?? '',
                {
                    // El portal de pacientes solo consulta médicos cuya
                    // especialidad siga activa. Los roles internos
                    // conservan el comportamiento actual.
                    validarEspecialidadActiva:
                        req.usuario?.rol === 'paciente',
                    ...(req.query.especialidad
                        ? {
                              especialidadId:
                                  req.query.especialidad,
                          }
                        : {}),
                }
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Disponibilidad obtenida exitosamente',
            disponibilidad
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al consultar la disponibilidad'
        );
    }
};

// ============================================================
// MÉDICOS DISPONIBLES POR ESPECIALIDAD (PORTAL DE PACIENTES)
// ============================================================

export const getMedicosDisponibles = async (
    req: MedicosDisponiblesRequest,
    res: Response
) => {
    try {
        const medicos =
            await medicoService.getMedicosDisponibles(
                req.query.especialidad ?? ''
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Médicos disponibles obtenidos exitosamente',
            medicos
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al obtener los médicos disponibles'
        );
    }
};

// ============================================================
// TURNOS DEL MÉDICO AUTENTICADO
// ============================================================

export const getMisTurnos = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.usuario) {
            return respuestaEstandar(
                res,
                401,
                false,
                'No autenticado'
            );
        }

        const turnos = await turnoService.getTurnosDelMedico(
            req.usuario.id
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Turnos del médico obtenidos exitosamente',
            turnos
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al obtener los turnos del médico'
        );
    }
};

// ============================================================
// HISTORIAL DE TURNOS DEL PACIENTE AUTENTICADO
// ============================================================

export const getMiHistorialTurnos = async (
    req: Request,
    res: Response
) => {
    // Datos personales: no deben quedar en cachés compartidas.
    res.set('Cache-Control', 'no-store');

    try {
        const identidad = req.usuario;

        // La ruta ya exige rol `paciente`; se revalida el tipo para no
        // depender únicamente de la autorización por rol.
        if (!identidad || identidad.tipo !== 'paciente') {
            return respuestaEstandar(
                res,
                401,
                false,
                'No autenticado'
            );
        }

        // El ID sale exclusivamente del JWT. No se lee `pacienteId`
        // desde params, query ni body.
        const turnos =
            await turnoService.getHistorialDelPaciente(identidad.id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Historial de turnos obtenido exitosamente',
            turnos
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al obtener el historial de turnos'
        );
    }
};

// ============================================================
// CREAR TURNO DEL PACIENTE AUTENTICADO
// ============================================================

export const createMiTurno = async (
    req: CrearTurnoPacienteRequest,
    res: Response
) => {
    try {
        const identidad = req.usuario;

        // La ruta ya exige rol `paciente`; se revalida el tipo para no
        // depender únicamente de la autorización por rol.
        if (!identidad || identidad.tipo !== 'paciente') {
            return respuestaEstandar(
                res,
                401,
                false,
                'No autenticado'
            );
        }

        // El ID del paciente sale exclusivamente del JWT. No se lee
        // ningún `paciente` enviado por el cliente.
        const turno =
            await turnoService.createTurnoParaPaciente(
                identidad.id,
                req.body
            );

        return respuestaEstandar(
            res,
            201,
            true,
            'Turno registrado exitosamente',
            turno
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al registrar el turno'
        );
    }
};

// ============================================================
// CREAR TURNO
// ============================================================

export const createTurno = async (
    req: CrearTurnoRequest,
    res: Response
) => {
    try {
        const origenPeticion = req.headers['x-origen'];

        console.log('🌎 Peticion realizada desde:', origenPeticion);

        // El estado inicial, la duración y la fecha de fin se derivan
        // en el servidor. El cliente no puede imponerlos.
        const turnoCompleto = await turnoService.createTurno(
            req.body
        );

        return respuestaEstandar(
            res,
            201,
            true,
            'Turno creado exitosamente',
            turnoCompleto
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error interno del servidor'
        );
    }
};

// ============================================================
// ACTUALIZAR ESTADO
// ============================================================

export const actualizarEstadoTurno = async (
    req: ActualizarEstadoTurnoRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const turnoActualizado =
            await turnoService.actualizarEstadoTurno(
                id,
                req.body
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Estado del turno actualizado exitosamente',
            turnoActualizado
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al actualizar el estado del turno'
        );
    }
};

// ============================================================
// ELIMINAR TURNO
// ============================================================

export const deleteTurno = async (
    req: TurnoIdRequest,
    res: Response
) => {
    try {
        const { id } = req.params;

        const turnoBorrado = await turnoService.deleteTurno(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Turno eliminado exitosamente',
            turnoBorrado
        );

    } catch (error: unknown) {
        return responderErrorTurno(
            res,
            error,
            'Error al eliminar el turno'
        );
    }
};
