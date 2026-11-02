import type { Request } from 'express';

// ============================================================
// HISTORIAL CLÍNICO DE UN PACIENTE
// ============================================================

export interface HistoriaClinicaPacienteRequest extends Request {
    params: {
        pacienteId: string;
    };
}
