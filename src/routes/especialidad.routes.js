// src/routes/especialidad.routes.js
const express = require('express');
const router = express.Router();
const {
    getEspecialidades,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad
} = require('../controllers/especialidad.controller');

// Obtener todas las especialidades (con filtros: ?nombre=...&codigo=...&id=...)
router.get('/', getEspecialidades);

// Crear nueva especialidad
router.post('/', createEspecialidad);

// Actualizar especialidad
router.put('/:id', updateEspecialidad);

// Eliminar especialidad (borrado lógico)
router.delete('/:id', deleteEspecialidad);

module.exports = router;