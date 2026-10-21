import type { Types } from 'mongoose';

// ============================================================
// ESTADOS DEL TURNO
// ============================================================

export type EstadoTurno =
    | 'pendiente'
    | 'atendido'
    | 'cancelado';

// ============================================================
// INTERFACE
// ============================================================

export interface ITurno {
    paciente: Types.ObjectId;
    especialidad: Types.ObjectId;
    fechaTurno: Date;
    estado: EstadoTurno;
    observaciones?: string;
    activo: boolean;
}