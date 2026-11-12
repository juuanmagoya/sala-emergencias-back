import type { Request } from 'express';

import type {
    ActualizarEstadoTurnoDTO,
    CrearTurnoDTO,
} from '../dtos/TurnoDTO';

// ============================================================
// CREAR TURNO
// ============================================================

export interface CrearTurnoRequest extends Request {
    body: CrearTurnoDTO;
}

// ============================================================
// CONSULTAR DISPONIBILIDAD
// ============================================================

export interface DisponibilidadRequest extends Request {
    query: {
        medicoId?: string;
        fecha?: string;
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
