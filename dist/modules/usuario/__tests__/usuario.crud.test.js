"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const usuario_service_1 = __importDefault(require("../services/usuario.service"));
// ============================================================
// HELPERS
// ============================================================
const crearConsulta = (resultado) => {
    const consulta = Promise.resolve(resultado);
    consulta.select = () => consulta;
    consulta.populate = () => consulta;
    consulta.sort = () => consulta;
    return consulta;
};
const crearUsuarioBase = (datos = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    nombre: 'Usuario de prueba',
    email: 'usuario@prueba.com',
    password: 'hash-de-prueba',
    rol: 'recepcionista',
    activo: true,
    ...datos,
});
const obtenerError = async (promesa) => {
    try {
        await promesa;
    }
    catch (error) {
        return error;
    }
    strict_1.default.fail('Se esperaba un error');
};
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
// ============================================================
// CREACIÓN
// ============================================================
(0, node_test_1.test)('rechaza crear un usuario con rol admin', async () => {
    const error = await obtenerError(usuario_service_1.default.createUsuario({
        nombre: 'Admin',
        email: 'admin@prueba.com',
        password: 'secreto123',
        rol: 'admin',
    }));
    strict_1.default.equal(error.statusCode, 400);
    strict_1.default.match(error.message, /rol debe ser medico o recepcionista/);
});
(0, node_test_1.test)('exige un médico cuando el rol es medico', async () => {
    const error = await obtenerError(usuario_service_1.default.createUsuario({
        nombre: 'Médico',
        email: 'medico@prueba.com',
        password: 'secreto123',
        rol: 'medico',
    }));
    strict_1.default.equal(error.statusCode, 400);
    strict_1.default.match(error.message, /médico es obligatorio/);
});
(0, node_test_1.test)('rechaza asociar un médico a un recepcionista', async () => {
    const error = await obtenerError(usuario_service_1.default.createUsuario({
        nombre: 'Recepción',
        email: 'recepcion@prueba.com',
        password: 'secreto123',
        rol: 'recepcionista',
        medico: new mongoose_1.default.Types.ObjectId().toString(),
    }));
    strict_1.default.equal(error.statusCode, 400);
    strict_1.default.match(error.message, /no puede tener un médico asociado/);
});
(0, node_test_1.test)('hashea la contraseña y guarda la relación con el médico', async () => {
    const medicoId = new mongoose_1.default.Types.ObjectId();
    let datosCreados;
    node_test_1.mock.method(Medico_1.default, 'exists', async () => ({
        _id: medicoId,
    }));
    node_test_1.mock.method(Usuario_1.default, 'exists', async () => null);
    node_test_1.mock.method(Usuario_1.default, 'create', async (datos) => {
        datosCreados = datos;
        return {
            _id: new mongoose_1.default.Types.ObjectId(),
            ...datos,
        };
    });
    node_test_1.mock.method(usuario_service_1.default, 'getUsuarioById', async () => ({ id: 'usuario-creado' }));
    await usuario_service_1.default.createUsuario({
        nombre: '  Médico de prueba  ',
        email: 'MEDICO@PRUEBA.COM',
        password: 'secreto123',
        rol: 'medico',
        medico: medicoId.toString(),
    });
    strict_1.default.equal(datosCreados?.nombre, 'Médico de prueba');
    strict_1.default.equal(datosCreados?.email, 'medico@prueba.com');
    strict_1.default.equal(datosCreados?.rol, 'medico');
    strict_1.default.equal(String(datosCreados?.medico), medicoId.toString());
    strict_1.default.notEqual(datosCreados?.password, 'secreto123');
    strict_1.default.match(String(datosCreados?.password), /^\$2[aby]\$/);
    strict_1.default.equal(await bcryptjs_1.default.compare('secreto123', String(datosCreados?.password)), true);
});
(0, node_test_1.test)('rechaza un email duplicado', async () => {
    node_test_1.mock.method(Usuario_1.default, 'exists', async () => ({
        _id: new mongoose_1.default.Types.ObjectId(),
    }));
    const error = await obtenerError(usuario_service_1.default.createUsuario({
        nombre: 'Recepción',
        email: 'repetido@prueba.com',
        password: 'secreto123',
        rol: 'recepcionista',
    }));
    strict_1.default.equal(error.statusCode, 409);
    strict_1.default.match(error.message, /email ya está registrado/);
});
(0, node_test_1.test)('rechaza un médico ya asociado a otro usuario', async () => {
    const medicoId = new mongoose_1.default.Types.ObjectId();
    node_test_1.mock.method(Medico_1.default, 'exists', async () => ({
        _id: medicoId,
    }));
    node_test_1.mock.method(Usuario_1.default, 'exists', async (filtro) => filtro.medico
        ? { _id: new mongoose_1.default.Types.ObjectId() }
        : null);
    const error = await obtenerError(usuario_service_1.default.createUsuario({
        nombre: 'Médico',
        email: 'medico@prueba.com',
        password: 'secreto123',
        rol: 'medico',
        medico: medicoId.toString(),
    }));
    strict_1.default.equal(error.statusCode, 409);
    strict_1.default.match(error.message, /médico ya está asociado a otro usuario/);
});
(0, node_test_1.test)('traduce el duplicado del índice único ante solicitudes simultáneas', async () => {
    const medicoId = new mongoose_1.default.Types.ObjectId();
    node_test_1.mock.method(Medico_1.default, 'exists', async () => ({
        _id: medicoId,
    }));
    node_test_1.mock.method(Usuario_1.default, 'exists', async () => null);
    node_test_1.mock.method(Usuario_1.default, 'create', async () => {
        throw Object.assign(new Error('E11000 duplicate key'), {
            code: 11000,
            keyPattern: { medico: 1 },
        });
    });
    const error = await obtenerError(usuario_service_1.default.createUsuario({
        nombre: 'Médico',
        email: 'medico@prueba.com',
        password: 'secreto123',
        rol: 'medico',
        medico: medicoId.toString(),
    }));
    strict_1.default.equal(error.statusCode, 409);
    strict_1.default.match(error.message, /médico ya está asociado a otro usuario/);
});
// ============================================================
// ACTUALIZACIÓN
// ============================================================
(0, node_test_1.test)('al pasar de medico a recepcionista elimina la asociación', async () => {
    const usuario = crearUsuarioBase({
        rol: 'medico',
        medico: new mongoose_1.default.Types.ObjectId(),
    });
    let actualizacion;
    node_test_1.mock.method(Usuario_1.default, 'findById', () => crearConsulta(usuario));
    node_test_1.mock.method(Usuario_1.default, 'findByIdAndUpdate', (_id, datos) => {
        actualizacion = datos;
        return crearConsulta({
            ...usuario,
            rol: 'recepcionista',
            medico: undefined,
        });
    });
    await usuario_service_1.default.updateUsuario(usuario._id.toString(), { rol: 'recepcionista' });
    strict_1.default.equal(actualizacion?.$set?.rol, 'recepcionista');
    strict_1.default.equal(actualizacion?.$unset?.medico, 1);
    strict_1.default.equal('medico' in (actualizacion?.$set ?? {}), false);
});
(0, node_test_1.test)('al pasar de recepcionista a medico exige un médico', async () => {
    const usuario = crearUsuarioBase({
        rol: 'recepcionista',
    });
    node_test_1.mock.method(Usuario_1.default, 'findById', () => crearConsulta(usuario));
    const error = await obtenerError(usuario_service_1.default.updateUsuario(usuario._id.toString(), { rol: 'medico' }));
    strict_1.default.equal(error.statusCode, 400);
    strict_1.default.match(error.message, /médico es obligatorio/);
});
(0, node_test_1.test)('no permite modificar un usuario administrador', async () => {
    const usuario = crearUsuarioBase({ rol: 'admin' });
    node_test_1.mock.method(Usuario_1.default, 'findById', () => crearConsulta(usuario));
    const error = await obtenerError(usuario_service_1.default.updateUsuario(usuario._id.toString(), { nombre: 'Otro nombre' }));
    strict_1.default.equal(error.statusCode, 403);
    strict_1.default.match(error.message, /No se puede modificar un usuario administrador/);
});
// ============================================================
// BAJA LÓGICA
// ============================================================
(0, node_test_1.test)('desactivar un usuario no modifica su perfil médico', async () => {
    const medicoId = new mongoose_1.default.Types.ObjectId();
    const usuario = crearUsuarioBase({
        rol: 'medico',
        medico: medicoId,
    });
    let actualizacion;
    node_test_1.mock.method(Usuario_1.default, 'findById', () => crearConsulta(usuario));
    node_test_1.mock.method(Usuario_1.default, 'findByIdAndUpdate', (_id, datos) => {
        actualizacion = datos;
        return crearConsulta({
            ...usuario,
            activo: false,
        });
    });
    await usuario_service_1.default.desactivarUsuario(usuario._id.toString());
    strict_1.default.deepEqual(actualizacion, {
        $set: { activo: false },
    });
});
(0, node_test_1.test)('rechaza desactivar un usuario ya desactivado', async () => {
    const usuario = crearUsuarioBase({ activo: false });
    node_test_1.mock.method(Usuario_1.default, 'findById', () => crearConsulta(usuario));
    const error = await obtenerError(usuario_service_1.default.desactivarUsuario(usuario._id.toString()));
    strict_1.default.equal(error.statusCode, 409);
    strict_1.default.match(error.message, /ya está desactivado/);
});
// ============================================================
// MODELO Y SERIALIZACIÓN
// ============================================================
(0, node_test_1.test)('la cuenta se crea activa y nunca serializa la contraseña', async () => {
    const usuario = new Usuario_1.default({
        nombre: 'Recepción',
        email: 'recepcion@prueba.com',
        password: 'hash-de-prueba',
        rol: 'recepcionista',
    });
    await usuario.validate();
    const json = usuario.toJSON();
    strict_1.default.equal(json.activo, true);
    strict_1.default.equal(json.id.toString(), usuario._id.toString());
    strict_1.default.equal(json._id, undefined);
    strict_1.default.equal(json.__v, undefined);
    strict_1.default.equal(json.password, undefined);
});
