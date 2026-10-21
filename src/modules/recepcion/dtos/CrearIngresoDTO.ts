import type { EstadoTurno } from '../../turnos/interfaces/Turno.interface';
import type { CreatePacienteDTO } from '../../pacientes/dtos/CreatePacienteDTO';

// ============================================================
// REGISTRAR INGRESO
// ============================================================

export interface CrearIngresoDTO {
    datosPaciente: CreatePacienteDTO;
    especialidad: string;
    fechaTurno: string;
    estado?: EstadoTurno;
    observaciones?: string;
}
