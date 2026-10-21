import type { Request } from 'express';

import type {
    AlaConsultorio,
    EquipamientoConsultorio,
} from '../interfaces/Consultorio.interface.js';

export interface ConsultorioUpdateRequest extends Request {
    params: {
        id: string;
    };

    body: {
        nombre?: string;
        numero?: string;
        piso?: string;
        ala?: AlaConsultorio;
        especialidades?: string[];
        equipamiento?: EquipamientoConsultorio[];
        capacidad?: number;
    };
}