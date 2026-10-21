import { Router } from 'express';

import {
    getConsultorios,
    createConsultorio,
    updateConsultorio,
    deleteConsultorio,
} from '../controllers/consultorio.controller.js';

const router = Router();

// Obtener todos los consultorios
// Filtros: ?numero=101&piso=1&id=...
router.get('/', getConsultorios);

// Crear nuevo consultorio
router.post('/', createConsultorio);

// Actualizar consultorio
router.put('/:id', updateConsultorio);

// Eliminar consultorio (borrado lógico)
router.delete('/:id', deleteConsultorio);

export default router;