
import { Schema, model, Model, Document, Types } from 'mongoose';

// ============================================
// INTERFAZ
// ============================================

export interface IConsumoChatbot {
  paciente: Types.ObjectId;
  fecha: string;
  consultas: number;
}

export interface IConsumoChatbotDocument
  extends IConsumoChatbot,
    Document {}

// ============================================
// ESQUEMA PRINCIPAL
// ============================================

const consumoChatbotSchema = new Schema<IConsumoChatbotDocument>(
  {
    paciente: {
      type: Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true,
    },
    fecha: {
      type: String,
      required: true,
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        'La fecha debe tener formato YYYY-MM-DD',
      ],
    },
    consultas: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 3,
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad de consultas debe ser un número entero',
      },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// ÍNDICES
// ============================================

consumoChatbotSchema.index(
  { paciente: 1, fecha: 1 },
  {
    unique: true,
    name: 'consumo_chatbot_paciente_fecha',
  }
);

// ============================================
// TRANSFORMACIÓN toJSON
// ============================================

consumoChatbotSchema.set('toJSON', {
  transform: (
    _documento: Document,
    consumoRetorno: Record<string, any>
  ) => {
    consumoRetorno.id = consumoRetorno._id;

    delete consumoRetorno._id;
    delete consumoRetorno.__v;
  },
});

// ============================================
// MODELO
// ============================================

const ConsumoChatbot: Model<IConsumoChatbotDocument> =
  model<IConsumoChatbotDocument>(
    'ConsumoChatbot',
    consumoChatbotSchema
  );

export default ConsumoChatbot;
