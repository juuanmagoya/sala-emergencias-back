import { IEspecialidad } from '../interfaces/Especialidad.interface';

export type CreateEspecialidadDTO = Pick<
    IEspecialidad,
    'nombre' | 'descripcion' | 'codigo'
>;