"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const Consultorio_1 = __importDefault(require("../../consultorio/models/Consultorio"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Turno_1 = __importDefault(require("../../turnos/models/Turno"));
const Especialidad_1 = __importDefault(require("../models/Especialidad"));
const especialidad_service_1 = __importDefault(require("../services/especialidad.service"));
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const crearEspecialidad = () => ({
    _id: new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_ID),
    activo: true,
    save: node_test_1.mock.fn(async () => undefined),
});
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
(0, node_test_1.test)('detecta el uso por un médico mediante pertenencia al array', async () => {
    node_test_1.mock.method(Especialidad_1.default, 'findById', async () => crearEspecialidad());
    let filtroMedicos;
    node_test_1.mock.method(Medico_1.default, 'findOne', async (filtro) => {
        filtroMedicos = filtro;
        return { _id: new mongoose_1.default.Types.ObjectId() };
    });
    await strict_1.default.rejects(especialidad_service_1.default.toggleActivoEspecialidad(ESPECIALIDAD_ID), (error) => error instanceof Error &&
        error.message.includes('está siendo utilizada por uno o más médicos activos'));
    // La igualdad sobre un array multikey alcanza cualquier posición.
    strict_1.default.deepEqual(filtroMedicos, {
        especialidades: ESPECIALIDAD_ID,
        activo: true,
    });
});
(0, node_test_1.test)('también bloquea la eliminación por un médico que tiene la especialidad', async () => {
    node_test_1.mock.method(Especialidad_1.default, 'findById', async () => crearEspecialidad());
    let filtroMedicos;
    node_test_1.mock.method(Medico_1.default, 'findOne', async (filtro) => {
        filtroMedicos = filtro;
        return { _id: new mongoose_1.default.Types.ObjectId() };
    });
    await strict_1.default.rejects(especialidad_service_1.default.deleteEspecialidadPermanente(ESPECIALIDAD_ID), (error) => error instanceof Error &&
        error.message.includes('está siendo utilizada por uno o más médicos activos'));
    strict_1.default.deepEqual(filtroMedicos, {
        especialidades: ESPECIALIDAD_ID,
        activo: true,
    });
});
(0, node_test_1.test)('bloquea la desactivación si la usa un consultorio activo', async () => {
    node_test_1.mock.method(Especialidad_1.default, 'findById', async () => crearEspecialidad());
    node_test_1.mock.method(Medico_1.default, 'findOne', async () => null);
    node_test_1.mock.method(Consultorio_1.default, 'findOne', async () => ({ _id: new mongoose_1.default.Types.ObjectId() }));
    await strict_1.default.rejects(especialidad_service_1.default.toggleActivoEspecialidad(ESPECIALIDAD_ID), (error) => error instanceof Error &&
        error.message.includes('está siendo utilizada por uno o más consultorios activos'));
});
(0, node_test_1.test)('bloquea la desactivación si la usa un turno activo', async () => {
    node_test_1.mock.method(Especialidad_1.default, 'findById', async () => crearEspecialidad());
    node_test_1.mock.method(Medico_1.default, 'findOne', async () => null);
    node_test_1.mock.method(Consultorio_1.default, 'findOne', async () => null);
    node_test_1.mock.method(Turno_1.default, 'findOne', async () => ({ _id: new mongoose_1.default.Types.ObjectId() }));
    await strict_1.default.rejects(especialidad_service_1.default.toggleActivoEspecialidad(ESPECIALIDAD_ID), (error) => error instanceof Error &&
        error.message.includes('está siendo utilizada por uno o más turnos activos'));
});
