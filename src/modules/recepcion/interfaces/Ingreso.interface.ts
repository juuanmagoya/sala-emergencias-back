import type { Types } from 'mongoose';

import type { EstadoTurno } from '../../turnos/interfaces/Turno.interface';

// ============================================================
// INGRESO POR RECEPCIÓN (turno resultante del ingreso)
// ============================================================

export interface IIngreso {
    paciente: Types.ObjectId;
    especialidad: Types.ObjectId;
    fechaTurno: Date;
    estado?: EstadoTurno;
    observaciones?: string;
}
