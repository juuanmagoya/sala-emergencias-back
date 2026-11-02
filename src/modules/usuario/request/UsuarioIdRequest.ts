import type { Request } from 'express';

// ============================================================
// IDENTIFICADOR DE USUARIO
// ============================================================

export interface UsuarioIdRequest extends Request {
    params: {
        id: string;
    };
}
