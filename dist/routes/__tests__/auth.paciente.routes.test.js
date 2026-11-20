"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../app"));
const Paciente_1 = __importDefault(require("../../modules/pacientes/models/Paciente"));
const medico_service_1 = __importDefault(require("../../modules/medico/services/medico.service"));
const usuario_service_1 = __importDefault(require("../../modules/usuario/services/usuario.service"));
// ============================================================
// SERVIDOR REAL CON TODAS LAS RUTAS MONTADAS
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-paciente-rutas';
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
const servidor = app_1.default.listen(0);
const { port } = servidor.address();
const urlBase = `http://127.0.0.1:${port}`;
(0, node_test_1.after)(() => {
    servidor.close();
});
const crearConsulta = (resultado) => {
    const consulta = Promise.resolve(resultado);
    consulta.select = () => consulta;
    consulta.limit = () => consulta;
    return consulta;
};
const modeloPaciente = Paciente_1.default;
const originalesPaciente = {
    find: modeloPaciente.find,
    exists: modeloPaciente.exists,
};
const usuarios = usuario_service_1.default;
const medicos = medico_service_1.default;
const originalesUsuarios = { getUsuarios: usuarios.getUsuarios };
const originalesMedicos = { getMedicos: medicos.getMedicos };
(0, node_test_1.afterEach)(() => {
    modeloPaciente.find = originalesPaciente.find;
    modeloPaciente.exists = originalesPaciente.exists;
    usuarios.getUsuarios = originalesUsuarios.getUsuarios;
    medicos.getMedicos = originalesMedicos.getMedicos;
});
const crearPaciente = () => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    nombre: 'PACIENTE DE PRUEBA',
    telefono: {
        tipo: 'CELULAR',
        codigoArea: '3777',
        numero: '1234567',
    },
});
const crearTokenInterno = (rol, incluirTipo = false) => jsonwebtoken_1.default.sign({
    ...(incluirTipo ? { tipo: 'usuario' } : {}),
    id: '507f1f77bcf86cd799439011',
    email: 'prueba@sala.com',
    rol,
}, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const crearTokenPaciente = (id, rol = 'paciente', secreto = JWT_SECRET_PRUEBA) => jsonwebtoken_1.default.sign({
    tipo: 'paciente',
    id,
    rol,
}, secreto, { expiresIn: '1h' });
const solicitar = (metodo, ruta, opciones = {}) => {
    const headers = {};
    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }
    if (opciones.cuerpo !== undefined) {
        headers['content-type'] = 'application/json';
    }
    return fetch(`${urlBase}${ruta}`, {
        method: metodo,
        headers,
        body: opciones.cuerpo === undefined
            ? undefined
            : JSON.stringify(opciones.cuerpo),
    });
};
const leerCuerpo = async (respuesta) => (await respuesta.json());
const verificarFormatoEstandar = (cuerpo) => {
    strict_1.default.equal(typeof cuerpo.success, 'boolean');
    strict_1.default.equal(typeof cuerpo.timestamp, 'string');
    strict_1.default.equal(typeof cuerpo.message, 'string');
    strict_1.default.ok('total' in cuerpo);
    strict_1.default.ok('data' in cuerpo);
};
const habilitarPacienteExistente = () => {
    modeloPaciente.exists = async () => ({
        _id: new mongoose_1.default.Types.ObjectId(),
    });
};
// ============================================================
// ENDPOINT DE LOGIN DE PACIENTES
// ============================================================
(0, node_test_1.test)('el login de pacientes es público y exige DNI y teléfono', async () => {
    const respuesta = await solicitar('POST', '/api/v1/auth/paciente/login', { cuerpo: {} });
    const cuerpo = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 400);
    strict_1.default.equal(cuerpo.success, false);
    strict_1.default.equal(cuerpo.message, 'DNI y teléfono son obligatorios');
    verificarFormatoEstandar(cuerpo);
});
(0, node_test_1.test)('el login de pacientes devuelve un JWT y datos mínimos', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    const respuesta = await solicitar('POST', '/api/v1/auth/paciente/login', {
        cuerpo: {
            dni: '30123456',
            telefono: '3777-1234567',
        },
    });
    const cuerpo = await leerCuerpo(respuesta);
    const datos = cuerpo.data;
    const pacienteDevuelto = datos.paciente;
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(cuerpo.success, true);
    strict_1.default.equal(pacienteDevuelto.id, paciente._id.toString());
    strict_1.default.equal(pacienteDevuelto.nombre, paciente.nombre);
    strict_1.default.equal(pacienteDevuelto.rol, 'paciente');
    strict_1.default.equal('dni' in pacienteDevuelto, false);
    strict_1.default.equal('telefono' in pacienteDevuelto, false);
    strict_1.default.equal('email' in pacienteDevuelto, false);
    strict_1.default.equal('direccion' in pacienteDevuelto, false);
    const decodificado = jsonwebtoken_1.default.decode(String(datos.token));
    if (decodificado === null || typeof decodificado === 'string') {
        strict_1.default.fail('El token no contiene un payload válido');
    }
    strict_1.default.equal(decodificado.tipo, 'paciente');
    strict_1.default.equal(decodificado.rol, 'paciente');
    strict_1.default.equal(decodificado.id, paciente._id.toString());
    strict_1.default.equal('dni' in decodificado, false);
    strict_1.default.equal('telefono' in decodificado, false);
    strict_1.default.equal('email' in decodificado, false);
    verificarFormatoEstandar(cuerpo);
});
(0, node_test_1.test)('el login de paciente ignora email, contraseña, rol y tipo enviados por el cliente', async () => {
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    const respuesta = await solicitar('POST', '/api/v1/auth/paciente/login', {
        cuerpo: {
            dni: '30123456',
            telefono: '3777-1234567',
            email: 'otro@correo.com',
            password: 'no-se-usa',
            rol: 'admin',
            tipo: 'usuario',
        },
    });
    const cuerpo = await leerCuerpo(respuesta);
    const datos = cuerpo.data;
    const decodificado = jsonwebtoken_1.default.decode(String(datos.token));
    if (decodificado === null || typeof decodificado === 'string') {
        strict_1.default.fail('El token no contiene un payload válido');
    }
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(decodificado.rol, 'paciente');
    strict_1.default.equal(decodificado.tipo, 'paciente');
});
(0, node_test_1.test)('el login de pacientes responde igual ante DNI o teléfono incorrectos', async () => {
    modeloPaciente.find = () => crearConsulta([]);
    const porDni = await solicitar('POST', '/api/v1/auth/paciente/login', {
        cuerpo: {
            dni: '30123456',
            telefono: '3777-1234567',
        },
    });
    const cuerpoPorDni = await leerCuerpo(porDni);
    const paciente = crearPaciente();
    modeloPaciente.find = () => crearConsulta([paciente]);
    const porTelefono = await solicitar('POST', '/api/v1/auth/paciente/login', {
        cuerpo: {
            dni: '30123456',
            telefono: '3777-9999999',
        },
    });
    const cuerpoPorTelefono = await leerCuerpo(porTelefono);
    strict_1.default.equal(porDni.status, 401);
    strict_1.default.equal(porTelefono.status, 401);
    strict_1.default.equal(cuerpoPorDni.message, cuerpoPorTelefono.message);
    strict_1.default.equal(cuerpoPorDni.message, 'DNI o teléfono incorrectos');
    strict_1.default.equal(cuerpoPorDni.data, null);
    strict_1.default.equal(cuerpoPorTelefono.data, null);
});
// ============================================================
// AUTORIZACIÓN DE PACIENTES
// ============================================================
(0, node_test_1.test)('un token de paciente no accede a rutas administrativas ni de gestión', async () => {
    habilitarPacienteExistente();
    const token = crearTokenPaciente(new mongoose_1.default.Types.ObjectId().toString());
    const rutas = [
        '/api/v1/usuarios',
        '/api/v1/pacientes',
        '/api/v1/medicos',
        '/api/v1/turnos',
        '/api/v1/historias-clinicas',
        '/api/v1/consultorios',
        '/api/v1/especialidades',
    ];
    for (const ruta of rutas) {
        const respuesta = await solicitar('GET', ruta, { token });
        strict_1.default.equal(respuesta.status, 403, `Ruta inesperada: ${ruta}`);
    }
});
(0, node_test_1.test)('un token de paciente con un paciente inexistente es rechazado', async () => {
    modeloPaciente.exists = async () => null;
    const token = crearTokenPaciente(new mongoose_1.default.Types.ObjectId().toString());
    const respuesta = await solicitar('GET', '/api/v1/pacientes', {
        token,
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('un token de paciente no puede elevar su rol a administrador', async () => {
    habilitarPacienteExistente();
    const token = crearTokenPaciente(new mongoose_1.default.Types.ObjectId().toString(), 'admin');
    const respuesta = await solicitar('GET', '/api/v1/usuarios', {
        token,
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('un token interno no puede declararse paciente para saltar la autorización', async () => {
    const token = jsonwebtoken_1.default.sign({
        tipo: 'usuario',
        id: '507f1f77bcf86cd799439011',
        email: 'prueba@sala.com',
        rol: 'paciente',
    }, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
    const respuesta = await solicitar('GET', '/api/v1/usuarios', {
        token,
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('un token de paciente con un identificador inválido es rechazado', async () => {
    const token = crearTokenPaciente('paciente', 'no-es-un-objectid');
    const respuesta = await solicitar('GET', '/api/v1/pacientes', {
        token,
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('un token de paciente firmado con otro secreto es rechazado', async () => {
    habilitarPacienteExistente();
    const token = crearTokenPaciente(new mongoose_1.default.Types.ObjectId().toString(), 'paciente', 'otro-secreto');
    const respuesta = await solicitar('GET', '/api/v1/pacientes', {
        token,
    });
    strict_1.default.equal(respuesta.status, 401);
});
// ============================================================
// COMPATIBILIDAD CON USUARIOS INTERNOS
// ============================================================
(0, node_test_1.test)('los JWT internos legacy y nuevos siguen siendo reconocidos', async () => {
    usuarios.getUsuarios = async () => [];
    medicos.getMedicos = async () => [];
    const adminLegacy = await solicitar('GET', '/api/v1/usuarios', {
        token: crearTokenInterno('admin'),
    });
    const adminNuevo = await solicitar('GET', '/api/v1/usuarios', {
        token: crearTokenInterno('admin', true),
    });
    const medicoLegacy = await solicitar('GET', '/api/v1/medicos', {
        token: crearTokenInterno('medico'),
    });
    const recepcionistaLegacy = await solicitar('GET', '/api/v1/medicos', {
        token: crearTokenInterno('recepcionista'),
    });
    strict_1.default.equal(adminLegacy.status, 200);
    strict_1.default.equal(adminNuevo.status, 200);
    strict_1.default.equal(medicoLegacy.status, 200);
    strict_1.default.equal(recepcionistaLegacy.status, 200);
});
(0, node_test_1.test)('los permisos de los roles internos no cambiaron', async () => {
    usuarios.getUsuarios = async () => [];
    const medico = await solicitar('GET', '/api/v1/usuarios', {
        token: crearTokenInterno('medico'),
    });
    const recepcionista = await solicitar('GET', '/api/v1/usuarios', {
        token: crearTokenInterno('recepcionista'),
    });
    strict_1.default.equal(medico.status, 403);
    strict_1.default.equal(recepcionista.status, 403);
});
