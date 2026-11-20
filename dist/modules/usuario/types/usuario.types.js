"use strict";
// ============================================
// TIPOS - Usuario
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.esRolAutenticado = exports.esRolUsuario = exports.esRolGestionable = exports.ROLES_GESTIONABLES = exports.ROL_PACIENTE = exports.ROLES_USUARIO = void 0;
// Roles de las cuentas internas del sistema.
exports.ROLES_USUARIO = [
    'admin',
    'medico',
    'recepcionista',
];
// Los pacientes no son documentos Usuario: se autentican directamente
// contra la colección Paciente.
exports.ROL_PACIENTE = 'paciente';
// Roles que puede gestionar el CRUD administrativo de usuarios. `admin`
// queda fuera: no se crea ni se modifica desde esos endpoints.
exports.ROLES_GESTIONABLES = [
    'medico',
    'recepcionista',
];
const esRolGestionable = (valor) => typeof valor === 'string' &&
    exports.ROLES_GESTIONABLES.some((rol) => rol === valor);
exports.esRolGestionable = esRolGestionable;
const esRolUsuario = (valor) => typeof valor === 'string' &&
    exports.ROLES_USUARIO.some((rol) => rol === valor);
exports.esRolUsuario = esRolUsuario;
const esRolAutenticado = (valor) => typeof valor === 'string' &&
    ((0, exports.esRolUsuario)(valor) || valor === exports.ROL_PACIENTE);
exports.esRolAutenticado = esRolAutenticado;
