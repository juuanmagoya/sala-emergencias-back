import type { UsuarioAutenticado } from '../modules/usuario/types/usuario.types';

// Extiende Request con el usuario autenticado que agrega authMiddleware.
declare global {
    namespace Express {
        interface Request {
            usuario?: UsuarioAutenticado;
        }
    }
}

export {};
