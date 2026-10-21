import type { IEspecialidad } from '../interfaces/Especialidad.interface';

export type UpdateEspecialidadDTO = Partial<
    Pick<IEspecialidad, 'nombre' | 'descripcion' | 'codigo'>
>;
