"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esEstadoTurno = exports.ESTADOS_TURNO = void 0;
exports.ESTADOS_TURNO = [
    'pendiente',
    'atendido',
    'cancelado',
];
const esEstadoTurno = (valor) => typeof valor === 'string' &&
    exports.ESTADOS_TURNO.includes(valor);
exports.esEstadoTurno = esEstadoTurno;
