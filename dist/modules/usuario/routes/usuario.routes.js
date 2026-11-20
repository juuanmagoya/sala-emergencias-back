"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const usuario_controller_1 = require("../controllers/usuario.controller");
const router = (0, express_1.Router)();
// Gestión de cuentas de acceso: exclusiva de administración.
// No se crean ni modifican cuentas con rol `admin` desde este CRUD.
router.get('/', (0, autorizarRoles_middleware_1.default)('admin'), usuario_controller_1.getUsuarios);
router.post('/', (0, autorizarRoles_middleware_1.default)('admin'), usuario_controller_1.createUsuario);
router.get('/:id', (0, autorizarRoles_middleware_1.default)('admin'), usuario_controller_1.getUsuarioById);
router.put('/:id', (0, autorizarRoles_middleware_1.default)('admin'), usuario_controller_1.updateUsuario);
// Baja lógica: la cuenta se desactiva, pero el perfil médico,
// sus turnos y sus historias clínicas se conservan.
router.delete('/:id', (0, autorizarRoles_middleware_1.default)('admin'), usuario_controller_1.desactivarUsuario);
exports.default = router;
