// src/controllers/medico.controller.js
const mongoose = require('mongoose');
const Medico = require('../models/Medico');
const Especialidad = require('../models/Especialidad');
const respuestaEstandar = require('../utils/respuestaEstandar');

// Obtener todos los médicos (con filtros por query params)
const getMedicos = async (req, res) => {
    try {
        const { especialidad, matricula, apellido, nombre, id } = req.query;
        
        const filtro = { activo: true };
        
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return respuestaEstandar(res, 400, false, 'ID de médico inválido');
            }
            filtro._id = id;
        }
        
        // 🔥 CAMBIO: buscar por ObjectId de especialidad
        if (especialidad) {
            const especialidadDoc = await Especialidad.findOne({ 
                nombre: especialidad.toUpperCase() 
            });
            if (especialidadDoc) {
                filtro.especialidad = especialidadDoc._id;
            } else {
                return respuestaEstandar(res, 200, true, 'Médicos obtenidos exitosamente', []);
            }
        }
        
        if (matricula) filtro.matricula = matricula;
        if (apellido) filtro.apellido = { $regex: apellido.toUpperCase(), $options: 'i' };
        if (nombre) filtro.nombre = { $regex: nombre.toUpperCase(), $options: 'i' };
        
        console.log("🟢 Filtro médicos:", filtro);
        
        // 🔥 CAMBIO: populate de especialidad Y consultorios
        const medicos = await Medico.find(filtro)
            .populate('especialidad')
            .populate('consultorios');
        
        if (id && medicos.length === 0) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }
        
        return respuestaEstandar(res, 200, true, 'Médicos obtenidos exitosamente', medicos);
        
    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los médicos', error.message);
    }
};

// Crear un nuevo médico
const createMedico = async (req, res) => {
    try {
        const { matricula, email } = req.body;
        
        // Verificar si ya existe un médico con esa matrícula o email
        const existente = await Medico.findOne({ 
            $or: [{ matricula }, { email }] 
        });
        
        if (existente) {
            if (existente.matricula === matricula) {
                return respuestaEstandar(res, 400, false, 'Ya existe un médico con esa matrícula');
            }
            if (existente.email === email) {
                return respuestaEstandar(res, 400, false, 'Ya existe un médico con ese email');
            }
        }
        
        const nuevoMedico = await Medico.create(req.body);
        
        // 🔥 CAMBIO: populate para devolver los datos completos
        const medicoCompleto = await Medico.findById(nuevoMedico._id)
            .populate('especialidad')
            .populate('consultorios');
        
        return respuestaEstandar(res, 201, true, 'Médico creado exitosamente', medicoCompleto);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return respuestaEstandar(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        
        return respuestaEstandar(res, 500, false, 'Error al crear el médico', error.message);
    }
};

// Actualizar un médico
const updateMedico = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de médico inválido');
        }
        
        const medicoExistente = await Medico.findOne({ _id: id, activo: true });
        
        if (!medicoExistente) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }
        
        const { matricula, email } = req.body;
        if (matricula || email) {
            const duplicado = await Medico.findOne({
                $or: [
                    ...(matricula ? [{ matricula }] : []),
                    ...(email ? [{ email }] : [])
                ],
                _id: { $ne: id }
            });
            
            if (duplicado) {
                if (duplicado.matricula === matricula) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otro médico con esa matrícula');
                }
                if (duplicado.email === email) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otro médico con ese email');
                }
            }
        }
        
        const medicoActualizado = await Medico.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('especialidad')
        .populate('consultorios');
        
        return respuestaEstandar(res, 200, true, 'Médico actualizado exitosamente', medicoActualizado);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID de médico inválido');
        }
        
        return respuestaEstandar(res, 500, false, 'Error al actualizar el médico', error.message);
    }
};

// Eliminar médico (borrado lógico)
const deleteMedico = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de médico inválido');
        }
        
        const medicoEliminado = await Medico.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );
        
        if (!medicoEliminado) {
            return respuestaEstandar(res, 404, false, 'Médico no encontrado');
        }
        
        return respuestaEstandar(res, 200, true, 'Médico eliminado exitosamente', medicoEliminado);
        
    } catch (error) {
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID con formato inválido');
        }
        return respuestaEstandar(res, 500, false, 'Error al eliminar el médico', error.message);
    }
};

module.exports = {
    getMedicos,
    createMedico,
    updateMedico,
    deleteMedico
};