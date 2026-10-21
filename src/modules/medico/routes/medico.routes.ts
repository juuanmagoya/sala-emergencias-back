import { Router } from 'express';

import {
    getMedicos,
    createMedico,
    updateMedico,
    toggleActivoMedico,
    deleteMedicoPermanente,
} from '../controllers/medico.controller';

const router = Router();

// Obtener médicos
router.get('/', getMedicos);

// Crear médico
router.post('/', createMedico);

// Actualizar médico
router.put('/:id', updateMedico);

// Activar / desactivar médico
router.patch('/:id/toggle-estado', toggleActivoMedico);

// Eliminar permanentemente
router.delete('/:id/permanente', deleteMedicoPermanente);

export default router;