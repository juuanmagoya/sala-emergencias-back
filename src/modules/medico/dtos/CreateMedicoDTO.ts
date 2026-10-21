import type { IHorarioAtencion } from '../interfaces/Medico.interface';

export interface CreateMedicoDTO {
    nombre: string;
    apellido: string;
    matricula: string;
    especialidad: string;
    email: string;

    telefono: {
        tipo?: 'CELULAR' | 'FIJO' | 'TRABAJO';
        codigoArea: string;
        numero: string;
    };

    consultorios?: string[];

    horariosAtencion?: IHorarioAtencion[];

    duracionTurno: number;
}