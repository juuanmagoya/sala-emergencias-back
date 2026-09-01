// src/controllers/especialidad.controller.js
const mongoose = require('mongoose');
const Especialidad = require('../models/Especialidad');
const Medico = require('../models/Medico');
const Consultorio = require('../models/Consultorio');
const Turno = require('../models/Turno');
const respuestaEstandar = require('../utils/respuestaEstandar');

// Obtener todas las especialidades (con filtros)
// Obtener todas las especialidades
// Obtener todas las especialidades (con filtros)
const getEspecialidades = async (req, res) => {
    try {
        // Query params:
        // ?nombre=...&codigo=...&id=...&activo=true|false
        const { nombre, codigo, id, activo } = req.query;

        const filtro = {};

        // ============================================
        // FILTRO POR ID
        // ============================================

        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return respuestaEstandar(
                    res,
                    400,
                    false,
                    'ID de especialidad inválido'
                );
            }

            filtro._id = id;
        }

        // ============================================
        // FILTRO POR NOMBRE
        // ============================================

        if (nombre) {
            filtro.nombre = {
                $regex: nombre.toUpperCase(),
                $options: 'i'
            };
        }

        // ============================================
        // FILTRO POR CÓDIGO
        // ============================================

        if (codigo) {
            filtro.codigo = codigo.toUpperCase();
        }

        // ============================================
        // FILTRO POR ESTADO
        // ============================================

        if (activo !== undefined) {
            filtro.activo = activo === 'true';
        }

        console.log(
            '🟢 Filtro especialidades:',
            filtro
        );

        // ============================================
        // OBTENER ESPECIALIDADES
        // ============================================

        const especialidades =
            await Especialidad.find(filtro);

        // ============================================
        // BUSQUEDA POR ID
        // ============================================

        if (
            id &&
            especialidades.length === 0
        ) {
            return respuestaEstandar(
                res,
                404,
                false,
                'Especialidad no encontrada'
            );
        }

        return respuestaEstandar(
            res,
            200,
            true,
            'Especialidades obtenidas exitosamente',
            especialidades
        );

    } catch (error) {
        console.error(
            '🔴 Error al obtener especialidades:',
            error
        );

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al obtener las especialidades',
            error.message
        );
    }
};

// Crear una nueva especialidad
const createEspecialidad = async (req, res) => {
    try {
        console.log("🟡 BODY RECIBIDO:", req.body);

        const nuevaEspecialidad = await Especialidad.create(
            req.body
        );

        console.log(
            "🟢 ESPECIALIDAD CREADA:",
            nuevaEspecialidad
        );

        return respuestaEstandar(
            res,
            201,
            true,
            'Especialidad creada exitosamente',
            nuevaEspecialidad
        );

    } catch (error) {
        console.error(
            "🔴 ERROR COMPLETO:",
            error
        );

        console.error(
            "🔴 ERROR NAME:",
            error.name
        );

        console.error(
            "🔴 ERROR MESSAGE:",
            error.message
        );

        console.error(
            "🔴 ERROR CODE:",
            error.code
        );

        if (error.name === 'ValidationError') {
            const errores = Object.values(
                error.errors
            ).map(err => err.message);

            return respuestaEstandar(
                res,
                400,
                false,
                'Error de validación',
                errores
            );
        }

        if (error.code === 11000) {
            const campo = Object.keys(
                error.keyPattern
            )[0];

            return respuestaEstandar(
                res,
                400,
                false,
                `El ${campo} ya está registrado en el sistema`
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al crear la especialidad',
            error.message
        );
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
// Cambiar estado de una especialidad
const toggleActivoEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        // Buscar la especialidad
        const especialidad = await Especialidad.findById(id);

        if (!especialidad) {
            return respuestaEstandar(
                res,
                404,
                false,
                'Especialidad no encontrada'
            );
        }

        // Si está activa, queremos desactivarla
        if (especialidad.activo === true) {

            // Verificar si está siendo utilizada por algún médico
            const medicoUsando = await Medico.findOne({
                especialidad: id,
                activo: true
            });

            if (medicoUsando) {
                return respuestaEstandar(
                    res,
                    400,
                    false,
                    'No se puede desactivar la especialidad porque está siendo utilizada por un médico'
                );
            }

            // Verificar si está siendo utilizada por algún consultorio
            const consultorioUsando = await Consultorio.findOne({
                especialidades: id,
                activo: true
            });

            if (consultorioUsando) {
                return respuestaEstandar(
                    res,
                    400,
                    false,
                    'No se puede desactivar la especialidad porque está siendo utilizada por un consultorio'
                );
            }

            // Verificar si está siendo utilizada por algún turno
            const turnoUsando = await Turno.findOne({
                especialidad: id,
                activo: true
            });

            if (turnoUsando) {
                return respuestaEstandar(
                    res,
                    400,
                    false,
                    'No se puede desactivar la especialidad porque está siendo utilizada por un turno'
                );
            }
        }

        // Cambiar estado
        especialidad.activo = !especialidad.activo;

        await especialidad.save();

        const mensaje = especialidad.activo
            ? 'Especialidad activada exitosamente'
            : 'Especialidad desactivada exitosamente';

        return respuestaEstandar(
            res,
            200,
            true,
            mensaje,
            especialidad
        );

    } catch (error) {
        if (error.name === 'CastError') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al cambiar el estado de la especialidad',
            error.message
        );
    }
};

// Eliminar especialidad permanentemente (borrado físico)
const deleteEspecialidadPermanente = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        // Buscar la especialidad
        const especialidad = await Especialidad.findById(id);

        if (!especialidad) {
            return respuestaEstandar(
                res,
                404,
                false,
                'Especialidad no encontrada'
            );
        }

        // Verificar si está siendo utilizada por algún médico
        const medicoUsando = await Medico.findOne({
            especialidad: id,
            activo: true
        });

        if (medicoUsando) {
            return respuestaEstandar(
                res,
                400,
                false,
                'No se puede eliminar permanentemente la especialidad porque está siendo utilizada por un médico'
            );
        }

        // Verificar si está siendo utilizada por algún consultorio
        const consultorioUsando = await Consultorio.findOne({
            especialidades: id,
            activo: true
        });

        if (consultorioUsando) {
            return respuestaEstandar(
                res,
                400,
                false,
                'No se puede eliminar permanentemente la especialidad porque está siendo utilizada por un consultorio'
            );
        }

        // Verificar si está siendo utilizada por algún turno
        const turnoUsando = await Turno.findOne({
            especialidad: id,
            activo: true
        });

        if (turnoUsando) {
            return respuestaEstandar(
                res,
                400,
                false,
                'No se puede eliminar permanentemente la especialidad porque está siendo utilizada por un turno'
            );
        }

        // Borrado físico
        await Especialidad.findByIdAndDelete(id);

        return respuestaEstandar(
            res,
            200,
            true,
            'Especialidad eliminada permanentemente'
        );

    } catch (error) {
        if (error.name === 'CastError') {
            return respuestaEstandar(
                res,
                400,
                false,
                'ID de especialidad inválido'
            );
        }

        return respuestaEstandar(
            res,
            500,
            false,
            'Error al eliminar permanentemente la especialidad',
            error.message
        );
    }
};

module.exports = {
    getEspecialidades,
    createEspecialidad,
    updateEspecialidad,
    toggleActivoEspecialidad,
    deleteEspecialidadPermanente
};