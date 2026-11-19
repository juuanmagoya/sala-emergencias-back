import type { Request } from 'express';

import type {
    ActualizarEstadoTurnoDTO,
    CrearTurnoDTO,
    CrearTurnoPacienteDTO,
} from '../dtos/TurnoDTO';

// ============================================================
// CREAR TURNO
// ============================================================

export interface CrearTurnoRequest extends Request {
    body: CrearTurnoDTO;
}

// ============================================================
// CREAR TURNO DEL PACIENTE AUTENTICADO
// ============================================================

export interface CrearTurnoPacienteRequest extends Request {
    body: CrearTurnoPacienteDTO;
}

// ============================================================
// MÉDICOS DISPONIBLES POR ESPECIALIDAD
// ============================================================

export interface MedicosDisponiblesRequest extends Request {
    query: {
        especialidad?: string;
    };
}

// ============================================================
// CONSULTAR DISPONIBILIDAD
// ============================================================

export interface DisponibilidadRequest extends Request {
    query: {
        medicoId?: string;
        fecha?: string;
        especialidad?: string;
    };
}

// ============================================================
// ID DE TURNO
// ============================================================

export interface TurnoIdRequest extends Request {
    params: {
        id: string;
    };
}

// ============================================================
// ACTUALIZAR ESTADO DEL TURNO
// ============================================================

export interface ActualizarEstadoTurnoRequest extends TurnoIdRequest {
    body: ActualizarEstadoTurnoDTO;
}
