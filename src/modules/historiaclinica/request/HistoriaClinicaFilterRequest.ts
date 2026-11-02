import type { Request } from 'express';

// ============================================================
// OBTENER HISTORIAS CLÍNICAS (filtros opcionales por query)
// ============================================================

export interface HistoriaClinicaFilterRequest extends Request {
    query: {
        paciente?: string;
        medico?: string;
    };
}
