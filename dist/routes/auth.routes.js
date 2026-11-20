"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const limitadorLogin_middleware_js_1 = __importDefault(require("../middlewares/limitadorLogin.middleware.js"));
const router = (0, express_1.Router)();
// El login está limitado por cantidad de intentos fallidos por IP.
// No existe registro público: las cuentas internas las crea únicamente
// un administrador desde /api/v1/usuarios.
router.post('/login', limitadorLogin_middleware_js_1.default, auth_controller_js_1.login);
// Login de pacientes: DNI + teléfono contra la ficha Paciente. No crea
// documentos en Usuario.
router.post('/paciente/login', limitadorLogin_middleware_js_1.default, auth_controller_js_1.loginPaciente);
exports.default = router;
