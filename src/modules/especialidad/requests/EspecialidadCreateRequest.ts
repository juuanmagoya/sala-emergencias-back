import { Request } from 'express';

export interface EspecialidadCreateRequest extends Request {
    body: {
        nombre: string;
        descripcion?: string;
        codigo?: string;
    };
}