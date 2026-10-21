import { Request } from 'express';

export interface EspecialidadUpdateRequest extends Request {
    params: {
        id: string;
    };

    body: {
        nombre?: string;
        descripcion?: string;
        codigo?: string;
    };
}