import type { ObraSocialNombre, TipoTelefono } from './paciente.types';

// ============================================
// TIPOS - Importación masiva de pacientes
// ============================================

export const CAMPOS_IMPORTACION = [
    'nombre',
    'dni',
    'telefono.codigoArea',
    'telefono.numero',
    'telefono.tipo',
    'email',
    'obraSocial.nombre',
    'obraSocial.numeroAfiliado',
    'direccion.calle',
    'direccion.numero',
    'direccion.piso',
    'direccion.departamento',
    'direccion.barrio',
] as const;

export type CampoImportacion = (typeof CAMPOS_IMPORTACION)[number];

export const ESTADOS_FILA_IMPORTACION = [
    'vacia',
    'invalida',
    'duplicada_en_archivo',
    'existente',
    'conflicto_email',
    'valida',
    'importada',
] as const;

export type EstadoFilaImportacion =
    (typeof ESTADOS_FILA_IMPORTACION)[number];

export interface MotivoImportacion {
    campo?: string;
    mensaje: string;
}

export interface DatosPacienteImportacion {
    nombre?: string;
    dni?: string;
    telefono?: {
        codigoArea?: string;
        numero?: string;
        tipo?: TipoTelefono;
    };
    email?: string;
    obraSocial?: {
        nombre?: ObraSocialNombre | string;
        numeroAfiliado?: string;
    };
    direccion?: {
        calle?: string;
        numero?: string;
        piso?: string;
        departamento?: string;
        barrio?: string;
    };
}

export interface FilaImportacion {
    numeroFila: number;
    estado: EstadoFilaImportacion;
    datos: DatosPacienteImportacion;
    motivos: MotivoImportacion[];
    advertencias: MotivoImportacion[];
}

export interface ColumnaIdentificada {
    encabezado: string;
    campo: CampoImportacion;
}

export interface ResumenPrevisualizacion {
    totalFilas: number;
    validas: number;
    invalidas: number;
    existentes: number;
    duplicadasEnArchivo: number;
    conflictosEmail: number;
    vacias: number;
    conAdvertencias: number;
}

export interface ResumenConfirmacion extends ResumenPrevisualizacion {
    candidatas: number;
    importadas: number;
    noImportadas: number;
}

export interface ResultadoPrevisualizacion {
    resumen: ResumenPrevisualizacion;
    hojaProcesada: string;
    hojasDisponibles: string[];
    columnasIdentificadas: ColumnaIdentificada[];
    columnasIgnoradas: string[];
    filas: FilaImportacion[];
}

export interface ResultadoConfirmacion {
    resumen: ResumenConfirmacion;
    hojaProcesada: string;
    hojasDisponibles: string[];
    columnasIdentificadas: ColumnaIdentificada[];
    columnasIgnoradas: string[];
    filas: FilaImportacion[];
}

export interface ArchivoExcelImportacion {
    buffer: Buffer;
    nombreOriginal: string;
    tipoMime: string;
    tamano: number;
}
