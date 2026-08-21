const Paciente = require('../models/Paciente');
const respuestaEstandar = require('../utils/respuestaEstandar');


const getPacientes = async (req, res) => {
    try {
        
        // ?obraSocial=OSDE&dni=12345678
        const { obraSocial, dni } = req.query;

        const filtro = {};

        if (obraSocial) {
            // filtro.obraSocial = "" "" ""
            filtro['obraSocial.nombre'] = obraSocial.toUpperCase();
        }

        if (dni) {
            filtro.dni = dni;
        }

        console.log("🟢 Filtro armado:", filtro);

        const pacientes = await Paciente.find(filtro);

        return respuestaEstandar(res, 200, true, 'Pacientes obtenidos exitosamente', pacientes);

    } catch (error) {
        return respuestaEstandar(res, 500, false, 'Error al obtener los pacientes', error.message);
    }
};

const createPaciente = async (req, res) => {
    try {
        const nuevoPaciente = await Paciente.create(req.body);

        return respuestaEstandar(res, 201, true, 'Paciente creado exitosamente', nuevoPaciente);

    } catch (error) {

        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);

            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }

        
        return respuestaEstandar(res, 500, false, 'Error al crear el paciente', error.message);
    }
};

const updatePaciente = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si existe
        const pacienteExistente = await Paciente.findById(id);
        if (!pacienteExistente) {
            return respuestaEstandar(res, 404, false, 'Paciente no encontrado');
        }
        
        // Verificar duplicados (DNI o email) si se están actualizando
        const { dni, email } = req.body;
        if (dni || email) {
            const duplicado = await Paciente.findOne({
                $or: [
                    ...(dni ? [{ dni }] : []),
                    ...(email ? [{ email }] : [])
                ],
                _id: { $ne: id } // Excluir el paciente actual
            });
            
            if (duplicado) {
                if (duplicado.dni === dni) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otro paciente con ese DNI');
                }
                if (duplicado.email === email) {
                    return respuestaEstandar(res, 400, false, 'Ya existe otro paciente con ese email');
                }
            }
        }
        
        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        
        return respuestaEstandar(res, 200, true, 'Paciente actualizado exitosamente', pacienteActualizado);
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return respuestaEstandar(res, 400, false, 'Error de validación', errores);
        }
        
        if (error.name === 'CastError') {
            return respuestaEstandar(res, 400, false, 'ID de paciente inválido');
        }
        
        return respuestaEstandar(res, 500, false, 'Error al actualizar el paciente', error.message);
    }
};

const deletePaciente = async (req, res)=>{
    try {
        const { id } = req.params;
        const turno = await Paciente.findByIdAndDelete(id);
        if (!turno) {
            return respuestaEstandar(res, 404, false, 'Paciente no encontrado');
        }
        return respuestaEstandar(res, 200, true, 'Paciente eliminado correctamente', turno);
    } catch (error) {
       
        return respuestaEstandar(res, 400 , false, 'Error al eliminar el paciente', error.message);
    }
};
module.exports = {
    getPacientes,
    createPaciente,
    updatePaciente,
    deletePaciente
};