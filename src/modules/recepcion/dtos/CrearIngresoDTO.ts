import type { CrearPacienteRecepcionDTO } from './CrearPacienteRecepcionDTO';

// ============================================================
// REGISTRAR INGRESO
//
// El estado inicial y la duración del turno los define el servidor.
// ============================================================

export interface CrearIngresoDTO {
    datosPaciente: CrearPacienteRecepcionDTO;
    especialidad: string;
    medico: string;
    fechaTurno: string;
    observaciones?: string;
}
