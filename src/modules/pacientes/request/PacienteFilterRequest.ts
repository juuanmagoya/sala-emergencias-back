import { Request } from 'express';

export interface PacienteFilterRequest extends Request {
    query: {
        obraSocial?: string;
        dni?: string;
    };
}