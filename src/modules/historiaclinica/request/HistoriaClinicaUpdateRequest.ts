import type { Request } from 'express';

import type { ActualizarHistoriaClinicaDTO } from '../dtos/ActualizarHistoriaClinicaDTO';

// ============================================================
// ACTUALIZAR HISTORIA CLÍNICA
// ============================================================

export interface HistoriaClinicaUpdateRequest extends Request {
    params: {
        id: string;
    };

    body: ActualizarHistoriaClinicaDTO;
}
