import type { Types } from 'mongoose';
import type { EstadoTurno } from '../types/turno.types';

// ============================================================
// INTERFACE
// ============================================================

export interface ITurno {
    paciente: Types.ObjectId;
    especialidad: Types.ObjectId;
    // Referencia obligatoria para los turnos nuevos. Los documentos
    // históricos pueden no tenerla; se conservan sin asignación automática.
    medico: Types.ObjectId;
    fechaTurno: Date;
    // Fin del turno calculado con la duración del médico al reservar.
    // Se guarda para que la ocupación no cambie si luego se modifica
    // `Medico.duracionTurno`.
    fechaFin: Date;
    estado: EstadoTurno;
    observaciones?: string;
    activo: boolean;
}