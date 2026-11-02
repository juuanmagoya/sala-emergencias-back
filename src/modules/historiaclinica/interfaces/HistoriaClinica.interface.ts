import type { Types } from 'mongoose';

// ============================================================
// SUBDOCUMENTOS
// ============================================================

export interface IMedicamentoRecetado {
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion?: string;
    indicaciones?: string;
}

// ============================================================
// INTERFACE PRINCIPAL
// ============================================================

export interface IHistoriaClinica {
    paciente: Types.ObjectId;
    medico: Types.ObjectId;
    fechaAtencion: Date;
    observaciones: string;
    recetario: IMedicamentoRecetado[];
}
