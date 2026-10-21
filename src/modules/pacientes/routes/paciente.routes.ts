import { Router } from 'express';

import {
    getPacientes,
    createPaciente,
    updatePaciente,
    deletePaciente,
} from '../controllers/paciente.controller';

const router = Router();

// Obtener todos los pacientes (con filtros opcionales)
router.get('/', getPacientes);

// Crear nuevo paciente
router.post('/', createPaciente);

// Actualizar paciente
router.put('/:id', updatePaciente);

// Eliminar paciente
router.delete('/:id', deletePaciente);

export default router;