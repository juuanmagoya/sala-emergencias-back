"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.responderErrorTurno = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const turno_messages_1 = require("../constants/turno.messages");
const erroresTurno_1 = require("./erroresTurno");
// Respuesta uniforme para los endpoints que crean o consultan turnos,
// incluido el ingreso por recepción.
const responderErrorTurno = (res, error, mensajeGeneral) => {
    const errorTipado = error;
    if (errorTipado?.name === 'ValidationError') {
        const errores = Object.values(errorTipado.errors ?? {}).map((detalle) => detalle.message);
        return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
    }
    if ((0, erroresTurno_1.esErrorDuplicado)(error)) {
        if ((0, erroresTurno_1.esDuplicadoDeCampo)(error, 'dni')) {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'El DNI ya está registrado', 'Ya existe un paciente registrado con ese DNI');
        }
        if ((0, erroresTurno_1.esDuplicadoDeCampo)(error, 'email')) {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'El correo electrónico ya está registrado', 'Ya existe un paciente registrado con ese correo electrónico');
        }
        if ((0, erroresTurno_1.esDuplicadoDeTurno)(error)) {
            return (0, respuestaEstandar_1.default)(res, 409, false, turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
        }
        // Un 11000 de un índice que no conocemos no debe disfrazarse
        // de horario ocupado. Se registra y se informa un error general.
        console.error(`🔴 ${mensajeGeneral}: duplicado no reconocido`, error);
        return (0, respuestaEstandar_1.default)(res, 500, false, mensajeGeneral);
    }
    const mensaje = error instanceof Error ? error.message : '';
    const status = (0, erroresTurno_1.estadoHttpParaErrorTurno)(mensaje);
    if (status) {
        return (0, respuestaEstandar_1.default)(res, status, false, mensaje);
    }
    console.error(`🔴 ${mensajeGeneral}:`, error);
    return (0, respuestaEstandar_1.default)(res, 500, false, mensajeGeneral);
};
exports.responderErrorTurno = responderErrorTurno;
