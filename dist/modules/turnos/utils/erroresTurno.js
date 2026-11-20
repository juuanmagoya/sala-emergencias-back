"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.esDuplicadoDeTurno = exports.esDuplicadoDeCampo = exports.obtenerCamposDuplicados = exports.esErrorDuplicado = exports.estadoHttpParaErrorTurno = void 0;
const turno_messages_1 = require("../constants/turno.messages");
// ============================================================
// TRADUCCIÓN DE ERRORES DE NEGOCIO A CÓDIGOS HTTP
// ============================================================
const MENSAJES_400 = new Set([
    turno_messages_1.MENSAJES_TURNO.TURNO_ID_INVALIDO,
    turno_messages_1.MENSAJES_TURNO.PACIENTE_ID_INVALIDO,
    turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_ID_INVALIDO,
    turno_messages_1.MENSAJES_TURNO.MEDICO_ID_INVALIDO,
    turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE,
    turno_messages_1.MENSAJES_TURNO.FECHA_INVALIDA,
    turno_messages_1.MENSAJES_TURNO.FECHA_CONSULTA_INVALIDA,
    turno_messages_1.MENSAJES_TURNO.FECHA_PASADA,
    turno_messages_1.MENSAJES_TURNO.OBSERVACIONES_DEMASIADO_LARGAS,
    turno_messages_1.MENSAJES_TURNO.ESTADO_REQUERIDO,
    turno_messages_1.MENSAJES_TURNO.ESTADO_INVALIDO,
    turno_messages_1.MENSAJES_TURNO.SOLO_ESTADO_MODIFICABLE,
    turno_messages_1.MENSAJES_TURNO.DATOS_INVALIDOS,
]);
const MENSAJES_403 = new Set([
    turno_messages_1.MENSAJES_TURNO.SIN_PERFIL_MEDICO,
]);
const MENSAJES_404 = new Set([
    turno_messages_1.MENSAJES_TURNO.PACIENTE_NO_EXISTE,
    turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_EXISTE,
    turno_messages_1.MENSAJES_TURNO.MEDICO_NO_EXISTE,
    turno_messages_1.MENSAJES_TURNO.TURNO_NO_ENCONTRADO,
]);
const MENSAJES_409 = new Set([
    turno_messages_1.MENSAJES_TURNO.MEDICO_INACTIVO,
    turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_INACTIVA,
    turno_messages_1.MENSAJES_TURNO.NO_ATIENDE_ESE_DIA,
    turno_messages_1.MENSAJES_TURNO.FUERA_DE_HORARIO,
    turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO,
    turno_messages_1.MENSAJES_TURNO.HORARIO_NO_DISPONIBLE,
]);
const estadoHttpParaErrorTurno = (mensaje) => {
    if (MENSAJES_400.has(mensaje)) {
        return 400;
    }
    if (MENSAJES_403.has(mensaje)) {
        return 403;
    }
    if (MENSAJES_404.has(mensaje)) {
        return 404;
    }
    if (MENSAJES_409.has(mensaje)) {
        return 409;
    }
    return null;
};
exports.estadoHttpParaErrorTurno = estadoHttpParaErrorTurno;
const esErrorDuplicado = (error) => typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000;
exports.esErrorDuplicado = esErrorDuplicado;
// Obtiene los campos que MongoDB informó como duplicados. Se consultan
// tanto `keyPattern` como `keyValue` para no depender de que el driver
// incluya siempre ambas propiedades.
const obtenerCamposDuplicados = (error) => {
    if (!(0, exports.esErrorDuplicado)(error)) {
        return [];
    }
    const campos = new Set();
    for (const fuente of [error.keyPattern, error.keyValue]) {
        if (typeof fuente === 'object' &&
            fuente !== null &&
            !Array.isArray(fuente)) {
            Object.keys(fuente).forEach((campo) => {
                campos.add(campo);
            });
        }
    }
    return [...campos];
};
exports.obtenerCamposDuplicados = obtenerCamposDuplicados;
const esDuplicadoDeCampo = (error, campo) => (0, exports.obtenerCamposDuplicados)(error).includes(campo);
exports.esDuplicadoDeCampo = esDuplicadoDeCampo;
const esDuplicadoDeTurno = (error) => {
    const campos = (0, exports.obtenerCamposDuplicados)(error);
    return (campos.includes('medico') &&
        campos.includes('fechaTurno'));
};
exports.esDuplicadoDeTurno = esDuplicadoDeTurno;
