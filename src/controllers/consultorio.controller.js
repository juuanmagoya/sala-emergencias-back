// src/controllers/consultorio.controller.js
const mongoose = require('mongoose');
const Consultorio = require('../models/Consultorio');
const Especialidad = require('../models/Especialidad');
const respuestaEstandar = require('../utils/respuestaEstandar');

const getConsultorios = async (req, res) => {
    try {
        const { id, numero, nombre, especialidad } = req.query;
        const filtro = { activo: true };
        
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return respuestaEstandar(res, 400, false, 'ID de consultorio inválido');
            }
            filtro._id = id;
        }
        
        if (numero) filtro.numero = numero;
        if (nombre) filtro.nombre = { $regex: nombre.toUpperCase(), $options: 'i' };
        
        // 🔥 NUEVO: buscar por especialidad
        if (especialidad) {
            const especialidadDoc = await Especialidad.findOne({ 
                nombre: especialidad.toUpperCase() 
            });
            if (especialidadDoc) {
                filtro.especialidades = { $in: [especialidadDoc._id] };
            } else {
                return respuestaEstandar(res, 200, true, 'Consultorios obtenidos exitosamente', []);
            }
        }
        
        console.log("🟢 Filtro consultorios:", filtro);
        
        // 🔥 CAMBIO: agregar populate de especialidades
        const consultorios = await Consultorio.find(filtro).populate('especialidades');
        
        if (id && consultorios.length === 0) {
            return respuestaEstandar(res, 404, false, 'Consultorio no encontrado');
        }
        
        return respuestaEstandar(res, 200, true, 'Consultorios obtenidos exitosamente', consultorios);
        
    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los consultorios', error.message);
    }
};

const createConsultorio = async (req, res) => {
    try {
        const nuevoConsultorio = await Consultorio.create(req.body);
        
        // 🔥 CAMBIO: populate para devolver los datos completos
        const consultorioCompleto = await Consultorio.findById(nuevoConsultorio._id)
            .populate('especialidades');
        
        return respuestaEstandar(res, 201, true, 'Consultorio creado exitosamente', consultorioCompleto);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return respuestaEstandar(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        
        return respuestaEstandar(res, 500, false, 'Error al crear el consultorio', error.message);
    }
};

const updateConsultorio = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de consultorio inválido');
        }
        
        const consultorioExistente = await Consultorio.findOne({ _id: id, activo: true });
        
        if (!consultorioExistente) {
            return respuestaEstandar(res, 404, false, 'Consultorio no encontrado');
        }
        
        const { nombre, numero } = req.body;
        if (nombre || numero) {
            const duplicado = await Consultorio.findOne({
                $or: [
                    ...(nombre ? [{ nombre }] : []),
                    ...(numero ? [{ numero }] : [])
                ],
                _id: { $ne: id }
            });
            
            if (duplicado) {
                if (duplicado.nombre === nombre) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otro consultorio con ese nombre');
                }
                if (duplicado.numero === numero) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otro consultorio con ese número');
                }
            }
        }
        
        const consultorioActualizado = await Consultorio.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        ).populate('especialidades');
        
        return respuestaEstandar(res, 200, true, 'Consultorio actualizado exitosamente', consultorioActualizado);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID de consultorio inválido');
        }
        
        return respuestaEstandar(res, 500, false, 'Error al actualizar el consultorio', error.message);
    }
};

const deleteConsultorio = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de consultorio inválido');
        }
        
        const consultorioEliminado = await Consultorio.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );
        
        if (!consultorioEliminado) {
            return respuestaEstandar(res, 404, false, 'Consultorio no encontrado');
        }
        
        return respuestaEstandar(res, 200, true, 'Consultorio eliminado exitosamente', consultorioEliminado);
        
    } catch (error) {
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID con formato inválido');
        }
        return respuestaEstandar(res, 500, false, 'Error al eliminar el consultorio', error.message);
    }
};

module.exports = {
    getConsultorios,
    createConsultorio,
    updateConsultorio,
    deleteConsultorio
};