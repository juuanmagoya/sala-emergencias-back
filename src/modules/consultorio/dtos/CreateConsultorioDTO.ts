import type {
    AlaConsultorio,
    EquipamientoConsultorio,
} from '../interfaces/Consultorio.interface.js';

export interface CreateConsultorioDTO {
    nombre: string;
    numero: string;
    piso: string;
    ala?: AlaConsultorio;
    especialidades?: string[];
    equipamiento?: EquipamientoConsultorio[];
    capacidad?: number;
}