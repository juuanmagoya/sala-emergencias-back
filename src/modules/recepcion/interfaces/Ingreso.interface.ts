import type { Types } from 'mongoose';

import type { EstadoTurno } from '../../turnos/types/turno.types';

// ============================================================
// INGRESO POR RECEPCIÓN (turno resultante del ingreso)
// ============================================================

export interface IIngreso {
    paciente: Types.ObjectId;
    especialidad: Types.ObjectId;
    medico: Types.ObjectId;
    fechaTurno: Date;
    fechaFin: Date;
    estado: EstadoTurno;
    observaciones?: string;
}
