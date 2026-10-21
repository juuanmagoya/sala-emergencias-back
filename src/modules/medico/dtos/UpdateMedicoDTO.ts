export interface UpdateMedicoDTO {
    nombre?: string;
    apellido?: string;
    matricula?: string;
    especialidad?: string;
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
}
