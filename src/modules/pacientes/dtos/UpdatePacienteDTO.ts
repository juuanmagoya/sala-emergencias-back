import {
    IDireccion,
    ITelefono,
    IObraSocial,
} from '../interfaces/paciente.interfaces';

export interface UpdatePacienteDTO {
    nombre?: string;
    dni?: string;
    direccion?: IDireccion;
    email?: string;
    telefono?: ITelefono;
    obraSocial?: IObraSocial;
}