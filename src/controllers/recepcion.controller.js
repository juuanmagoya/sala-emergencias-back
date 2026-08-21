// src/controllers/recepcion.controller.js
const mongoose = require('mongoose');
const Turno = require('../models/Turno');
const Paciente = require('../models/Paciente');
const respuestaEstandar = require('../utils/respuestaEstandar');

const registrarIngreso = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { datosPaciente, especialidad, fechaTurno, estado, observaciones } = req.body;

        // 🔥 CAMBIO: especialidad ya es ObjectId, se usa directamente
        const [nuevoPaciente] = await Paciente.create([datosPaciente], { session });

        const [nuevoTurno] = await Turno.create([{
            paciente: nuevoPaciente._id,
            especialidad, // 🔥 AHORA ES ObjectId
            fechaTurno,
            estado: estado || 'pendiente',
            observaciones
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // 🔥 CAMBIO: populate de especialidad también
        const turnoCompleto = await Turno.findById(nuevoTurno.id)
            .populate('paciente')
            .populate('especialidad');

        return respuestaEstandar(res, 201, true, "ingreso paciente nuevo", turnoCompleto);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        return respuestaEstandar(res, 400, false, "transaccion abortada", error.message);
    }
};

module.exports = { registrarIngreso };