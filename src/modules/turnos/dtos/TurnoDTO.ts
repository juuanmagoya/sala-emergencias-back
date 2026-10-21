import type { EstadoTurno } from '../interfaces/Turno.interface';

// ============================================================
// CREAR TURNO
// ============================================================

export interface CrearTurnoDTO {
    paciente: string;
    especialidad: string;
    fechaTurno: string;
    estado?: EstadoTurno;
    observaciones?: string;
}
