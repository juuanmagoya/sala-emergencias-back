import { Router } from 'express';

import {
    getHistoriasClinicas,
    getHistoriaClinicaById,
    createHistoriaClinica,
    updateHistoriaClinica,
    deleteHistoriaClinica,
} from '../controllers/historiaclinica.controller';

const router = Router();

// Obtener historias clínicas (con filtros: ?paciente=...&estado=...&tipoAtencion=...)
router.get('/', getHistoriasClinicas);

// Obtener historia clínica por ID
router.get('/:id', getHistoriaClinicaById);

// Crear nueva historia clínica
router.post('/', createHistoriaClinica);

// Actualizar historia clínica (incrementa la versión en cada actualización)
router.put('/:id', updateHistoriaClinica);

// Eliminar historia clínica (borrado lógico)
router.delete('/:id', deleteHistoriaClinica);

export default router;
