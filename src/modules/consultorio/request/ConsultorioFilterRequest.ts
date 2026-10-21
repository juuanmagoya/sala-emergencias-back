import type { Request } from 'express';

export interface ConsultorioFilterRequest extends Request {
    query: {
        id?: string;
        numero?: string;
        nombre?: string;
        especialidad?: string;
    };
}