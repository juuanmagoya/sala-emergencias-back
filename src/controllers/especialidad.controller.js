// src/controllers/especialidad.controller.js
const mongoose = require('mongoose');
const Especialidad = require('../models/Especialidad');
const Medico = require('../models/Medico');
const Consultorio = require('../models/Consultorio');
const Turno = require('../models/Turno');
const respuestaEstandar = require('../utils/respuestaEstandar');

// Obtener todas las especialidades (con filtros)
const getEspecialidades = async (req, res) => {
    try {
        // Query params: ?nombre=...&codigo=...&id=...
        const { nombre, codigo, id } = req.query;
        const filtro = { activo: true };
        
        // Si se pasa ID, buscar por ID específico
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return respuestaEstandar(res, 400, false, 'ID de especialidad inválido');
            }
            filtro._id = id;
        }
        
        // Buscar por nombre (parcial, case insensitive)
        if (nombre) {
            filtro.nombre = { $regex: nombre.toUpperCase(), $options: 'i' };
        }
        
        // Buscar por código exacto
        if (codigo) {
            filtro.codigo = codigo.toUpperCase();
        }
        
        console.log("🟢 Filtro especialidades:", filtro);
        
        const especialidades = await Especialidad.find(filtro);
        
        // Si se buscó por ID y no se encontró, devolver 404
        if (id && especialidades.length === 0) {
            return respuestaEstandar(res, 404, false, 'Especialidad no encontrada');
        }
        
        return respuestaEstandar(res, 200, true, 'Especialidades obtenidas exitosamente', especialidades);
        
    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener las especialidades', error.message);
    }
};

// Crear una nueva especialidad
const createEspecialidad = async (req, res) => {
    try {
        const nuevaEspecialidad = await Especialidad.create(req.body);
        return respuestaEstandar(res, 201, true, 'Especialidad creada exitosamente', nuevaEspecialidad);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return respuestaEstandar(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        
        return respuestaEstandar(res, 500, false, 'Error al crear la especialidad', error.message);
    }
};

// Actualizar una especialidad
const updateEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de especialidad inválido');
        }
        
        // Verificar si existe y está activa
        const especialidadExistente = await Especialidad.findOne({ _id: id, activo: true });
        
        if (!especialidadExistente) {
            return respuestaEstandar(res, 404, false, 'Especialidad no encontrada');
        }
        
        // Verificar duplicados (nombre o código) si se están actualizando
        const { nombre, codigo } = req.body;
        if (nombre || codigo) {
            const duplicado = await Especialidad.findOne({
                $or: [
                    ...(nombre ? [{ nombre }] : []),
                    ...(codigo ? [{ codigo }] : [])
                ],
                _id: { $ne: id }
            });
            
            if (duplicado) {
                if (duplicado.nombre === nombre) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otra especialidad con ese nombre');
                }
                if (duplicado.codigo === codigo) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otra especialidad con ese código');
                }
            }
        }
        
        const especialidadActualizada = await Especialidad.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        
        return respuestaEstandar(res, 200, true, 'Especialidad actualizada exitosamente', especialidadActualizada);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return respuestaEstandar(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        
        return respuestaEstandar(res, 500, false, 'Error al actualizar la especialidad', error.message);
    }
};

// Eliminar especialidad (borrado lógico)
const deleteEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de especialidad inválido');
        }
        
        // Verificar si está siendo usada por algún médico
        const medicoUsando = await Medico.findOne({ especialidad: id, activo: true });
        if (medicoUsando) {
            return respuestaEstandar(res, 400, false, 'No se puede eliminar la especialidad porque está siendo utilizada por un médico');
        }
        
        // Verificar si está siendo usada por algún consultorio
        const consultorioUsando = await Consultorio.findOne({ especialidades: id, activo: true });
        if (consultorioUsando) {
            return respuestaEstandar(res, 400, false, 'No se puede eliminar la especialidad porque está siendo utilizada por un consultorio');
        }
        
        // Verificar si está siendo usada por algún turno
        const turnoUsando = await Turno.findOne({ especialidad: id, activo: true });
        if (turnoUsando) {
            return respuestaEstandar(res, 400, false, 'No se puede eliminar la especialidad porque está siendo utilizada por un turno');
        }
        
        const especialidadEliminada = await Especialidad.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );
        
        if (!especialidadEliminada) {
            return respuestaEstandar(res, 404, false, 'Especialidad no encontrada');
        }
        
        return respuestaEstandar(res, 200, true, 'Especialidad eliminada exitosamente', especialidadEliminada);
        
    } catch (error) {
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID con formato inválido');
        }
        return respuestaEstandar(res, 500, false, 'Error al eliminar la especialidad', error.message);
    }
};

module.exports = {
    getEspecialidades,
    createEspecialidad,
    updateEspecialidad,
    deleteEspecialidad
};