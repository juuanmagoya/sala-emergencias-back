import { Document, Types } from 'mongoose';
import { TipoTelefono, ObraSocialNombre } from '../types/paciente.types';

// ============================================
// INTERFACES - Subdocumentos
// ============================================

export interface IDireccion {
  calle: string;
  numero: string;
  piso?: string;
  departamento?: string;
  barrio?: string;
}

export interface ITelefono {
  tipo: TipoTelefono;
  codigoArea: string;
  numero: string;
}

export interface IObraSocial {
  nombre: ObraSocialNombre;
  numeroAfiliado?: string;
}

// ============================================
// INTERFACES - Documento principal
// ============================================

/**
 * Datos "puros" del paciente (sin metadatos de Mongoose).
 */
export interface IPaciente {
  nombre: string;
  dni: string;
  // Opcionales para el alta mínima desde Recepción. Los pacientes
  // históricos conservan sus datos sin migraciones masivas.
  direccion?: IDireccion;
  email?: string;
  telefono: ITelefono;
  obraSocial: IObraSocial;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Documento de Mongoose: IPaciente + métodos de Document + _id tipado.
 */
export interface IPacienteDocument extends IPaciente, Document<Types.ObjectId> {
  _id: Types.ObjectId;
}

/**
 * Representación JSON del paciente (resultado de toJSON()).
 */
export interface IPacienteJSON extends Omit<IPacienteDocument, '_id' | '__v'> {
  id: string;
}