import type { Request } from 'express';

import type { ActualizarUsuarioDTO } from '../dtos/ActualizarUsuarioDTO';

// ============================================================
// ACTUALIZAR USUARIO
// ============================================================

export interface UsuarioUpdateRequest extends Request {
    params: {
        id: string;
    };

    body: ActualizarUsuarioDTO;
}
