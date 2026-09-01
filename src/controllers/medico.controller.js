const medicoService = require('../services/medicos.service');

const respuestaEstandar = require('../utils/respuestaEstandar');

// ============================================================
// OBTENER MÉDICOS
// ============================================================

const getMedicos = async (req, res) => {
    try {

        const medicos = await medicoService.getAll(
            req.query
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Médicos obtenidos exitosamente',
            medicos
        );

    } catch (error) {

        console.error(
            'Error al obtener médicos:',
            error
        );

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message || 'Error al obtener los médicos'
        );
    }
};

// ============================================================
// CREAR MÉDICO
// ============================================================

const createMedico = async (req, res) => {
    try {

        const medico =
            await medicoService.create(req.body);

        return respuestaEstandar(
            res,
            201,
            true,
            'Médico creado exitosamente',
            medico
        );

    } catch (error) {

        console.error(
            'Error al crear médico:',
            error
        );

        if (
            error.name === 'ValidationError'
        ) {

            const errores =
                Object.values(
                    error.errors
                ).map(
                    (err) => err.message
                );

            return respuestaEstandar(
                res,
                400,
                false,
                'Error de validación',
                errores
            );
        }

        if (error.code === 11000) {

            const campo =
                Object.keys(
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
            error.statusCode || 500,
            false,
            error.message || 'Error al crear el médico'
        );
    }
};

// ============================================================
// ACTUALIZAR MÉDICO
// ============================================================

const updateMedico = async (req, res) => {
    try {

        const medico =
            await medicoService.update(
                req.params.id,
                req.body
            );

        return respuestaEstandar(
            res,
            200,
            true,
            'Médico actualizado exitosamente',
            medico
        );

    } catch (error) {

        console.error(
            'Error al actualizar médico:',
            error
        );

        if (
            error.name === 'ValidationError'
        ) {

            const errores =
                Object.values(
                    error.errors
                ).map(
                    (err) => err.message
                );

            return respuestaEstandar(
                res,
                400,
                false,
                'Error de validación',
                errores
            );
        }

        if (
            error.code === 11000
        ) {

            const campo =
                Object.keys(
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
            error.statusCode || 500,
            false,
            error.message || 'Error al actualizar el médico'
        );
    }
};

// ============================================================
// ACTIVAR / DESACTIVAR
// ============================================================

const toggleActivoMedico = async (req, res) => {
    try {

        const medico =
            await medicoService.toggleActivo(
                req.params.id
            );

        const mensaje =
            medico.activo
                ? 'Médico activado exitosamente'
                : 'Médico desactivado exitosamente';

        return respuestaEstandar(
            res,
            200,
            true,
            mensaje,
            medico
        );

    } catch (error) {

        console.error(
            'Error al cambiar estado del médico:',
            error
        );

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message ||
            'Error al cambiar el estado del médico'
        );
    }
};

// ============================================================
// ELIMINAR
// ============================================================

const deleteMedicoPermanente = async (req, res) => {
    try {

        await medicoService.remove(
            req.params.id
        );

        return respuestaEstandar(
            res,
            200,
            true,
            'Médico eliminado permanentemente'
        );

    } catch (error) {

        console.error(
            'Error al eliminar médico:',
            error
        );

        return respuestaEstandar(
            res,
            error.statusCode || 500,
            false,
            error.message ||
            'Error al eliminar permanentemente el médico'
        );
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getMedicos,
    createMedico,
    updateMedico,
    toggleActivoMedico,
    deleteMedicoPermanente
};