const express = require('express');
const router = express.Router();
const {
    getMedicos,
    createMedico,
    updateMedico,
    deleteMedico
} = require('../controllers/medico.controller');

// Obtener todos los médicos (con filtros por query params: ?id=...&especialidad=...&matricula=...)
router.get('/', getMedicos);

// Crear nuevo médico
router.post('/', createMedico);

// Actualizar médico
router.put('/:id', updateMedico);

// Eliminar médico (borrado lógico)
router.delete('/:id', deleteMedico);

module.exports = router;