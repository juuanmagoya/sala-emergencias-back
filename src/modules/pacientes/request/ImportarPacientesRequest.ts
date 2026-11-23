import type { Request } from 'express';

export interface ImportarPacientesRequest extends Request {
    body: {
        hoja?: string;
    };
}
