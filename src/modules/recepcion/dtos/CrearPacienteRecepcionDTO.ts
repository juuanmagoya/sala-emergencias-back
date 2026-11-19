import type {
    ITelefono,
    IPaciente,
} from '../../pacientes/interfaces/paciente.interfaces';

// ============================================================
// PACIENTE NUEVO DESDE RECEPCIÓN
//
// Alta mínima: solo los datos que recepción puede solicitar.
// El resto de los campos opcionales del modelo no se aceptan desde
// este endpoint, y el servidor aplica los defaults que correspondan.
// ============================================================

export type TelefonoRecepcionDTO = Omit<ITelefono, 'tipo'> & {
    tipo?: ITelefono['tipo'];
};

export interface CrearPacienteRecepcionDTO
    extends Pick<IPaciente, 'nombre' | 'dni'> {
    telefono: TelefonoRecepcionDTO;
}
