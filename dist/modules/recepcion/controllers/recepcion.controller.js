"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrarIngreso = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const recepcion_service_1 = __importDefault(require("../services/recepcion.service"));
const responderErrorTurno_1 = require("../../turnos/utils/responderErrorTurno");
// ============================================================
// REGISTRAR INGRESO
// ============================================================
const registrarIngreso = async (req, res) => {
    try {
        const turnoCompleto = await recepcion_service_1.default.registrarIngreso(req.body);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Ingreso registrado exitosamente', turnoCompleto);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al registrar el ingreso');
    }
};
exports.registrarIngreso = registrarIngreso;
