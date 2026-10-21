import type { Request } from 'express';

export interface MedicoFilterRequest extends Request {
    query: {
        nombre?: string;
        apellido?: string;
        matricula?: string;
        especialidad?: string;
        email?: string;
        activo?: string;
    };
}