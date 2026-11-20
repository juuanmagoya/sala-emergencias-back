"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Usuario_1 = __importDefault(require("../models/Usuario"));
const modeloMedico = Medico_1.default;
const existsOriginal = modeloMedico.exists;
(0, node_test_1.afterEach)(() => {
    modeloMedico.exists = existsOriginal;
});
const crearUsuario = (datos = {}) => new Usuario_1.default({
    nombre: 'Usuario de prueba',
    email: 'usuario@prueba.com',
    password: 'secreto123',
    ...datos,
});
const obtenerErrorDeMedico = (error) => {
    if (!(error instanceof mongoose_1.default.Error.ValidationError)) {
        return null;
    }
    return error.errors.medico?.message ?? null;
};
// ============================================================
// RELACIÓN USUARIO - MÉDICO
// ============================================================
(0, node_test_1.test)('permite vincular un usuario médico con un perfil existente', async () => {
    const medicoId = new mongoose_1.default.Types.ObjectId();
    modeloMedico.exists = async () => ({ _id: medicoId });
    const usuario = crearUsuario({
        rol: 'medico',
        medico: medicoId,
    });
    await usuario.validate();
    strict_1.default.equal(usuario.medico?.toString(), medicoId.toString());
    // La relación es explícita: no se asume que los _id coincidan.
    strict_1.default.notEqual(usuario._id.toString(), medicoId.toString());
});
(0, node_test_1.test)('rechaza una referencia a un perfil médico inexistente', async () => {
    modeloMedico.exists = async () => null;
    const usuario = crearUsuario({
        rol: 'medico',
        medico: new mongoose_1.default.Types.ObjectId(),
    });
    await strict_1.default.rejects(usuario.validate(), (error) => {
        strict_1.default.equal(obtenerErrorDeMedico(error), 'El médico indicado no existe');
        return true;
    });
});
(0, node_test_1.test)('rechaza vincular un perfil médico a un usuario que no es médico', async () => {
    const medicoId = new mongoose_1.default.Types.ObjectId();
    modeloMedico.exists = async () => ({ _id: medicoId });
    const usuario = crearUsuario({
        rol: 'recepcionista',
        medico: medicoId,
    });
    await strict_1.default.rejects(usuario.validate(), (error) => {
        strict_1.default.match(String(obtenerErrorDeMedico(error)), /Solo un usuario con rol médico/);
        return true;
    });
});
(0, node_test_1.test)('permite usuarios médicos todavía sin perfil asociado', async () => {
    modeloMedico.exists = async () => {
        throw new Error('No debería consultarse la existencia de un médico');
    };
    const usuario = crearUsuario({ rol: 'medico' });
    await usuario.validate();
    strict_1.default.equal(usuario.medico, undefined);
});
(0, node_test_1.test)('rechaza un identificador de médico con formato inválido', async () => {
    modeloMedico.exists = async () => ({ _id: 'valor' });
    const usuario = crearUsuario({
        rol: 'medico',
        medico: 'no-es-un-object-id',
    });
    await strict_1.default.rejects(usuario.validate(), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors.medico);
        return true;
    });
});
(0, node_test_1.test)('define un índice único y sparse sobre el perfil médico', () => {
    const indices = Usuario_1.default.schema.indexes();
    const indiceMedico = indices.find(([campos]) => campos.medico === 1);
    strict_1.default.ok(indiceMedico, 'Falta el índice sobre el campo medico');
    strict_1.default.equal(indiceMedico[1].unique, true);
    strict_1.default.equal(indiceMedico[1].sparse, true);
});
