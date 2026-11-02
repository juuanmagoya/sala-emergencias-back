import type { RolGestionable } from '../types/usuario.types';

// ============================================================
// CREAR USUARIO
//
// El rol solo admite los valores gestionables por administración.
// ============================================================

export interface CrearUsuarioDTO {
    nombre: string;
    email: string;
    password: string;
    rol: RolGestionable;
    medico?: string | null;
}
