const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Usuario = require('../models/Usuario');

const registrarUsuario = async ({ nombre, email, password }) => {

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

const loginUsuario = async ({ email, password }) => {

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

    const token = jwt.sign(
        {
            id: usuario._id,
            email: usuario.email,
            rol: usuario.rol,
        },
        process.env.JWT_SECRET,
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

module.exports = {
    registrarUsuario,
    loginUsuario,
};