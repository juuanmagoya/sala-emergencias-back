import type { CreatePacienteDTO } from '../../pacientes/dtos/CreatePacienteDTO';

// ============================================================
// REGISTRAR INGRESO
//
// El estado inicial y la duración del turno los define el servidor.
// ============================================================

export interface CrearIngresoDTO {
    datosPaciente: CreatePacienteDTO;
    especialidad: string;
    medico: string;
    fechaTurno: string;
    observaciones?: string;
}
