require('dotenv').config();

const bcrypt = require('bcryptjs');

const connectDB = require('../config/database');
const Usuario = require('../models/Usuario');

const crearUsuario = async () => {
    try {
        await connectDB();

        const email = 'admin@sala.com';

        const usuarioExistente = await Usuario.findOne({
            email,
        });

        if (usuarioExistente) {
            console.log('El usuario ya existe.');
            process.exit(0);
        }

        const passwordHasheada = await bcrypt.hash(
            '123456',
            10
        );

        const usuario = await Usuario.create({
            nombre: 'Administrador',
            email,
            password: passwordHasheada,
            rol: 'admin',
        });

        console.log('======================================');
        console.log('Usuario creado correctamente');
        console.log('======================================');
        console.log(`Email: ${usuario.email}`);
        console.log('Password: 123456');
        console.log('Rol: admin');
        console.log('======================================');

        process.exit(0);

    } catch (error) {
        console.error('Error al crear usuario:', error);
        process.exit(1);
    }
};

crearUsuario();