import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import PacienteModel from '../modules/pacientes/models/Paciente.js';
import Usuario from '../modules/usuario/models/Usuario.js';
import {
    ROL_PACIENTE,
    esRolUsuario,
} from '../modules/usuario/types/usuario.types.js';
import type {
    PacienteAutenticado,
    UsuarioAutenticado,
} from '../modules/usuario/types/usuario.types.js';
import ErrorConfiguracion from '../utils/ErrorConfiguracion.js';
import {
    coincideTelefono,
    normalizarDni,
    normalizarTelefono,
} from '../utils/credencialesPaciente.js';

interface LoginUsuarioDTO {
    email: string;
    password: string;
}

interface LoginPacienteDTO {
    dni: string;
    telefono: string;
}

interface ErrorConEstado extends Error {
    statusCode?: number;
}

const EXPIRACION_TOKEN = '5h';

// Mismo mensaje para DNI inexistente, teléfono incorrecto y datos ambiguos:
// no se revela si el DNI existe ni si el teléfono pertenece a un paciente.
const MENSAJE_CREDENCIALES_INVALIDAS = 'DNI o teléfono incorrectos';

const crearError = (
    mensaje: string,
    statusCode: number
): ErrorConEstado =>
    Object.assign(new Error(mensaje), { statusCode });

const obtenerJwtSecret = (): string => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new ErrorConfiguracion(
            'JWT_SECRET no está configurado'
        );
    }

    return jwtSecret;
};

const loginUsuario = async ({
    email,
    password,
}: LoginUsuarioDTO) => {
    // La configuración se valida antes de autenticar: un secreto faltante es
    // un error interno, no una credencial inválida.
    const jwtSecret = obtenerJwtSecret();

    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
        throw new Error('Credenciales inválidas');
    }

    const passwordCorrecta = await bcrypt.compare(
        password,
        usuario.password
    );

    if (!passwordCorrecta) {
        throw new Error('Credenciales inválidas');
    }

    // Los usuarios heredados pueden tener un rol fuera del conjunto permitido.
    if (!esRolUsuario(usuario.rol)) {
        throw new Error('El usuario no tiene un rol válido');
    }

    // La baja lógica de cuentas se refleja en el login. Los documentos
    // heredados sin el campo se consideran activos.
    if (usuario.activo === false) {
        throw new Error('El usuario está desactivado');
    }

    const payload: UsuarioAutenticado = {
        tipo: 'usuario',
        id: usuario._id.toString(),
        email: usuario.email,
        rol: usuario.rol,
        medico: usuario.medico?.toString(),
    };

    const token = jwt.sign(
        payload,
        jwtSecret,
        {
            expiresIn: EXPIRACION_TOKEN,
        }
    );

    return {
        token,
        usuario: {
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            medico: usuario.medico?.toString() ?? null,
        },
    };
};

// DNI + teléfono es una credencial débil: son datos personales que pueden
// conocerse o filtrarse. No equivale a contraseña ni a un segundo factor.
// Próximo paso recomendado: verificación OTP por WhatsApp/SMS antes de emitir
// el token. No se implementa en esta etapa.
const loginPaciente = async ({
    dni,
    telefono,
}: LoginPacienteDTO) => {
    const jwtSecret = obtenerJwtSecret();

    const variantesDni = normalizarDni(dni);

    if (variantesDni.length === 0) {
        throw crearError('El DNI no es válido', 400);
    }

    const variantesTelefono = normalizarTelefono(telefono);

    if (variantesTelefono.length === 0) {
        throw crearError('El teléfono no es válido', 400);
    }

    // Se busca por DNI (índice único) y se compara el teléfono dentro del
    // mismo documento. No se consulta por teléfono por separado para no
    // cruzar datos de dos pacientes distintos.
    const pacientes = await PacienteModel.find({
        dni: { $in: variantesDni },
    })
        .select('nombre telefono')
        .limit(2);

    // Sin coincidencia o con datos ambiguos se responde igual: no se revela
    // si el DNI existe.
    if (pacientes.length !== 1) {
        throw crearError(MENSAJE_CREDENCIALES_INVALIDAS, 401);
    }

    const paciente = pacientes[0];
    const telefonoPaciente = paciente.telefono;

    if (
        !telefonoPaciente ||
        !coincideTelefono(variantesTelefono, telefonoPaciente)
    ) {
        throw crearError(MENSAJE_CREDENCIALES_INVALIDAS, 401);
    }

    // Paciente no tiene un campo `activo` en el modelo actual. Si se agrega,
    // la comprobación debe hacerse acá con el mismo error genérico.

    const payload: PacienteAutenticado = {
        tipo: 'paciente',
        id: paciente._id.toString(),
        rol: ROL_PACIENTE,
    };

    const token = jwt.sign(payload, jwtSecret, {
        expiresIn: EXPIRACION_TOKEN,
    });

    return {
        token,
        paciente: {
            id: paciente._id.toString(),
            nombre: paciente.nombre,
            rol: ROL_PACIENTE,
        },
    };
};

export { loginPaciente, loginUsuario };
