import type { Request } from 'express';

import type { CrearTurnoDTO } from '../dtos/TurnoDTO';

// ============================================================
// CREAR TURNO
// ============================================================

export interface CrearTurnoRequest extends Request {
    body: CrearTurnoDTO;

    query: {
        urgencia?: string;
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
