import type { Types } from 'mongoose';

// ============================================================
// CATÁLOGOS (enums del dominio)
// ============================================================

export type TipoAtencion =
    | 'URGENCIA'
    | 'CONSULTA_GENERAL'
    | 'CONTROL'
    | 'EMERGENCIA';

export type EstadoHistoriaClinica =
    | 'EN_ATENCION'
    | 'FINALIZADA'
    | 'OBSERVACION';

export type Sintoma =
    | 'FIEBRE'
    | 'DOLOR_CABEZA'
    | 'DOLOR_ABDOMINAL'
    | 'DOLOR_PECHO'
    | 'NAUSEAS'
    | 'VOMITOS'
    | 'DIARREA'
    | 'FATIGA'
    | 'MAREO'
    | 'DESMAYO'
    | 'TRAUMA'
    | 'DIFICULTAD_RESPIRATORIA'
    | 'TOS'
    | 'CONGESTION_NASAL'
    | 'DOLOR_GARGANTA'
    | 'ERUPCION_CUTANEA'
    | 'OTRO';

export type TipoExamen =
    | 'LABORATORIO'
    | 'RADIOGRAFIA'
    | 'ECOGRAFIA'
    | 'ELECTROCARDIOGRAMA'
    | 'TOMOGRAFIA'
    | 'RESONANCIA'
    | 'OTRO';

export type ViaMedicamento =
    | 'ORAL'
    | 'INTRAVENOSA'
    | 'INTRAMUSCULAR'
    | 'SUBCUTANEA'
    | 'TOPICA'
    | 'INHALATORIA';

export type Procedimiento =
    | 'SUTURA'
    | 'INMOVILIZACION'
    | 'VENOPUNCION'
    | 'COLOCACION_SONDA'
    | 'DRENAJE'
    | 'LIMPIEZA_HERIDA'
    | 'CURACION'
    | 'OTRO';

// ============================================================
// SUBDOCUMENTOS
// ============================================================

export interface IPresionArterial {
    sistolica?: number;
    diastolica?: number;
}

export interface ISignosVitales {
    presionArterial?: IPresionArterial;
    frecuenciaCardiaca?: number;
    frecuenciaRespiratoria?: number;
    temperatura?: number;
    saturacionOxigeno?: number;
    glucemia?: number;
}

export interface IExamenFisico {
    hallazgos?: string;
    examenesSolicitados?: TipoExamen[];
    resultadosExamenes?: string;
}

export interface IMedicamento {
    nombre: string;
    dosis: string;
    via: ViaMedicamento;
    frecuencia?: string;
}

export interface ITratamiento {
    indicaciones?: string;
    medicamentos?: IMedicamento[];
    procedimientos?: Procedimiento[];
}

export interface IDiagnostico {
    impresionDiagnostica?: string;
    diagnosticoDefinitivo?: string;
    codigoCIE10?: string;
}

// ============================================================
// INTERFACE PRINCIPAL
// ============================================================

export interface IHistoriaClinica {
    paciente: Types.ObjectId;
    tipoAtencion: TipoAtencion;
    fechaAtencion: Date;
    motivoConsulta: string;
    sintomas?: Sintoma[];
    signosVitales?: ISignosVitales;
    examenFisico?: IExamenFisico;
    diagnostico?: IDiagnostico;
    tratamiento?: ITratamiento;
    medico: Types.ObjectId;
    enfermero?: Types.ObjectId;
    estado?: EstadoHistoriaClinica;
    fechaAlta?: Date;
    recomendaciones?: string;
    version?: number;
    activo?: boolean;
}
