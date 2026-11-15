import type { IdentidadAutenticada } from '../modules/usuario/types/usuario.types';

// Extiende Request con la identidad autenticada que agrega authMiddleware.
// Puede ser un usuario interno o un paciente.
declare global {
    namespace Express {
        interface Request {
            usuario?: IdentidadAutenticada;
        }
    }
}

export {};
