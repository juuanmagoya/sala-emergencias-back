import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Usuario from '../modules/usuario/models/Usuario.js';
import {
    ROL_POR_DEFECTO,
    esRolUsuario,
} from '../modules/usuario/types/usuario.types.js';
import type { UsuarioAutenticado } from '../modules/usuario/types/usuario.types.js';
import ErrorConfiguracion from '../utils/ErrorConfiguracion.js';

interface RegistrarUsuarioDTO {
    nombre: string;
    email: string;
    password: string;
}

interface LoginUsuarioDTO {
    email: string;
    password: string;
}

const obtenerJwtSecret = (): string => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new ErrorConfiguracion(
            'JWT_SECRET no está configurado'
        );
    }

    return jwtSecret;
};

const registrarUsuario = async ({
    nombre,
    email,
    password,
}: RegistrarUsuarioDTO) => {
    const usuarioExistente = await Usuario.findOne({ email });

    if (usuarioExistente) {
        throw new Error('El email ya está registrado');
    }

    const passwordHasheada = await bcrypt.hash(password, 10);

    // El rol nunca se toma del cuerpo de la solicitud: el registro público
    // solo puede crear cuentas con el rol de menor privilegio.
    const usuario = await Usuario.create({
        nombre,
        email,
        password: passwordHasheada,
        rol: ROL_POR_DEFECTO,
    });

    return {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
    };
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
        id: usuario._id.toString(),
        email: usuario.email,
        rol: usuario.rol,
        medico: usuario.medico?.toString(),
    };

    const token = jwt.sign(
        payload,
        jwtSecret,
        {
            expiresIn: '5h',
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

export {
    registrarUsuario,
    loginUsuario,
};
