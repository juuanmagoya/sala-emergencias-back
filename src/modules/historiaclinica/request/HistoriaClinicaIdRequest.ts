import type { Request } from 'express';

// ============================================================
// ID DE HISTORIA CLÍNICA
// ============================================================

export interface HistoriaClinicaIdRequest extends Request {
    params: {
        id: string;
    };
}
