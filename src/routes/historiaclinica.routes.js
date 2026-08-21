const express = require('express');
const router = express.Router();
const {
    getHistoriasClinicas,
    getHistoriaClinicaById,
    createHistoriaClinica,
    updateHistoriaClinica,
    deleteHistoriaClinica
} = require('../controllers/historiaClinica.controller');

// Obtener historias clínicas (con filtros: ?paciente=...&estado=...&tipoAtencion=...)
router.get('/', getHistoriasClinicas);

// Obtener historia clínica por ID
router.get('/:id', getHistoriaClinicaById);

// Crear nueva historia clínica
router.post('/', createHistoriaClinica);

// Actualizar historia clínica
router.put('/:id', updateHistoriaClinica);

// Eliminar historia clínica (borrado lógico)
router.delete('/:id', deleteHistoriaClinica);

module.exports = router;