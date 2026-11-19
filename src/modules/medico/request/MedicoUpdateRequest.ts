import type { Request } from 'express';

export interface MedicoUpdateRequest extends Request {
    params: {
        id: string;
    };

    body: {
        nombre?: string;
        apellido?: string;
        matricula?: string;
        especialidades?: string[];
        email?: string;

        telefono?: {
            tipo?: 'CELULAR' | 'FIJO' | 'TRABAJO';
            codigoArea?: string;
            numero?: string;
        };

        consultorios?: string[];

        horariosAtencion?: {
            dia?:
                | 'LUNES'
                | 'MARTES'
                | 'MIERCOLES'
                | 'JUEVES'
                | 'VIERNES'
                | 'SABADO';

            horaInicio?: string;
            horaFin?: string;
        }[];

        duracionTurno?: number;
    };
}