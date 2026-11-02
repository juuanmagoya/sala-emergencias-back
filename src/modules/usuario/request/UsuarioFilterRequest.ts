import type { Request } from 'express';

// ============================================================
// LISTAR USUARIOS
//
// Los valores se validan en el service: no se confía en el query
// para construir directamente el filtro de MongoDB.
// ============================================================

export interface UsuarioFilterRequest extends Request {
    query: {
        rol?: string;
        activo?: string;
    };
}
