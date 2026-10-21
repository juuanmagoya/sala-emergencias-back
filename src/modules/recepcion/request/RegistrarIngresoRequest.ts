import type { Request } from 'express';

import type { CrearIngresoDTO } from '../dtos/CrearIngresoDTO';

// ============================================================
// REGISTRAR INGRESO
// ============================================================

export interface RegistrarIngresoRequest extends Request {
    body: CrearIngresoDTO;
}
