
import { Schema, model, Model, Document } from 'mongoose';

import{
    IDocumentoConocimientoDocument
} from '../types/chatbot.types';

// ============================================
// ESQUEMA PRINCIPAL
// ============================================

const documentoConocimientoSchema =
  new Schema<IDocumentoConocimientoDocument>(
    {
      articuloId: {
        type: String,
        required: true,
        trim: true,
      },
      chunkId: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },
      categoria: {
        type: String,
        required: true,
        enum: [
          'sintomas_frecuentes',
          'enfermedades_frecuentes',
          'cuidados_generales',
          'primeros_auxilios',
          'medicamentos',
          'prevencion',
          'signos_alarma',
          'atencion_medica',
        ],
      },
      titulo: {
        type: String,
        required: true,
        trim: true,
      },
      resumen: {
        type: String,
        required: true,
        trim: true,
      },
      contenido: {
        type: String,
        required: true,
      },
      palabrasClave: {
        type: [String],
        default: [],
      },
      embedding: {
        type: [Number],
        required: true,
        select: false,
      },
      metadata: {
        modelo: {
          type: String,
          required: true,
        },
        dimensiones: {
          type: Number,
          required: true,
        },
        hashContenido: {
          type: String,
          required: true,
        },
        fechaIndexacion: {
          type: Date,
          required: true,
        },
      },
      estadoValidacion: {
        type: String,
        enum: [
          'pendiente_revision_medica',
          'aprobado',
          'rechazado',
        ],
        default: 'pendiente_revision_medica',
        required: true,
      },
      habilitadoConsultaClinica: {
        type: Boolean,
        default: false,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

// ============================================
// ÍNDICES
// ============================================

documentoConocimientoSchema.index(
  { articuloId: 1 },
  { name: 'documentos_articulo' }
);

documentoConocimientoSchema.index(
  { categoria: 1 },
  { name: 'documentos_categoria' }
);

documentoConocimientoSchema.index(
  { estadoValidacion: 1, habilitadoConsultaClinica: 1 },
  { name: 'documentos_estado_clinico' }
);

// ============================================
// VALIDACIONES
// ============================================

documentoConocimientoSchema.pre('validate', function () {
  if (
    this.embedding &&
    this.metadata?.dimensiones !== this.embedding.length
  ) {
    this.invalidate(
      'metadata.dimensiones',
      'La dimensión declarada no coincide con el embedding'
    );
  }
});

// ============================================
// TRANSFORMACIÓN toJSON
// ============================================

documentoConocimientoSchema.set('toJSON', {
  transform: (
    _documento: Document,
    documentoRetorno: Record<string, any>
  ) => {
    documentoRetorno.id = documentoRetorno._id;

    delete documentoRetorno._id;
    delete documentoRetorno.__v;
    delete documentoRetorno.embedding;
  },
});

// ============================================
// MODELO
// ============================================

const DocumentoConocimiento: Model<IDocumentoConocimientoDocument> =
  model<IDocumentoConocimientoDocument>(
    'DocumentoConocimiento',
    documentoConocimientoSchema
  );

export default DocumentoConocimiento;
