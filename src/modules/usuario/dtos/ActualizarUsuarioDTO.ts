import type { RolGestionable } from '../types/usuario.types';

// ============================================================
// ACTUALIZAR USUARIO
//
// Todos los campos son opcionales. La contraseña solo se modifica
// cuando se envía explícitamente.
// ============================================================

export interface ActualizarUsuarioDTO {
    nombre?: string;
    email?: string;
    password?: string;
    rol?: RolGestionable;
    medico?: string | null;
}
