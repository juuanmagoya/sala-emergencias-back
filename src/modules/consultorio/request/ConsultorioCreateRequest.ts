import type { Request } from 'express';

import type {
    AlaConsultorio,
    EquipamientoConsultorio,
} from '../interfaces/Consultorio.interface.js';

export interface ConsultorioCreateRequest extends Request {
    body: {
        nombre: string;
        numero: string;
        piso: string;
        ala?: AlaConsultorio;
        especialidades?: string[];
        equipamiento?: EquipamientoConsultorio[];
        capacidad?: number;
    };
}