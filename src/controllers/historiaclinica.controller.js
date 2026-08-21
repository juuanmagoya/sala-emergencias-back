const mongoose = require('mongoose');
const HistoriaClinica = require('../models/HistoriaClinica');
const respuestaEstandar = require('../utils/respuestaEstandar');

// Obtener historias clínicas con filtros esenciales
const getHistoriasClinicas = async (req, res) => {
    try {
        // Query params: ?paciente=...&estado=...&tipoAtencion=...
        const { paciente, estado, tipoAtencion } = req.query;
        const filtro = { activo: true };
        
        // Filtrar por paciente (el más importante)
        if (paciente) {
            if (!mongoose.Types.ObjectId.isValid(paciente)) {
                return respuestaEstandar(res, 400, false, 'ID de paciente inválido');
            }
            filtro.paciente = paciente;
        }
        
        // Filtrar por estado
        if (estado) {
            const estadosValidos = ['EN_ATENCION', 'FINALIZADA', 'OBSERVACION'];
            if (!estadosValidos.includes(estado)) {
                return respuestaEstandar(res, 400, false, 'Estado inválido. Opciones: EN_ATENCION, FINALIZADA, OBSERVACION');
            }
            filtro.estado = estado;
        }
        
        // Filtrar por tipo de atención
        if (tipoAtencion) {
            const tiposValidos = ['URGENCIA', 'CONSULTA_GENERAL', 'CONTROL', 'EMERGENCIA'];
            if (!tiposValidos.includes(tipoAtencion)) {
                return respuestaEstandar(res, 400, false, 'Tipo de atención inválido');
            }
            filtro.tipoAtencion = tipoAtencion;
        }
        
        console.log("🟢 Filtro historias clínicas:", filtro);
        
        // Populate para traer datos relacionados
        const historias = await HistoriaClinica.find(filtro)
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula')
            .sort({ fechaAtencion: -1 }); // Ordenar por fecha (más reciente primero)
        
        return respuestaEstandar(res, 200, true, 'Historias clínicas obtenidas exitosamente', historias);
        
    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener las historias clínicas', error.message);
    }
};

// Obtener una historia clínica por ID
const getHistoriaClinicaById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de historia clínica inválido');
        }
        
        const historia = await HistoriaClinica.findOne({ _id: id, activo: true })
            .populate('paciente', 'nombre dni email telefono')
            .populate('medico', 'nombre apellido matricula especialidad');
        
        if (!historia) {
            return respuestaEstandar(res, 404, false, 'Historia clínica no encontrada');
        }
        
        return respuestaEstandar(res, 200, true, 'Historia clínica obtenida exitosamente', historia);
        
    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener la historia clínica', error.message);
    }
};

// Crear una nueva historia clínica
const createHistoriaClinica = async (req, res) => {
    try {
        const nuevaHistoria = await HistoriaClinica.create(req.body);
        
        // Populate para devolver los datos completos
        const historiaCompleta = await HistoriaClinica.findById(nuevaHistoria._id)
            .populate('paciente', 'nombre dni')
            .populate('medico', 'nombre apellido matricula');
        
        return respuestaEstandar(res, 201, true, 'Historia clínica creada exitosamente', historiaCompleta);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        return respuestaEstandar(res, 500, false, 'Error al crear la historia clínica', error.message);
    }
};

// Actualizar una historia clínica
const updateHistoriaClinica = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de historia clínica inválido');
        }
        
        // Verificar si existe y está activa
        const historiaExistente = await HistoriaClinica.findOne({ _id: id, activo: true });
        
        if (!historiaExistente) {
            return respuestaEstandar(res, 404, false, 'Historia clínica no encontrada');
        }
        
        // Incrementar versión al actualizar
        const datosActualizados = {
            ...req.body,
            $inc: { version: 1 } // Incrementar versión
        };
        
        const historiaActualizada = await HistoriaClinica.findByIdAndUpdate(
            id,
            datosActualizados,
            { new: true, runValidators: true }
        )
        .populate('paciente', 'nombre dni')
        .populate('medico', 'nombre apellido matricula');
        
        return respuestaEstandar(res, 200, true, 'Historia clínica actualizada exitosamente', historiaActualizada);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID de historia clínica inválido');
        }
        
        return respuestaEstandar(res, 500, false, 'Error al actualizar la historia clínica', error.message);
    }
};

// Eliminar historia clínica (borrado lógico)
const deleteHistoriaClinica = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return respuestaEstandar(res, 400, false, 'ID de historia clínica inválido');
        }
        
        const historiaEliminada = await HistoriaClinica.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );
        
        if (!historiaEliminada) {
            return respuestaEstandar(res, 404, false, 'Historia clínica no encontrada');
        }
        
        return respuestaEstandar(res, 200, true, 'Historia clínica eliminada exitosamente', historiaEliminada);
        
    } catch (error) {
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID con formato inválido');
        }
        return respuestaEstandar(res, 500, false, 'Error al eliminar la historia clínica', error.message);
    }
};

module.exports = {
    getHistoriasClinicas,
    getHistoriaClinicaById,
    createHistoriaClinica,
    updateHistoriaClinica,
    deleteHistoriaClinica
};