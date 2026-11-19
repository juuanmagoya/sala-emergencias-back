import { MENSAJES_TURNO } from '../constants/turno.messages';

// ============================================================
// TRADUCCIÓN DE ERRORES DE NEGOCIO A CÓDIGOS HTTP
// ============================================================

const MENSAJES_400 = new Set<string>([
    MENSAJES_TURNO.TURNO_ID_INVALIDO,
    MENSAJES_TURNO.PACIENTE_ID_INVALIDO,
    MENSAJES_TURNO.ESPECIALIDAD_ID_INVALIDO,
    MENSAJES_TURNO.MEDICO_ID_INVALIDO,
    MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE,
    MENSAJES_TURNO.FECHA_INVALIDA,
    MENSAJES_TURNO.FECHA_CONSULTA_INVALIDA,
    MENSAJES_TURNO.FECHA_PASADA,
    MENSAJES_TURNO.OBSERVACIONES_DEMASIADO_LARGAS,
    MENSAJES_TURNO.ESTADO_REQUERIDO,
    MENSAJES_TURNO.ESTADO_INVALIDO,
    MENSAJES_TURNO.SOLO_ESTADO_MODIFICABLE,
    MENSAJES_TURNO.DATOS_INVALIDOS,
]);

const MENSAJES_403 = new Set<string>([
    MENSAJES_TURNO.SIN_PERFIL_MEDICO,
]);

const MENSAJES_404 = new Set<string>([
    MENSAJES_TURNO.PACIENTE_NO_EXISTE,
    MENSAJES_TURNO.ESPECIALIDAD_NO_EXISTE,
    MENSAJES_TURNO.MEDICO_NO_EXISTE,
    MENSAJES_TURNO.TURNO_NO_ENCONTRADO,
]);

const MENSAJES_409 = new Set<string>([
    MENSAJES_TURNO.MEDICO_INACTIVO,
    MENSAJES_TURNO.ESPECIALIDAD_INACTIVA,
    MENSAJES_TURNO.NO_ATIENDE_ESE_DIA,
    MENSAJES_TURNO.FUERA_DE_HORARIO,
    MENSAJES_TURNO.HORARIO_OCUPADO,
    MENSAJES_TURNO.HORARIO_NO_DISPONIBLE,
]);

export const estadoHttpParaErrorTurno = (
    mensaje: string
): number | null => {
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

export interface ErrorDuplicadoMongo {
    code: number;
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
}

export const esErrorDuplicado = (
    error: unknown
): error is ErrorDuplicadoMongo =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000;

// Obtiene los campos que MongoDB informó como duplicados. Se consultan
// tanto `keyPattern` como `keyValue` para no depender de que el driver
// incluya siempre ambas propiedades.
export const obtenerCamposDuplicados = (
    error: unknown
): string[] => {
    if (!esErrorDuplicado(error)) {
        return [];
    }

    const campos = new Set<string>();

    for (const fuente of [error.keyPattern, error.keyValue]) {
        if (
            typeof fuente === 'object' &&
            fuente !== null &&
            !Array.isArray(fuente)
        ) {
            Object.keys(fuente).forEach((campo) => {
                campos.add(campo);
            });
        }
    }

    return [...campos];
};

export const esDuplicadoDeCampo = (
    error: unknown,
    campo: string
): boolean => obtenerCamposDuplicados(error).includes(campo);

export const esDuplicadoDeTurno = (error: unknown): boolean => {
    const campos = obtenerCamposDuplicados(error);

    return (
        campos.includes('medico') &&
        campos.includes('fechaTurno')
    );
};
