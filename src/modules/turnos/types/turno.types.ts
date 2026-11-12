/**
 * Estados posibles de un turno.
 */
export type EstadoTurno =
    | 'pendiente'
    | 'atendido'
    | 'cancelado';

export const ESTADOS_TURNO = [
    'pendiente',
    'atendido',
    'cancelado',
] as const satisfies readonly EstadoTurno[];

export const esEstadoTurno = (
    valor: unknown
): valor is EstadoTurno =>
    typeof valor === 'string' &&
    (ESTADOS_TURNO as readonly string[]).includes(valor);