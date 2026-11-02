import type { IMedicamentoRecetado } from '../interfaces/HistoriaClinica.interface';

// ============================================================
// CREAR HISTORIA CLÍNICA
// ============================================================

export interface CrearHistoriaClinicaDTO {
    paciente: string;
    medico: string;
    fechaAtencion?: string;
    observaciones: string;
    recetario?: IMedicamentoRecetado[];
}
