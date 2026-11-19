import type { Types } from 'mongoose';

export interface ITelefonoMedico {
    tipo: 'CELULAR' | 'FIJO' | 'TRABAJO';
    codigoArea: string;
    numero: string;
}

export interface IHorarioAtencion {
    dia:
        | 'LUNES'
        | 'MARTES'
        | 'MIERCOLES'
        | 'JUEVES'
        | 'VIERNES'
        | 'SABADO';

    horaInicio: string;
    horaFin: string;
}

export interface IMedico {
    nombre: string;
    apellido: string;
    matricula: string;

    // Única fuente de verdad de la relación con Especialidad.
    especialidades: Types.ObjectId[];

    email: string;
    telefono: ITelefonoMedico;
    consultorios: Types.ObjectId[];
    horariosAtencion: IHorarioAtencion[];
    duracionTurno: number;
    activo: boolean;
}
