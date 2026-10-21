import { Request } from 'express';

export interface EspecialidadFilterRequest extends Request {
    query: {
        nombre?: string;
        codigo?: string;
        id?: string;
        activo?: string;
    };
}