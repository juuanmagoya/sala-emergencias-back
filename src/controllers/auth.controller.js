const {
    registrarUsuario,
    loginUsuario,
} = require('../services/auth.service');

const registrar = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y password son obligatorios',
            });
        }

        const usuario = await registrarUsuario({
            nombre,
            email,
            password,
        });

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente',
            data: usuario,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son obligatorios',
            });
        }

        const resultado = await loginUsuario({
            email,
            password,
        });

        return res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: resultado,
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    registrar,
    login,
};