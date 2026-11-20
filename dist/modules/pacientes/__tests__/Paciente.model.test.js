"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const mongoose_1 = __importDefault(require("mongoose"));
const Paciente_1 = __importDefault(require("../models/Paciente"));
// ============================================================
// HELPERS
// ============================================================
const crearPaciente = (datos = {}) => new Paciente_1.default({
    nombre: 'Paciente de prueba',
    dni: '12345678',
    telefono: {
        codigoArea: '11',
        numero: '12345678',
    },
    ...datos,
});
const obtenerIndices = () => Paciente_1.default.schema.indexes();
// ============================================================
// ALTA MÍNIMA
// ============================================================
(0, node_test_1.default)('valida un paciente con solo nombre, DNI y teléfono', async () => {
    const paciente = crearPaciente();
    await paciente.validate();
    strict_1.default.equal(paciente.email, undefined);
    strict_1.default.equal(paciente.direccion, undefined);
    strict_1.default.equal(paciente.obraSocial.nombre, 'NINGUNA');
    strict_1.default.equal(paciente.telefono.tipo, 'CELULAR');
});
(0, node_test_1.default)('mantiene los datos opcionales cuando se proporcionan', async () => {
    const paciente = crearPaciente({
        email: '  PACIENTE@EJEMPLO.COM  ',
        direccion: {
            calle: 'San Martín',
            numero: '123',
            barrio: 'Centro',
        },
        obraSocial: {
            nombre: 'OSDE',
            numeroAfiliado: '123456',
        },
    });
    await paciente.validate();
    strict_1.default.equal(paciente.email, 'paciente@ejemplo.com');
    strict_1.default.equal(paciente.direccion?.calle, 'San Martín');
    strict_1.default.equal(paciente.obraSocial.nombre, 'OSDE');
});
// ============================================================
// VALIDACIONES
// ============================================================
(0, node_test_1.default)('rechaza un DNI inválido', async () => {
    const paciente = crearPaciente({ dni: '123' });
    await strict_1.default.rejects(paciente.validate(), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors.dni);
        return true;
    });
});
(0, node_test_1.default)('rechaza un teléfono incompleto', async () => {
    const paciente = crearPaciente({
        telefono: { codigoArea: '11' },
    });
    await strict_1.default.rejects(paciente.validate(), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors['telefono.numero']);
        return true;
    });
});
(0, node_test_1.default)('rechaza un email con formato inválido', async () => {
    const paciente = crearPaciente({ email: 'no-es-un-email' });
    await strict_1.default.rejects(paciente.validate(), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors.email);
        return true;
    });
});
// ============================================================
// ÍNDICES
// ============================================================
(0, node_test_1.default)('define un índice único parcial para el email', () => {
    const indices = obtenerIndices();
    const indiceEmail = indices.find((indice) => indice[1].name === 'pacientes_email_unico');
    strict_1.default.ok(indiceEmail, 'Falta el índice parcial de email');
    const [campos, opciones] = indiceEmail;
    strict_1.default.deepEqual(campos, { email: 1 });
    strict_1.default.equal(opciones.unique, true);
    const filtro = opciones.partialFilterExpression;
    strict_1.default.deepEqual(filtro, { email: { $type: 'string' } });
});
(0, node_test_1.default)('no conserva un índice único simple sobre el email', () => {
    const indices = obtenerIndices();
    const indiceSimple = indices.find(([campos, opciones]) => {
        const esEmail = campos.email === 1;
        const esUnico = opciones.unique === true;
        return (esEmail &&
            esUnico &&
            !opciones.partialFilterExpression);
    });
    strict_1.default.equal(indiceSimple, undefined);
});
