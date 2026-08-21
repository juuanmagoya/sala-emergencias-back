// src/controllers/turnos.controller.js
const mongoose = require('mongoose');
const Turno = require('../models/Turno');
const Especialidad = require('../models/Especialidad');
const respuestaEstandar = require('../utils/respuestaEstandar');

const getTurnos = async (req, res) => {
    try {
        // 🔥 CAMBIO: agregar populate de especialidad
        const turnos = await Turno.find({ activo: true })
            .populate('paciente')
            .populate('especialidad');
        return respuestaEstandar(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    } catch (error) {
         return respuestaEstandar(res, 500, false, 'Error interno del servidor', error.message);
    }
};

const createTurno = async (req, res) => {
    try {
        const origenPeticion = req.headers['x-origen'];
        const tokenSeguridad = req.headers['authorization'];

        console.log("🌎 Peticion realizada desde:", origenPeticion);

        if (tokenSeguridad != 'token123') {
            return respuestaEstandar(res, 401, false, 'no tiene permisos');
        }

        const esUrgente = req.query.urgencia === 'true';

        const datosDelTurno = {
            paciente: req.body.paciente,
            especialidad: req.body.especialidad, // 🔥 AHORA ES ObjectId
            fechaTurno: req.body.fechaTurno
        };

        if (esUrgente) {
            datosDelTurno.estado = 'atendido';
            datosDelTurno.observaciones = 'ingreso por guardia medica';
            console.log("🚨 ALERTA: registrado un turno de urgencia");
        }

        const nuevoTurno = await Turno.create(datosDelTurno);
        
        // 🔥 CAMBIO: populate para devolver los datos completos
        const turnoCompleto = await Turno.findById(nuevoTurno._id)
            .populate('paciente')
            .populate('especialidad');

        return respuestaEstandar(res, 201, true, 'Turno creado exitosamente', turnoCompleto);

    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 500, false, 'Error interno del servidor', error.message);
    }
};

const deleteTurno = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de turno inválido');
        }

        const turnoBorrado = await Turno.findByIdAndUpdate(
            id, 
            { 
                activo: false,
                estado: 'cancelado'
            },
            { new: true }
        ).populate('paciente')
         .populate('especialidad');

        if (!turnoBorrado) {
            return respuestaEstandar(res, 404, false, `Turno no encontrado con ID ${id}`);
        }
        
        return respuestaEstandar(res, 200, true, 'Turno eliminado exitosamente', turnoBorrado);
    } catch (error) {
        console.error('Error al eliminar el turno:', error);
        return respuestaEstandar(res, 400, false, 'ID con formato invalido', error.message);
    }
};

module.exports = { getTurnos, createTurno, deleteTurno };