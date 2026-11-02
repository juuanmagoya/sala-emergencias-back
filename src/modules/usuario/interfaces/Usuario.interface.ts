import type { Types } from 'mongoose';

import type { RolUsuario } from '../types/usuario.types';

export interface IUsuario {
    nombre: string;
    email: string;
    password: string;
    rol: RolUsuario;
    // Una cuenta desactivada no puede iniciar sesión. Los documentos
    // heredados sin este campo se consideran activos.
    activo: boolean;
    // Perfil médico asociado. Solo puede existir en usuarios con rol `medico`
    // y solo cuando el documento de Medico referenciado existe.
    medico?: Types.ObjectId;
}
