import { Schema, model, Model, Document } from 'mongoose';
import { TipoTelefono, ObraSocialNombre } from '../types/paciente.types';
import {
  IPacienteDocument,
  IDireccion,
  ITelefono,
  IObraSocial,
} from '../interfaces/paciente.interfaces';

// ============================================
// SUBESQUEMAS
// ============================================

const direccionSchema = new Schema<IDireccion>(
  {
    calle: {
      type: String,
      required: [true, 'La calle es obligatoria'],
    },
    numero: {
      type: String,
      required: [true, 'El número es obligatorio'],
    },
    piso: { type: String },
    departamento: { type: String },
    barrio: { type: String },
  },
  { _id: false }
);

const telefonoSchema = new Schema<ITelefono>(
  {
    tipo: {
      type: String,
      enum: ['CELULAR', 'FIJO', 'TRABAJO'] satisfies TipoTelefono[],
      default: 'CELULAR',
    },
    codigoArea: {
      type: String,
      required: true,
      match: [/^[0-9]{2,5}$/, 'El código de área no es válido'],
    },
    numero: {
      type: String,
      required: true,
      match: [/^[0-9]{7,10}$/, 'El número de teléfono no es válido'],
    },
  },
  { _id: false }
);

const obraSocialSchema = new Schema<IObraSocial>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la obra social es obligatorio'],
      enum: {
        values: [
          'PAMI',
          'OSPEL',
          'OSDE',
          'SANCOR',
          'OSECAC',
          'SWISS MEDICAL',
          'GALENO',
          'MEDICUS',
          'OMINT',
          'FEMEBA',
          'OTRAS',
          'NINGUNA',
        ] satisfies ObraSocialNombre[],
        message:
          '{VALUE} no es una obra social válida. Debe ser una de las siguientes: PAMI, OSPEL, OSDE, SANCOR, OSECAC, SWISS MEDICAL, GALENO, MEDICUS, OMINT, FEMEBA, OTRAS, NINGUNA',
      },
    },
    numeroAfiliado: { type: String },
  },
  { _id: false }
);

// ============================================
// ESQUEMA PRINCIPAL
// ============================================

const pacienteSchema = new Schema<IPacienteDocument>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del paciente es obligatorio'],
      uppercase: true,
    },
    dni: {
      type: String,
      required: [true, 'El DNI del paciente es obligatorio'],
      unique: true,
      match: [/^[0-9]{7,8}$/, 'El DNI debe tener 8 dígitos'],
    },
    direccion: {
      type: direccionSchema,
      required: true,
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico del paciente es obligatorio'],
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'El correo electrónico no es válido',
      ],
    },
    telefono: {
      type: telefonoSchema,
      required: true,
    },
    obraSocial: {
      type: obraSocialSchema,
      required: true,
    },
  },
  { timestamps: true }
);

// ============================================
// TRANSFORMACIÓN toJSON
// ============================================

pacienteSchema.set('toJSON', {
    transform: (
        _documento: Document,
        pacienteRetorno: Record<string, any>
    ) => {
        pacienteRetorno.id = pacienteRetorno._id;

        delete pacienteRetorno._id;
        delete pacienteRetorno.__v;
    },
});
// ============================================
// MODELO
// ============================================

const Paciente: Model<IPacienteDocument> = model<IPacienteDocument>(
  'Paciente',
  pacienteSchema
);

export default Paciente;