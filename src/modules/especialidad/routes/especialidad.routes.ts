import { Router } from 'express';

import {
    getEspecialidades,
    createEspecialidad,
    updateEspecialidad,
    toggleActivoEspecialidad,
    deleteEspecialidadPermanente,
} from '../controllers/especialidad.controller';

const router = Router();

// Obtener todas las especialidades
router.get('/', getEspecialidades);

// Crear nueva especialidad
router.post('/', createEspecialidad);

// Actualizar especialidad
router.put('/:id', updateEspecialidad);

// Cambiar estado de especialidad
router.patch('/:id/toggle-estado', toggleActivoEspecialidad);

// Eliminar especialidad permanentemente
router.delete('/:id/permanente', deleteEspecialidadPermanente);

export default router;