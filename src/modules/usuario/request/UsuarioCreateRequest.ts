import type { Request } from 'express';

import type { CrearUsuarioDTO } from '../dtos/CrearUsuarioDTO';

// ============================================================
// CREAR USUARIO
// ============================================================

export interface UsuarioCreateRequest extends Request {
    body: CrearUsuarioDTO;
}
