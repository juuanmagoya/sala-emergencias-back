import { Request } from 'express';
import { UpdatePacienteDTO } from '../dtos/UpdatePacienteDTO';

export interface PacienteUpdateRequest extends Request {
    params: {
        id: string;
    };
    body: UpdatePacienteDTO;
}