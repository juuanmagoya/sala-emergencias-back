import { Router } from 'express';

import {
    getTurnos,
    createTurno,
    deleteTurno,
} from '../controllers/turno.controller';

const router = Router();

// Obtener todos los turnos activos
router.get('/', getTurnos);

// Crear nuevo turno (admite query param ?urgencia=true)
router.post('/', createTurno);

// Eliminar turno (borrado lógico)
router.delete('/:id', deleteTurno);

export default router;
