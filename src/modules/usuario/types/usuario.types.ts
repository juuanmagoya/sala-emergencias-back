// ============================================
// TIPOS - Usuario
// ============================================

// Única fuente de verdad para los roles del sistema.
export const ROLES_USUARIO = [
    'admin',
    'medico',
    'recepcionista',
] as const;

export type RolUsuario = (typeof ROLES_USUARIO)[number];

// El registro público crea cuentas de recepción: es el rol de menor privilegio.
// Nunca se asigna `admin` de forma automática.
export const ROL_POR_DEFECTO: RolUsuario = 'recepcionista';

export const esRolUsuario = (valor: unknown): valor is RolUsuario =>
    typeof valor === 'string' &&
    ROLES_USUARIO.some((rol) => rol === valor);

// Datos del usuario autenticado: es el payload del JWT y el contenido de req.usuario.
export interface UsuarioAutenticado {
    id: string;
    email: string;
    rol: RolUsuario;
    // Perfil médico asociado (solo presente si el usuario está vinculado).
    medico?: string;
}
