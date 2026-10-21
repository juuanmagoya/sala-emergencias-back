import type { Request } from 'express';

import type { CrearHistoriaClinicaDTO } from '../dtos/CrearHistoriaClinicaDTO';

// ============================================================
// CREAR HISTORIA CLÍNICA
// ============================================================

export interface HistoriaClinicaCreateRequest extends Request {
    body: CrearHistoriaClinicaDTO;
}
