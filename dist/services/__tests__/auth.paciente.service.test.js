"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const Paciente_1 = __importDefault(require("../../modules/pacientes/models/Paciente"));
const Usuario_1 = __importDefault(require("../../modules/usuario/models/Usuario"));
const auth_service_1 = require("../auth.service");
const ErrorConfiguracion_1 = __importDefault(require("../../utils/ErrorConfiguracion"));
const credencialesPaciente_1 = require("../../utils/credencialesPaciente");
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-paciente';
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
const crearConsulta = (resultado) => {
    const consulta = Promise.resolve(resultado);
    consulta.select = () => consulta;
    consulta.limit = () => consulta;
    return consulta;
};
const modeloPaciente = Paciente_1.default;
const findOriginal = modeloPaciente.find;
(0, node_test_1.afterEach)(() => {
    modeloPaciente.find = findOriginal;
    process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
});
const crearPaciente = (telefono = {
    tipo: 'CELULAR',
    codigoArea: '3777',
    numero: '1234567',
}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    nombre: 'PACIENTE DE PRUEBA',
    telefono,
});
const decodificarToken = (token) => {
    const decodificado = jsonwebtoken_1.default.decode(token);
    if (decodificado === null || typeof decodificado === 'string') {
        strict_1.default.fail('El token no contiene un payload válido');
    }
    return decodificado;
};
// ============================================================
// LOGIN EXITOSO
// ============================================================
(0, node_test_1.test)('el login de paciente devuelve un JWT de tipo paciente y sin datos personales', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    const resultado = await (0, auth_service_1.loginPaciente)({
        dni: '30.123.456',
        telefono: '3777-1234567',
    });
    strict_1.default.equal(resultado.paciente.id, paciente._id.toString());
    strict_1.default.equal(resultado.paciente.nombre, paciente.nombre);
    strict_1.default.equal(resultado.paciente.rol, 'paciente');
    strict_1.default.equal('dni' in resultado.paciente, false);
    strict_1.default.equal('telefono' in resultado.paciente, false);
    strict_1.default.equal('email' in resultado.paciente, false);
    const decodificado = decodificarToken(resultado.token);
    strict_1.default.equal(decodificado.tipo, 'paciente');
    strict_1.default.equal(decodificado.rol, 'paciente');
    strict_1.default.equal(decodificado.id, paciente._id.toString());
    strict_1.default.equal('dni' in decodificado, false);
    strict_1.default.equal('telefono' in decodificado, false);
    strict_1.default.equal('email' in decodificado, false);
    strict_1.default.equal('medico' in decodificado, false);
    strict_1.default.equal(Number(decodificado.exp) - Number(decodificado.iat), 5 * 60 * 60);
    strict_1.default.ok(jsonwebtoken_1.default.verify(resultado.token, JWT_SECRET_PRUEBA));
});
(0, node_test_1.test)('acepta variantes de formato del teléfono sin modificar la base', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    const variantes = [
        '37771234567',
        '3777-1234567',
        '+54 3777 1234567',
        '+54 9 3777 1234567',
        '03777 1234567',
        '3777 15 1234567',
    ];
    for (const telefono of variantes) {
        const resultado = await (0, auth_service_1.loginPaciente)({
            dni: '30123456',
            telefono,
        });
        strict_1.default.equal(resultado.paciente.id, paciente._id.toString());
    }
});
(0, node_test_1.test)('normaliza el DNI, limita la consulta y proyecta solo datos necesarios', async () => {
    const paciente = crearPaciente();
    let filtro;
    let proyeccion;
    let limite;
    const consulta = crearConsulta([paciente]);
    consulta.select = (campos) => {
        proyeccion = campos;
        return consulta;
    };
    consulta.limit = (cantidad) => {
        limite = cantidad;
        return consulta;
    };
    modeloPaciente.find = (filtroRecibido) => {
        filtro = filtroRecibido;
        return consulta;
    };
    await (0, auth_service_1.loginPaciente)({
        dni: '01234567',
        telefono: '3777-1234567',
    });
    strict_1.default.deepEqual(filtro, {
        dni: { $in: ['01234567', '1234567'] },
    });
    strict_1.default.equal(proyeccion, 'nombre telefono');
    strict_1.default.equal(limite, 2);
});
// ============================================================
// CREDENCIALES INCORRECTAS
// ============================================================
(0, node_test_1.test)('rechaza un DNI inexistente con un mensaje genérico', async () => {
    modeloPaciente.find = () => crearConsulta([]);
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: '3777-1234567',
    }), (error) => {
        strict_1.default.ok(error instanceof Error);
        strict_1.default.equal(error.message, 'DNI o teléfono incorrectos');
        strict_1.default.equal(error.statusCode, 401);
        return true;
    });
});
(0, node_test_1.test)('rechaza un teléfono incorrecto sin revelar si el DNI existe', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: '3777-9999999',
    }), /DNI o teléfono incorrectos/);
});
(0, node_test_1.test)('rechaza el teléfono de otro paciente', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: '3777-7654321',
    }), /DNI o teléfono incorrectos/);
});
(0, node_test_1.test)('rechaza datos ambiguos si el DNI coincide con más de un documento', async () => {
    modeloPaciente.find = () => crearConsulta([crearPaciente(), crearPaciente()]);
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: '3777-1234567',
    }), /DNI o teléfono incorrectos/);
});
(0, node_test_1.test)('rechaza una ficha sin teléfono con el mismo error genérico', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([{ ...paciente, telefono: undefined }]);
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: '3777-1234567',
    }), /DNI o teléfono incorrectos/);
});
(0, node_test_1.test)('rechaza una ficha con teléfono legacy no estructurado', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([{ ...paciente, telefono: '3777-1234567' }]);
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: '3777-1234567',
    }), /DNI o teléfono incorrectos/);
});
(0, node_test_1.test)('rechaza un DNI con formato inválido', async () => {
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '123',
        telefono: '3777-1234567',
    }), /El DNI no es válido/);
});
(0, node_test_1.test)('rechaza un teléfono con formato inválido', async () => {
    await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: 'sin-numeros',
    }), /El teléfono no es válido/);
});
// ============================================================
// SEGURIDAD
// ============================================================
(0, node_test_1.test)('el login de paciente no modifica el documento del paciente', async () => {
    const paciente = crearPaciente();
    const copia = JSON.parse(JSON.stringify(paciente));
    modeloPaciente.find = () => crearConsulta([paciente]);
    await (0, auth_service_1.loginPaciente)({
        dni: '30123456',
        telefono: '3777-1234567',
    });
    strict_1.default.deepEqual(JSON.parse(JSON.stringify(paciente)), copia);
});
(0, node_test_1.test)('el login de paciente no crea documentos en Usuario', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    const modeloUsuario = Usuario_1.default;
    const createOriginal = modeloUsuario.create;
    let creaciones = 0;
    modeloUsuario.create = async () => {
        creaciones += 1;
        return {};
    };
    try {
        await (0, auth_service_1.loginPaciente)({
            dni: '30123456',
            telefono: '3777-1234567',
        });
    }
    finally {
        modeloUsuario.create = createOriginal;
    }
    strict_1.default.equal(creaciones, 0);
});
(0, node_test_1.test)('no acepta solo el número sin código de área', () => {
    const variantes = (0, credencialesPaciente_1.normalizarTelefono)('1234567');
    strict_1.default.equal((0, credencialesPaciente_1.coincideTelefono)(variantes, {
        tipo: 'CELULAR',
        codigoArea: '3777',
        numero: '1234567',
    }), false);
});
(0, node_test_1.test)('normalizarDni descarta valores que no son texto', () => {
    strict_1.default.deepEqual((0, credencialesPaciente_1.normalizarDni)(undefined), []);
    strict_1.default.deepEqual((0, credencialesPaciente_1.normalizarDni)(30123456), []);
});
(0, node_test_1.test)('el login de paciente trata la ausencia de JWT_SECRET como error de configuración', async () => {
    const secretoOriginal = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
        await strict_1.default.rejects((0, auth_service_1.loginPaciente)({
            dni: '30123456',
            telefono: '3777-1234567',
        }), (error) => error instanceof ErrorConfiguracion_1.default);
    }
    finally {
        process.env.JWT_SECRET = secretoOriginal;
    }
});
