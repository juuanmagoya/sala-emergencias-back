const express = require('express');

const router = express.Router();

const {
    getEspecialidades,
    createEspecialidad,
    updateEspecialidad,
    toggleActivoEspecialidad,
    deleteEspecialidadPermanente,
} = require('../controllers/especialidad.controller');

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

module.exports = router;