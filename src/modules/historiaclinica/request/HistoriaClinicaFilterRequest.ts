import type { Request } from 'express';

// ============================================================
// OBTENER HISTORIAS CLÍNICAS (filtros opcionalmente por query)
// ============================================================

export interface HistoriaClinicaFilterRequest extends Request {
    query: {
        paciente?: string;
        estado?: string;
        tipoAtencion?: string;
    };
}
