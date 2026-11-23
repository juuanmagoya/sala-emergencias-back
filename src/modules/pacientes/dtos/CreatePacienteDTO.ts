import {
    IDireccion,
    ITelefono,
    IObraSocial,
} from '../interfaces/paciente.interfaces';

export interface CreatePacienteDTO {
    nombre: string;
    dni: string;
    direccion: IDireccion;
    email: string;
    telefono?: ITelefono;
    obraSocial?: IObraSocial;
}