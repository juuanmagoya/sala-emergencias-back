
import { Document } from 'mongoose';

export type CategoriaConocimiento =
  | 'sintomas_frecuentes'
  | 'enfermedades_frecuentes'
  | 'cuidados_generales'
  | 'primeros_auxilios'
  | 'medicamentos'
  | 'prevencion'
  | 'signos_alarma'
  | 'atencion_medica';

export type EstadoValidacionMedica =
  | 'pendiente_revision_medica'
  | 'aprobado'
  | 'rechazado';

export type TipoTareaEmbedding =
  | 'RETRIEVAL_DOCUMENT'
  | 'RETRIEVAL_QUERY';

export interface IEmbeddingMetadata {
  modelo: string;
  dimensiones: number;
  hashContenido: string;
  fechaIndexacion: Date;
}

export interface IDocumentoConocimiento {
  articuloId: string;
  chunkId: string;
  categoria: CategoriaConocimiento;
  titulo: string;
  resumen: string;
  contenido: string;
  palabrasClave: string[];
  embedding: number[];
  metadata: IEmbeddingMetadata;
  estadoValidacion: EstadoValidacionMedica;
  habilitadoConsultaClinica: boolean;
}

export interface IDocumentoConocimientoDocument
  extends IDocumentoConocimiento,
    Document {}
