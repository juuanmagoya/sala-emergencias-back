const express = require('express');
const router = express.Router();
const {
    getConsultorios,
    createConsultorio,
    updateConsultorio,
    deleteConsultorio
} = require('../controllers/consultorio.controller');

// Obtener todos los consultorios (con filtros por query params: ?numero=101&piso=1&id=...)
router.get('/', getConsultorios);

// Crear nuevo consultorio
router.post('/', createConsultorio);

// Actualizar consultorio
router.put('/:id', updateConsultorio);

// Eliminar consultorio (borrado lógico)
router.delete('/:id', deleteConsultorio);

module.exports = router;