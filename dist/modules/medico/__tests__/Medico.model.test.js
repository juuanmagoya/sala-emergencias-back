"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../models/Medico"));
// ============================================================
// HELPERS
// ============================================================
const crearMedico = (datos = {}) => new Medico_1.default({
    nombre: 'ANA',
    apellido: 'PEREZ',
    matricula: '123456',
    email: 'ana@example.com',
    telefono: {
        codigoArea: '11',
        numero: '12345678',
    },
    especialidades: [new mongoose_1.default.Types.ObjectId()],
    duracionTurno: 30,
    ...datos,
});
const obtenerIndices = () => Medico_1.default.schema.indexes();
// ============================================================
// ESPECIALIDADES
// ============================================================
(0, node_test_1.default)('valida un médico con una sola especialidad', async () => {
    const medico = crearMedico();
    await medico.validate();
    strict_1.default.equal(medico.especialidades.length, 1);
});
(0, node_test_1.default)('valida un médico con varias especialidades', async () => {
    const medico = crearMedico({
        especialidades: [
            new mongoose_1.default.Types.ObjectId(),
            new mongoose_1.default.Types.ObjectId(),
            new mongoose_1.default.Types.ObjectId(),
        ],
    });
    await medico.validate();
    strict_1.default.equal(medico.especialidades.length, 3);
});
(0, node_test_1.default)('rechaza un array de especialidades vacío', async () => {
    const medico = crearMedico({ especialidades: [] });
    await strict_1.default.rejects(() => medico.validate(), (error) => error instanceof mongoose_1.default.Error.ValidationError &&
        error.errors['especialidades']?.message ===
            'El médico debe tener al menos una especialidad');
});
(0, node_test_1.default)('rechaza especialidades repetidas', async () => {
    const especialidadId = new mongoose_1.default.Types.ObjectId();
    const medico = crearMedico({
        especialidades: [especialidadId, especialidadId],
    });
    await strict_1.default.rejects(() => medico.validate(), (error) => error instanceof mongoose_1.default.Error.ValidationError &&
        error.errors['especialidades']?.message ===
            'No se puede repetir la misma especialidad');
});
(0, node_test_1.default)('el schema admite un documento hidratado sin `especialidades`', async () => {
    const medico = new Medico_1.default({
        nombre: 'LEGACY',
        apellido: 'PEREZ',
        matricula: '654321',
        email: 'legacy@example.com',
        telefono: {
            codigoArea: '11',
            numero: '12345678',
        },
        duracionTurno: 30,
    });
    await medico.validate();
    strict_1.default.equal(medico.especialidades, undefined);
});
// ============================================================
// RESPUESTA
// ============================================================
(0, node_test_1.default)('`toJSON` expone `especialidades` y descarta el campo heredado', () => {
    const primera = new mongoose_1.default.Types.ObjectId();
    const segunda = new mongoose_1.default.Types.ObjectId();
    const medico = Medico_1.default.hydrate({
        _id: new mongoose_1.default.Types.ObjectId(),
        especialidades: [primera, segunda],
        // Campo obsoleto que pueden conservar documentos viejos.
        especialidad: primera,
    });
    const json = medico.toJSON();
    strict_1.default.equal('especialidad' in json, false);
    strict_1.default.deepEqual(json.especialidades.map(String), [String(primera), String(segunda)]);
    strict_1.default.ok(json.id);
    strict_1.default.equal('_id' in json, false);
    strict_1.default.equal('__v' in json, false);
});
// ============================================================
// ÍNDICES
// ============================================================
(0, node_test_1.default)('declara un índice multikey sobre `especialidades`', () => {
    const indices = obtenerIndices();
    const tieneIndice = indices.some(([campos]) => Object.keys(campos).length === 1 &&
        campos.especialidades === 1);
    const tieneIndiceEscalar = indices.some(([campos]) => 'especialidad' in campos);
    strict_1.default.equal(tieneIndice, true);
    strict_1.default.equal(tieneIndiceEscalar, false);
});
(0, node_test_1.default)('el schema no define el campo ni el virtual `especialidad`', () => {
    strict_1.default.ok(Medico_1.default.schema.path('especialidades'));
    strict_1.default.equal(Medico_1.default.schema.path('especialidad'), undefined);
    strict_1.default.equal(Medico_1.default.schema.virtuals['especialidad'], undefined);
});
