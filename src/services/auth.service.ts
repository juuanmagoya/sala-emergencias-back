import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Usuario from '../modules/usuario/models/Usuario.js';

interface RegistrarUsuarioDTO {
    nombre: string;
    email: string;
    password: string;
}

interface LoginUsuarioDTO {
    email: string;
    password: string;
}

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

    const usuario = await Usuario.create({
        nombre,
        email,
        password: passwordHasheada,
        rol: 'admin',
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

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error(
            'JWT_SECRET no está configurado'
        );
    }

    const token = jwt.sign(
        {
            id: usuario._id,
            email: usuario.email,
            rol: usuario.rol,
        },
        jwtSecret,
        {
            expiresIn: '1h',
        }
    );

    return {
        token,
        usuario: {
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
        },
    };
};

export {
    registrarUsuario,
    loginUsuario,
};