import { Request } from 'express';
import { CreatePacienteDTO } from '../dtos/CreatePacienteDTO';

export interface PacienteCreateRequest extends Request {
    body: CreatePacienteDTO;
}