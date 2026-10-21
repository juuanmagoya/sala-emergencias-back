import type {
    EstadoHistoriaClinica,
    IDiagnostico,
    IExamenFisico,
    ITratamiento,
    ISignosVitales,
    Procedimiento,
    Sintoma,
    TipoAtencion,
    TipoExamen,
    ViaMedicamento,
} from '../interfaces/HistoriaClinica.interface';

// ============================================================
// CREAR HISTORIA CLÍNICA
// ============================================================

export interface CrearHistoriaClinicaDTO {
    paciente: string;
    tipoAtencion?: TipoAtencion;
    fechaAtencion?: string;
    motivoConsulta: string;
    sintomas?: Sintoma[];
    signosVitales?: ISignosVitales;
    examenFisico?: IExamenFisico;
    diagnostico?: IDiagnostico;
    tratamiento?: ITratamiento;
    medico: string;
    enfermero?: string;
    estado?: EstadoHistoriaClinica;
    fechaAlta?: string;
    recomendaciones?: string;
}
