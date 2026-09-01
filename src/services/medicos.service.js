const mongoose = require('mongoose');

const Medico = require('../models/Medico');
const Especialidad = require('../models/Especialidad');

// ============================================================
// HELPERS
// ============================================================

const convertirMinutos = (hora) => {
    const [horas, minutos] = hora.split(':').map(Number);

    return horas * 60 + minutos;
};

const validarHorarios = (horarios) => {
    if (!Array.isArray(horarios)) {
        throw new Error('Los horarios de atención deben ser un array');
    }

    // --------------------------------------------------------
    // Validar cada horario individual
    // --------------------------------------------------------

    for (const horario of horarios) {
        const { dia, horaInicio, horaFin } = horario;

        if (!dia || !horaInicio || !horaFin) {
            throw new Error(
                'Cada horario debe tener día, hora de inicio y hora de fin'
            );
        }

        const inicio = convertirMinutos(horaInicio);
        const fin = convertirMinutos(horaFin);

        if (inicio >= fin) {
            throw new Error(
                `El horario del ${dia} es inválido: la hora de inicio debe ser menor que la hora de fin`
            );
        }
    }

    // --------------------------------------------------------
    // Agrupar horarios por día
    // --------------------------------------------------------

    const horariosPorDia = {};

    for (const horario of horarios) {
        if (!horariosPorDia[horario.dia]) {
            horariosPorDia[horario.dia] = [];
        }

        horariosPorDia[horario.dia].push(horario);
    }

    // --------------------------------------------------------
    // Detectar solapamientos
    // --------------------------------------------------------

    for (const dia of Object.keys(horariosPorDia)) {
        const horariosDelDia = horariosPorDia[dia];

        horariosDelDia.sort(
            (a, b) =>
                convertirMinutos(a.horaInicio) -
                convertirMinutos(b.horaInicio)
        );

        for (let i = 0; i < horariosDelDia.length - 1; i++) {
            const actual = horariosDelDia[i];
            const siguiente = horariosDelDia[i + 1];

            const finActual = convertirMinutos(actual.horaFin);
            const inicioSiguiente = convertirMinutos(
                siguiente.horaInicio
            );

            if (finActual > inicioSiguiente) {
                throw new Error(
                    `Los horarios del ${dia} se superponen: ${actual.horaInicio}-${actual.horaFin} y ${siguiente.horaInicio}-${siguiente.horaFin}`
                );
            }
        }
    }

    return true;
};

// ============================================================
// OBTENER MÉDICOS
// ============================================================

const getAll = async (filtros = {}) => {
    const {
        especialidad,
        matricula,
        apellido,
        nombre,
        id,
        activo
    } = filtros;

    const filtro = {};

    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    if (id) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = new Error('ID de médico inválido');
            error.statusCode = 400;
            throw error;
        }

        filtro._id = id;
    }

    // --------------------------------------------------------
    // ESTADO
    // --------------------------------------------------------

    if (activo !== undefined) {
        if (
            activo !== 'true' &&
            activo !== 'false'
        ) {
            const error = new Error(
                'El filtro activo debe ser true o false'
            );

            error.statusCode = 400;
            throw error;
        }

        filtro.activo = activo === 'true';
    }

    // --------------------------------------------------------
    // ESPECIALIDAD
    // --------------------------------------------------------

    if (especialidad) {
        const especialidadDoc = await Especialidad.findOne({
            nombre: especialidad.toUpperCase()
        });

        if (!especialidadDoc) {
            return [];
        }

        filtro.especialidad = especialidadDoc._id;
    }

    // --------------------------------------------------------
    // MATRÍCULA
    // --------------------------------------------------------

    if (matricula) {
        filtro.matricula = matricula;
    }

    // --------------------------------------------------------
    // APELLIDO
    // --------------------------------------------------------

    if (apellido) {
        filtro.apellido = {
            $regex: apellido,
            $options: 'i'
        };
    }

    // --------------------------------------------------------
    // NOMBRE
    // --------------------------------------------------------

    if (nombre) {
        filtro.nombre = {
            $regex: nombre,
            $options: 'i'
        };
    }

    console.log('🟢 Filtro médicos:', filtro);

    const medicos = await Medico.find(filtro)
        .populate('especialidad')
        .populate('consultorios')
        .sort({
            apellido: 1,
            nombre: 1
        });

    if (id && medicos.length === 0) {
        const error = new Error('Médico no encontrado');
        error.statusCode = 404;
        throw error;
    }

    return medicos;
};

// ============================================================
// CREAR MÉDICO
// ============================================================

const create = async (datos) => {
    const {
        matricula,
        email,
        especialidad,
        horariosAtencion
    } = datos;

    // --------------------------------------------------------
    // Validar especialidad
    // --------------------------------------------------------

    if (
        !especialidad ||
        !mongoose.Types.ObjectId.isValid(especialidad)
    ) {
        const error = new Error(
            'La especialidad seleccionada no es válida'
        );

        error.statusCode = 400;
        throw error;
    }

    const especialidadDoc = await Especialidad.findOne({
        _id: especialidad,
        activo: true
    });

    if (!especialidadDoc) {
        const error = new Error(
            'La especialidad seleccionada no existe o está inactiva'
        );

        error.statusCode = 400;
        throw error;
    }

    // --------------------------------------------------------
    // Validar horarios
    // --------------------------------------------------------

    validarHorarios(horariosAtencion);

    // --------------------------------------------------------
    // Verificar duplicados
    // --------------------------------------------------------

    const existente = await Medico.findOne({
        $or: [
            { matricula },
            { email }
        ]
    });

    if (existente) {
        if (existente.matricula === matricula) {
            const error = new Error(
                'Ya existe un médico con esa matrícula'
            );

            error.statusCode = 400;
            throw error;
        }

        if (existente.email === email) {
            const error = new Error(
                'Ya existe un médico con ese email'
            );

            error.statusCode = 400;
            throw error;
        }
    }

    // --------------------------------------------------------
    // Crear médico
    // --------------------------------------------------------

    const nuevoMedico = await Medico.create(datos);

    // --------------------------------------------------------
    // Obtener médico completo
    // --------------------------------------------------------

    const medicoCompleto = await Medico.findById(
        nuevoMedico._id
    )
        .populate('especialidad')
        .populate('consultorios');

    return medicoCompleto;
};

// ============================================================
// ACTUALIZAR MÉDICO
// ============================================================

const update = async (id, datos) => {

    // --------------------------------------------------------
    // Validar ID
    // --------------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(
            'ID de médico inválido'
        );

        error.statusCode = 400;
        throw error;
    }

    // --------------------------------------------------------
    // Buscar médico
    // --------------------------------------------------------

    const medicoExistente = await Medico.findById(id);

    if (!medicoExistente) {
        const error = new Error(
            'Médico no encontrado'
        );

        error.statusCode = 404;
        throw error;
    }

    const {
        matricula,
        email,
        especialidad,
        horariosAtencion
    } = datos;

    // --------------------------------------------------------
    // Validar especialidad
    // --------------------------------------------------------

    if (especialidad) {

        if (
            !mongoose.Types.ObjectId.isValid(
                especialidad
            )
        ) {
            const error = new Error(
                'La especialidad seleccionada no es válida'
            );

            error.statusCode = 400;
            throw error;
        }

        const especialidadDoc =
            await Especialidad.findOne({
                _id: especialidad,
                activo: true
            });

        if (!especialidadDoc) {
            const error = new Error(
                'La especialidad seleccionada no existe o está inactiva'
            );

            error.statusCode = 400;
            throw error;
        }
    }

    // --------------------------------------------------------
    // Validar horarios si vienen en el update
    // --------------------------------------------------------

    if (horariosAtencion !== undefined) {
        validarHorarios(horariosAtencion);
    }

    // --------------------------------------------------------
    // Verificar matrícula/email duplicados
    // --------------------------------------------------------

    if (matricula || email) {

        const condiciones = [];

        if (matricula) {
            condiciones.push({ matricula });
        }

        if (email) {
            condiciones.push({ email });
        }

        const duplicado = await Medico.findOne({
            $or: condiciones,
            _id: { $ne: id }
        });

        if (duplicado) {

            if (
                matricula &&
                duplicado.matricula === matricula
            ) {
                const error = new Error(
                    'Ya existe otro médico con esa matrícula'
                );

                error.statusCode = 400;
                throw error;
            }

            if (
                email &&
                duplicado.email === email
            ) {
                const error = new Error(
                    'Ya existe otro médico con ese email'
                );

                error.statusCode = 400;
                throw error;
            }
        }
    }

    // --------------------------------------------------------
    // Actualizar
    // --------------------------------------------------------

    const medicoActualizado =
        await Medico.findByIdAndUpdate(
            id,
            datos,
            {
                new: true,
                runValidators: true
            }
        )
            .populate('especialidad')
            .populate('consultorios');

    return medicoActualizado;
};

// ============================================================
// ACTIVAR / DESACTIVAR
// ============================================================

const toggleActivo = async (id) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(
            'ID de médico inválido'
        );

        error.statusCode = 400;
        throw error;
    }

    const medico = await Medico.findById(id);

    if (!medico) {
        const error = new Error(
            'Médico no encontrado'
        );

        error.statusCode = 404;
        throw error;
    }

    medico.activo = !medico.activo;

    await medico.save();

    const medicoActualizado =
        await Medico.findById(id)
            .populate('especialidad')
            .populate('consultorios');

    return medicoActualizado;
};

// ============================================================
// ELIMINAR PERMANENTEMENTE
// ============================================================

const remove = async (id) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error(
            'ID de médico inválido'
        );

        error.statusCode = 400;
        throw error;
    }

    const medico = await Medico.findById(id);

    if (!medico) {
        const error = new Error(
            'Médico no encontrado'
        );

        error.statusCode = 404;
        throw error;
    }

    await Medico.findByIdAndDelete(id);
};

module.exports = {
    getAll,
    create,
    update,
    toggleActivo,
    remove
};