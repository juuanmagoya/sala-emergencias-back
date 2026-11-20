"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const turno_messages_1 = require("../constants/turno.messages");
const responderErrorTurno_1 = require("../utils/responderErrorTurno");
const crearRespuesta = () => {
    let status = 0;
    let cuerpo = {};
    const res = {
        status(codigo) {
            status = codigo;
            return res;
        },
        json(datos) {
            cuerpo = datos;
            return res;
        },
    };
    return {
        res: res,
        obtener: () => ({ status, cuerpo }),
    };
};
const crearDuplicado = (keyPattern, keyValue) => Object.assign(new Error('duplicado'), {
    code: 11000,
    keyPattern,
    keyValue,
});
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
// ============================================================
// DUPLICADOS DE PACIENTE
// ============================================================
(0, node_test_1.test)('identifica un DNI duplicado sin informarlo como horario ocupado', () => {
    const { res, obtener } = crearRespuesta();
    (0, responderErrorTurno_1.responderErrorTurno)(res, crearDuplicado({ dni: 1 }, { dni: '12345678' }), 'Error al registrar el ingreso');
    const { status, cuerpo } = obtener();
    strict_1.default.equal(status, 400);
    strict_1.default.equal(cuerpo.success, false);
    strict_1.default.equal(cuerpo.message, 'El DNI ya está registrado');
    strict_1.default.equal(cuerpo.data, 'Ya existe un paciente registrado con ese DNI');
});
(0, node_test_1.test)('identifica un email duplicado usando keyValue', () => {
    const { res, obtener } = crearRespuesta();
    (0, responderErrorTurno_1.responderErrorTurno)(res, crearDuplicado(undefined, {
        email: 'paciente@ejemplo.com',
    }), 'Error al registrar el ingreso');
    const { status, cuerpo } = obtener();
    strict_1.default.equal(status, 400);
    strict_1.default.equal(cuerpo.message, 'El correo electrónico ya está registrado');
    strict_1.default.equal(cuerpo.data, 'Ya existe un paciente registrado con ese correo electrónico');
});
// ============================================================
// DUPLICADOS DE TURNO
// ============================================================
(0, node_test_1.test)('identifica la colisión del índice medico+fechaTurno', () => {
    const { res, obtener } = crearRespuesta();
    (0, responderErrorTurno_1.responderErrorTurno)(res, crearDuplicado({ medico: 1, fechaTurno: 1 }, {
        medico: '507f1f77bcf86cd799439013',
        fechaTurno: '2026-11-02T12:00:00.000Z',
    }), 'Error al registrar el turno');
    const { status, cuerpo } = obtener();
    strict_1.default.equal(status, 409);
    strict_1.default.equal(cuerpo.message, turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
});
(0, node_test_1.test)('no oculta un duplicado de un índice desconocido', () => {
    node_test_1.mock.method(console, 'error', () => undefined);
    const { res, obtener } = crearRespuesta();
    (0, responderErrorTurno_1.responderErrorTurno)(res, crearDuplicado({ otraClave: 1 }), 'Error al registrar el ingreso');
    const { status, cuerpo } = obtener();
    strict_1.default.equal(status, 500);
    strict_1.default.equal(cuerpo.message, 'Error al registrar el ingreso');
});
