"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const Especialidad_1 = __importDefault(require("../../especialidad/models/Especialidad"));
const Medico_1 = __importDefault(require("../models/Medico"));
const medico_service_1 = __importDefault(require("../services/medico.service"));
// ============================================================
// HELPERS
// ============================================================
const ESPECIALIDAD_A = '507f1f77bcf86cd799439012';
const ESPECIALIDAD_B = '507f1f77bcf86cd799439016';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const crearConsulta = (resultado, registro) => {
    const consulta = {
        select(campos) {
            if (registro) {
                registro.seleccion = campos;
            }
            return consulta;
        },
        populate(ruta, campos) {
            registro?.populates.push({ ruta, campos });
            return consulta;
        },
        sort() {
            return consulta;
        },
        then(resolver, rechazar) {
            return Promise.resolve(resultado).then(resolver, rechazar);
        },
    };
    return consulta;
};
const crearDatosMedico = (especialidades = [ESPECIALIDAD_A]) => ({
    nombre: 'ANA',
    apellido: 'PEREZ',
    matricula: '123456',
    especialidades,
    email: 'ana@example.com',
    telefono: {
        codigoArea: '11',
        numero: '12345678',
    },
    duracionTurno: 30,
});
const prepararCatalogo = (especialidades) => {
    const registro = { populates: [] };
    node_test_1.mock.method(Especialidad_1.default, 'find', () => crearConsulta(especialidades, registro));
    return registro;
};
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
// ============================================================
// CREACIÓN
// ============================================================
(0, node_test_1.test)('crea un médico con varias especialidades existentes y activas', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
        { _id: ESPECIALIDAD_B, activo: true },
    ]);
    let datosCreados;
    node_test_1.mock.method(Medico_1.default, 'create', async (datos) => {
        datosCreados = datos;
        return datos;
    });
    await medico_service_1.default.createMedico(crearDatosMedico([
        ESPECIALIDAD_A,
        ESPECIALIDAD_B,
    ]));
    strict_1.default.deepEqual(datosCreados?.especialidades, [
        ESPECIALIDAD_A,
        ESPECIALIDAD_B,
    ]);
});
(0, node_test_1.test)('rechaza un alta sin especialidades', async () => {
    await strict_1.default.rejects(() => medico_service_1.default.createMedico(crearDatosMedico([])), (error) => error instanceof Error &&
        error.message ===
            'El médico debe tener al menos una especialidad' &&
        error.statusCode === 400);
});
(0, node_test_1.test)('rechaza especialidades repetidas antes de consultar el catálogo', async () => {
    let consultoCatalogo = false;
    node_test_1.mock.method(Especialidad_1.default, 'find', () => {
        consultoCatalogo = true;
        return crearConsulta([]);
    });
    await strict_1.default.rejects(() => medico_service_1.default.createMedico(crearDatosMedico([
        ESPECIALIDAD_A,
        ESPECIALIDAD_A,
    ])), (error) => error instanceof Error &&
        error.message ===
            'No se puede repetir la misma especialidad');
    strict_1.default.equal(consultoCatalogo, false);
});
(0, node_test_1.test)('rechaza un ID de especialidad con formato inválido', async () => {
    await strict_1.default.rejects(() => medico_service_1.default.createMedico(crearDatosMedico(['no-es-un-objectid'])), (error) => error instanceof Error &&
        error.message ===
            'El ID de una de las especialidades no es válido');
});
(0, node_test_1.test)('rechaza una especialidad inexistente', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
    ]);
    await strict_1.default.rejects(() => medico_service_1.default.createMedico(crearDatosMedico([
        ESPECIALIDAD_A,
        ESPECIALIDAD_B,
    ])), (error) => error instanceof Error &&
        error.message ===
            'Una de las especialidades indicadas no existe');
});
(0, node_test_1.test)('rechaza una especialidad inactiva', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
        { _id: ESPECIALIDAD_B, activo: false },
    ]);
    await strict_1.default.rejects(() => medico_service_1.default.createMedico(crearDatosMedico([
        ESPECIALIDAD_A,
        ESPECIALIDAD_B,
    ])), (error) => error instanceof Error &&
        error.message ===
            'Una de las especialidades indicadas no está activa');
});
// ============================================================
// EDICIÓN
// ============================================================
(0, node_test_1.test)('actualiza el array completo de especialidades', async () => {
    prepararCatalogo([
        { _id: ESPECIALIDAD_A, activo: true },
        { _id: ESPECIALIDAD_B, activo: true },
    ]);
    node_test_1.mock.method(Medico_1.default, 'findById', async () => ({ _id: MEDICO_ID }));
    let datosActualizados;
    node_test_1.mock.method(Medico_1.default, 'findByIdAndUpdate', async (_id, datos) => {
        datosActualizados = datos;
        return datos;
    });
    await medico_service_1.default.updateMedico(MEDICO_ID, {
        especialidades: [ESPECIALIDAD_B],
    });
    strict_1.default.deepEqual(datosActualizados?.especialidades, [
        ESPECIALIDAD_B,
    ]);
});
(0, node_test_1.test)('no permite vaciar las especialidades en una edición', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => ({ _id: MEDICO_ID }));
    await strict_1.default.rejects(() => medico_service_1.default.updateMedico(MEDICO_ID, {
        especialidades: [],
    }), (error) => error instanceof Error &&
        error.message ===
            'El médico debe tener al menos una especialidad');
});
(0, node_test_1.test)('una edición sin `especialidades` no toca el array', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => ({ _id: MEDICO_ID }));
    let datosActualizados;
    node_test_1.mock.method(Medico_1.default, 'findByIdAndUpdate', async (_id, datos) => {
        datosActualizados = datos;
        return datos;
    });
    await medico_service_1.default.updateMedico(MEDICO_ID, {
        nombre: 'ANA MARIA',
    });
    strict_1.default.equal('especialidades' in (datosActualizados ?? {}), false);
});
// ============================================================
// CONSULTAS
// ============================================================
(0, node_test_1.test)('getMedicos filtra por pertenencia al array y popula especialidades', async () => {
    const registro = { populates: [] };
    node_test_1.mock.method(Medico_1.default, 'find', (filtro) => {
        registro.filtro = filtro;
        return crearConsulta([], registro);
    });
    await medico_service_1.default.getMedicos({
        especialidad: ESPECIALIDAD_A,
    });
    strict_1.default.deepEqual(registro.filtro, {
        especialidades: ESPECIALIDAD_A,
    });
    strict_1.default.deepEqual(registro.populates, [
        { ruta: 'especialidades', campos: undefined },
        { ruta: 'consultorios', campos: undefined },
    ]);
});
(0, node_test_1.test)('getMedicosDisponibles encuentra médicos por cualquiera de sus especialidades', async () => {
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta({ _id: ESPECIALIDAD_A }));
    const registro = { populates: [] };
    node_test_1.mock.method(Medico_1.default, 'find', (filtro) => {
        registro.filtro = filtro;
        return crearConsulta([], registro);
    });
    await medico_service_1.default.getMedicosDisponibles(ESPECIALIDAD_A);
    strict_1.default.deepEqual(registro.filtro, {
        especialidades: ESPECIALIDAD_A,
        activo: true,
    });
    strict_1.default.match(String(registro.seleccion), /especialidades/);
    strict_1.default.deepEqual(registro.populates, [
        { ruta: 'especialidades', campos: 'nombre' },
    ]);
});
(0, node_test_1.test)('getMedicosDisponibles rechaza una especialidad inexistente', async () => {
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta(null));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => null);
    await strict_1.default.rejects(() => medico_service_1.default.getMedicosDisponibles(ESPECIALIDAD_A), (error) => error instanceof Error &&
        error.message ===
            'La especialidad indicada no existe');
});
(0, node_test_1.test)('getMedicosDisponibles rechaza una especialidad inactiva', async () => {
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta(null));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({ _id: ESPECIALIDAD_A }));
    await strict_1.default.rejects(() => medico_service_1.default.getMedicosDisponibles(ESPECIALIDAD_A), (error) => error instanceof Error &&
        error.message === 'La especialidad no está activa');
});
(0, node_test_1.test)('getMedicos no completa especialidades desde el campo heredado', async () => {
    const legado = Medico_1.default.hydrate({
        _id: new mongoose_1.default.Types.ObjectId(MEDICO_ID),
        especialidad: new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_A),
    });
    const registro = { populates: [] };
    node_test_1.mock.method(Medico_1.default, 'find', () => crearConsulta([legado], registro));
    const populatesManuales = [];
    node_test_1.mock.method(Medico_1.default, 'populate', async (_docs, opciones) => {
        populatesManuales.push(opciones);
        return _docs;
    });
    const medicos = await medico_service_1.default.getMedicos({});
    strict_1.default.equal(medicos[0].especialidades, undefined);
    strict_1.default.deepEqual(populatesManuales, []);
});
