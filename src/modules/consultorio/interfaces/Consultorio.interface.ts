import type { Types } from 'mongoose';

export type AlaConsultorio =
    | 'NORTE'
    | 'SUR'
    | 'ESTE'
    | 'OESTE'
    | 'CENTRAL';

export type EquipamientoConsultorio =
    | 'CAMILLA'
    | 'ELECTROCARDIOGRAFO'
    | 'NEBULIZADOR'
    | 'ECOGRAFO'
    | 'OTOSCOPIO'
    | 'OPHTALMOSCOPIO'
    | 'TENSIOMETRO'
    | 'BALANZA'
    | 'ESTETOSCOPIO';

export interface IConsultorio {
    nombre: string;
    numero: string;
    piso: string;
    ala: AlaConsultorio;
    especialidades: Types.ObjectId[];
    equipamiento: EquipamientoConsultorio[];
    capacidad: number;
    activo: boolean;
}