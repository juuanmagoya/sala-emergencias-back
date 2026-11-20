"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const mongoose_1 = __importDefault(require("mongoose"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const usuario_types_1 = require("../types/usuario.types");
// ============================================================
// HELPERS
// ============================================================
const crearUsuario = (datos = {}) => new Usuario_1.default({
    nombre: 'Usuario de prueba',
    email: 'usuario@prueba.com',
    password: 'secreto123',
    ...datos,
});
// ============================================================
// ROLES PERMITIDOS
// ============================================================
(0, node_test_1.default)('define exactamente los roles admin, medico y recepcionista', () => {
    strict_1.default.deepEqual([...usuario_types_1.ROLES_USUARIO], [
        'admin',
        'medico',
        'recepcionista',
    ]);
});
(0, node_test_1.default)('acepta los tres roles permitidos en el modelo', async () => {
    for (const rol of usuario_types_1.ROLES_USUARIO) {
        const usuario = crearUsuario({ rol });
        await usuario.validate();
        strict_1.default.equal(usuario.rol, rol);
    }
});
(0, node_test_1.default)('rechaza un rol fuera del conjunto permitido', async () => {
    const usuario = crearUsuario({ rol: 'superadmin' });
    await strict_1.default.rejects(usuario.validate(), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors.rol);
        return true;
    });
});
(0, node_test_1.default)('exige un rol explícito y no asigna privilegios por defecto', async () => {
    const usuario = crearUsuario();
    await strict_1.default.rejects(usuario.validate(), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors.rol);
        return true;
    });
});
// ============================================================
// VALIDACIÓN DE ROLES EN TIEMPO DE EJECUCIÓN
// ============================================================
(0, node_test_1.default)('reconoce únicamente los roles permitidos', () => {
    strict_1.default.equal((0, usuario_types_1.esRolUsuario)('admin'), true);
    strict_1.default.equal((0, usuario_types_1.esRolUsuario)('medico'), true);
    strict_1.default.equal((0, usuario_types_1.esRolUsuario)('recepcionista'), true);
    strict_1.default.equal((0, usuario_types_1.esRolUsuario)('superadmin'), false);
    strict_1.default.equal((0, usuario_types_1.esRolUsuario)(''), false);
    strict_1.default.equal((0, usuario_types_1.esRolUsuario)(undefined), false);
    strict_1.default.equal((0, usuario_types_1.esRolUsuario)(null), false);
});
