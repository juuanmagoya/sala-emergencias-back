"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const auth_service_1 = require("../../../services/auth.service");
const auth_controller_1 = require("../../../controllers/auth.controller");
const ErrorConfiguracion_1 = __importDefault(require("../../../utils/ErrorConfiguracion"));
// Secreto por defecto para los tests que no evalúan la configuración.
process.env.JWT_SECRET ??= 'secreto-de-prueba-login';
const modelo = Usuario_1.default;
const findOneOriginal = modelo.findOne;
(0, node_test_1.afterEach)(() => {
    modelo.findOne = findOneOriginal;
});
const crearUsuarioPersistido = async (rol, passwordPlano = 'secreto123', medico) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    nombre: 'Usuario de prueba',
    email: 'usuario@prueba.com',
    password: await bcryptjs_1.default.hash(passwordPlano, 4),
    rol,
    medico,
});
const guardarJwtSecret = () => process.env.JWT_SECRET;
const restaurarJwtSecret = (valor) => {
    if (valor === undefined) {
        delete process.env.JWT_SECRET;
        return;
    }
    process.env.JWT_SECRET = valor;
};
const crearRespuestaFalsa = () => {
    const respuesta = {
        statusCode: 0,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        json(cuerpo) {
            this.cuerpo = cuerpo;
            return this;
        },
    };
    return respuesta;
};
// ============================================================
// INICIO DE SESIÓN
// ============================================================
(0, node_test_1.test)('el login devuelve un token con el rol real y sin la contraseña', async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba-login';
    const usuarioPersistido = await crearUsuarioPersistido('medico');
    modelo.findOne = async () => usuarioPersistido;
    const resultado = await (0, auth_service_1.loginUsuario)({
        email: usuarioPersistido.email,
        password: 'secreto123',
    });
    strict_1.default.equal(resultado.usuario.rol, 'medico');
    const decodificado = jsonwebtoken_1.default.decode(resultado.token);
    if (decodificado === null || typeof decodificado === 'string') {
        strict_1.default.fail('El token no contiene un payload válido');
    }
    strict_1.default.equal(decodificado.rol, 'medico');
    strict_1.default.equal(decodificado.tipo, 'usuario');
    strict_1.default.equal(decodificado.email, usuarioPersistido.email);
    strict_1.default.equal(decodificado.id, usuarioPersistido._id.toString());
    strict_1.default.equal('password' in decodificado, false);
    strict_1.default.equal('rol' in decodificado, true);
});
(0, node_test_1.test)('el login rechaza una contraseña incorrecta', async () => {
    const usuarioPersistido = await crearUsuarioPersistido('admin');
    modelo.findOne = async () => usuarioPersistido;
    await strict_1.default.rejects((0, auth_service_1.loginUsuario)({
        email: usuarioPersistido.email,
        password: 'contraseña-incorrecta',
    }), /Credenciales inválidas/);
});
(0, node_test_1.test)('el login rechaza un usuario inexistente', async () => {
    modelo.findOne = async () => null;
    await strict_1.default.rejects((0, auth_service_1.loginUsuario)({
        email: 'inexistente@prueba.com',
        password: 'secreto123',
    }), /Credenciales inválidas/);
});
(0, node_test_1.test)('el login rechaza un usuario persistido con rol inválido', async () => {
    const usuarioPersistido = await crearUsuarioPersistido('medico');
    modelo.findOne = async () => ({
        ...usuarioPersistido,
        rol: 'superadmin',
    });
    await strict_1.default.rejects((0, auth_service_1.loginUsuario)({
        email: usuarioPersistido.email,
        password: 'secreto123',
    }), /El usuario no tiene un rol válido/);
});
(0, node_test_1.test)('el login rechaza una cuenta desactivada', async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba-login';
    const usuarioPersistido = await crearUsuarioPersistido('recepcionista');
    modelo.findOne = async () => ({
        ...usuarioPersistido,
        activo: false,
    });
    await strict_1.default.rejects((0, auth_service_1.loginUsuario)({
        email: usuarioPersistido.email,
        password: 'secreto123',
    }), /El usuario está desactivado/);
});
(0, node_test_1.test)('el login incluye el perfil médico asociado en el token', async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba-login';
    const medicoId = new mongoose_1.default.Types.ObjectId();
    const usuarioPersistido = await crearUsuarioPersistido('medico', 'secreto123', medicoId);
    modelo.findOne = async () => usuarioPersistido;
    const resultado = await (0, auth_service_1.loginUsuario)({
        email: usuarioPersistido.email,
        password: 'secreto123',
    });
    strict_1.default.equal(resultado.usuario.medico, medicoId.toString());
    const decodificado = jsonwebtoken_1.default.decode(resultado.token);
    if (decodificado === null || typeof decodificado === 'string') {
        strict_1.default.fail('El token no contiene un payload válido');
    }
    strict_1.default.equal(decodificado.medico, medicoId.toString());
});
(0, node_test_1.test)('el login no inventa un perfil médico inexistente', async () => {
    process.env.JWT_SECRET = 'secreto-de-prueba-login';
    const usuarioPersistido = await crearUsuarioPersistido('recepcionista');
    modelo.findOne = async () => usuarioPersistido;
    const resultado = await (0, auth_service_1.loginUsuario)({
        email: usuarioPersistido.email,
        password: 'secreto123',
    });
    strict_1.default.equal(resultado.usuario.medico, null);
    const decodificado = jsonwebtoken_1.default.decode(resultado.token);
    if (decodificado === null || typeof decodificado === 'string') {
        strict_1.default.fail('El token no contiene un payload válido');
    }
    strict_1.default.equal('medico' in decodificado, false);
});
// ============================================================
// CONFIGURACIÓN DE JWT
// ============================================================
(0, node_test_1.test)('el login trata la ausencia de JWT_SECRET como error de configuración', async () => {
    const secretoOriginal = guardarJwtSecret();
    delete process.env.JWT_SECRET;
    try {
        modelo.findOne = async () => null;
        await strict_1.default.rejects((0, auth_service_1.loginUsuario)({
            email: 'usuario@prueba.com',
            password: 'secreto123',
        }), (error) => {
            strict_1.default.ok(error instanceof ErrorConfiguracion_1.default);
            strict_1.default.match(error.message, /JWT_SECRET no está configurado/);
            return true;
        });
    }
    finally {
        restaurarJwtSecret(secretoOriginal);
    }
});
(0, node_test_1.test)('el controller de login responde 500 y no 401 si falta JWT_SECRET', async () => {
    const secretoOriginal = guardarJwtSecret();
    delete process.env.JWT_SECRET;
    try {
        const respuestaFalsa = crearRespuestaFalsa();
        await (0, auth_controller_1.login)({
            body: {
                email: 'usuario@prueba.com',
                password: 'secreto123',
            },
        }, respuestaFalsa);
        strict_1.default.equal(respuestaFalsa.statusCode, 500);
        strict_1.default.equal(respuestaFalsa.cuerpo?.success, false);
        strict_1.default.equal(respuestaFalsa.cuerpo?.message, 'Error interno del servidor');
        // No se expone el nombre de la variable ni detalles de configuración.
        strict_1.default.equal(String(respuestaFalsa.cuerpo?.message).includes('JWT_SECRET'), false);
        strict_1.default.equal(typeof respuestaFalsa.cuerpo?.timestamp, 'string');
        strict_1.default.ok('total' in (respuestaFalsa.cuerpo ?? {}));
        strict_1.default.ok('data' in (respuestaFalsa.cuerpo ?? {}));
    }
    finally {
        restaurarJwtSecret(secretoOriginal);
    }
});
