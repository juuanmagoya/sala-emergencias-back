const express = require('express');

const router = express.Router();

const {
    getMedicos,
    createMedico,
    updateMedico,
    toggleActivoMedico,
    deleteMedicoPermanente
} = require('../controllers/medico.controller');

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

module.exports = router;