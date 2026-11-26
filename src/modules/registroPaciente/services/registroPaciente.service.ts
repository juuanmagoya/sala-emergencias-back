
import PacienteModel from '../../pacientes/models/Paciente.js';

import type { IPaciente } from '../../pacientes/interfaces/paciente.interfaces.js';
import type { RegistrarPacientePublicoDTO } from '../dtos/RegistrarPacientePublicoDTO.js';

import {
    normalizarDni,
    normalizarTelefono,
    coincideTelefono,
} from '../../../utils/credencialesPaciente.js';

export class ErrorRegistroPaciente extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400
    ) {
        super(message);
        this.name = 'ErrorRegistroPaciente';
    }
}

const esObjeto = (
    valor: unknown
): valor is Record<string, unknown> =>
    typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor);

const obtenerDatosPermitidos = (
    entrada: unknown
): RegistrarPacientePublicoDTO => {
    if (!esObjeto(entrada)) {
        throw new ErrorRegistroPaciente(
            'Los datos enviados no son válidos'
        );
    }

    const { nombre, dni, email, telefono } = entrada;

    if (
        typeof nombre !== 'string' ||
        typeof dni !== 'string' ||
        typeof email !== 'string' ||
        !esObjeto(telefono)
    ) {
        throw new ErrorRegistroPaciente(
            'Nombre, DNI, teléfono y email son obligatorios'
        );
    }

    const { codigoArea, numero } = telefono;

    if (
        typeof codigoArea !== 'string' ||
        typeof numero !== 'string'
    ) {
        throw new ErrorRegistroPaciente(
            'El código de área y el número de teléfono son obligatorios'
        );
    }

    return {
        nombre: nombre.trim(),
        dni: dni.trim(),
        email: email.trim().toLowerCase(),
        telefono: {
            codigoArea: codigoArea.trim(),
            numero: numero.trim(),
        },
    };
};

class RegistroPacienteService {
    async registrar(datosEntrada: unknown) {
        const datos = obtenerDatosPermitidos(datosEntrada);

        // Validaciones básicas antes de consultar MongoDB.
        if (!datos.nombre || datos.nombre.length < 3) {
            throw new ErrorRegistroPaciente(
                'El nombre completo debe tener al menos 3 caracteres'
            );
        }

        const variantesDni = normalizarDni(datos.dni);

        if (variantesDni.length === 0) {
            throw new ErrorRegistroPaciente(
                'El DNI debe contener 7 u 8 dígitos'
            );
        }

        if (!datos.email) {
            throw new ErrorRegistroPaciente(
                'El email es obligatorio'
            );
        }

        // Validar estructura y reglas del modelo antes de consultar
        // duplicados o intentar guardar.
        const datosPaciente: Partial<IPaciente> = {
            nombre: datos.nombre,
            dni: datos.dni,
            email: datos.email,
            telefono: {
                tipo: 'CELULAR',
                codigoArea: datos.telefono.codigoArea,
                numero: datos.telefono.numero,
            },
        };

        const pacienteValidacion = new PacienteModel(datosPaciente);

        try {
            await pacienteValidacion.validate();
        } catch (error: unknown) {
            if (
                error &&
                typeof error === 'object' &&
                'name' in error &&
                error.name === 'ValidationError'
            ) {
                throw new ErrorRegistroPaciente(
                    'Los datos ingresados no cumplen con el formato requerido'
                );
            }

            throw error;
        }

        // ----------------------------------------------------
        // DNI DUPLICADO
        // ----------------------------------------------------

        const dniDuplicado = await PacienteModel.findOne({
            dni: { $in: variantesDni },
        }).select('_id');

        if (dniDuplicado) {
            throw new ErrorRegistroPaciente(
                'Ya existe un paciente registrado con ese DNI',
                409
            );
        }

        // ----------------------------------------------------
        // EMAIL DUPLICADO
        // ----------------------------------------------------

        const emailDuplicado = await PacienteModel.findOne({
            email: datos.email,
        }).select('_id');

        if (emailDuplicado) {
            throw new ErrorRegistroPaciente(
                'Ya existe un paciente registrado con ese email',
                409
            );
        }

        // ----------------------------------------------------
        // TELÉFONO DUPLICADO
        // ----------------------------------------------------

        const telefonoIngresado = normalizarTelefono(
            datos.telefono.codigoArea + datos.telefono.numero
        );

        const telefonosRegistrados = await PacienteModel.find({
            'telefono.codigoArea': { $exists: true },
            'telefono.numero': { $exists: true },
        })
            .select('telefono.codigoArea telefono.numero')
            .lean();

        const telefonoDuplicado = telefonosRegistrados.some(
            (paciente) =>
                coincideTelefono(
                    telefonoIngresado,
                    paciente.telefono
                )
        );

        if (telefonoDuplicado) {
            throw new ErrorRegistroPaciente(
                'Ya existe un paciente registrado con ese teléfono',
                409
            );
        }

        // ----------------------------------------------------
        // CREAR PACIENTE
        // ----------------------------------------------------

        try {
            const nuevoPaciente = await PacienteModel.create(
                datosPaciente
            );

            // No devolvemos DNI, teléfono ni email en la respuesta.
            return {
                id: nuevoPaciente._id.toString(),
                nombre: nuevoPaciente.nombre,
            };
        } catch (error: unknown) {
            // El índice único de email y el índice de DNI también
            // protegen frente a duplicados detectados al guardar.
            if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 11000
            ) {
                throw new ErrorRegistroPaciente(
                    'Ya existe un paciente registrado con alguno de esos datos',
                    409
                );
            }

            throw error;
        }
    }
}

export default new RegistroPacienteService();
