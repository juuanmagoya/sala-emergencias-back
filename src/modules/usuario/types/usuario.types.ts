// ============================================
// TIPOS - Usuario
// ============================================

// Roles de las cuentas internas del sistema.
export const ROLES_USUARIO = [
    'admin',
    'medico',
    'recepcionista',
] as const;

export type RolUsuario = (typeof ROLES_USUARIO)[number];

// Los pacientes no son documentos Usuario: se autentican directamente
// contra la colección Paciente.
export const ROL_PACIENTE = 'paciente' as const;

export type RolAutenticado = RolUsuario | typeof ROL_PACIENTE;

// Roles que puede gestionar el CRUD administrativo de usuarios. `admin`
// queda fuera: no se crea ni se modifica desde esos endpoints.
export const ROLES_GESTIONABLES = [
    'medico',
    'recepcionista',
] as const;

export type RolGestionable = (typeof ROLES_GESTIONABLES)[number];

export const esRolGestionable = (
    valor: unknown
): valor is RolGestionable =>
    typeof valor === 'string' &&
    ROLES_GESTIONABLES.some((rol) => rol === valor);

export const esRolUsuario = (valor: unknown): valor is RolUsuario =>
    typeof valor === 'string' &&
    ROLES_USUARIO.some((rol) => rol === valor);

export const esRolAutenticado = (
    valor: unknown
): valor is RolAutenticado =>
    typeof valor === 'string' &&
    (esRolUsuario(valor) || valor === ROL_PACIENTE);

// Datos del usuario interno autenticado: payload del JWT y contenido de
// req.usuario. `tipo` distingue esta identidad de la de un paciente.
export interface UsuarioAutenticado {
    tipo: 'usuario';
    id: string;
    email: string;
    rol: RolUsuario;
    // Perfil médico asociado (solo presente si el usuario está vinculado).
    medico?: string;
}

// Datos del paciente autenticado. No tiene email ni contraseña: la
// credencial es DNI + teléfono contra la ficha Paciente.
export interface PacienteAutenticado {
    tipo: 'paciente';
    id: string;
    rol: typeof ROL_PACIENTE;
}

// Identidad que authMiddleware adjunta a req.usuario.
export type IdentidadAutenticada =
    | UsuarioAutenticado
    | PacienteAutenticado;
