"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const express_1 = __importDefault(require("express"));
const limitadorLogin_middleware_1 = require("../limitadorLogin.middleware");
const crearServidor = (estado, limite) => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.post('/login', (0, limitadorLogin_middleware_1.crearLimitadorLogin)({ limite, ventanaMs: 60_000 }), (_req, res) => res.status(estado).json({ success: estado < 400 }));
    const servidor = app.listen(0);
    const { port } = servidor.address();
    return {
        urlBase: `http://127.0.0.1:${port}`,
        cerrar: () => servidor.close(),
    };
};
const intentarLogin = (urlBase) => fetch(`${urlBase}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
        email: 'prueba@sala.com',
        password: 'incorrecta',
    }),
});
// ============================================================
// LÍMITE DE INTENTOS
// ============================================================
(0, node_test_1.test)('bloquea con 429 cuando se superan los intentos fallidos', async () => {
    const servidor = crearServidor(401, 3);
    try {
        const estados = [];
        for (let intento = 0; intento < 4; intento += 1) {
            const respuesta = await intentarLogin(servidor.urlBase);
            estados.push(respuesta.status);
            if (intento === 3) {
                const cuerpo = (await respuesta.json());
                strict_1.default.equal(cuerpo.success, false);
                strict_1.default.equal(cuerpo.data, null);
                strict_1.default.equal(typeof cuerpo.timestamp, 'string');
                strict_1.default.equal(typeof cuerpo.message, 'string');
                strict_1.default.match(String(cuerpo.message), /Demasiados intentos/);
            }
        }
        strict_1.default.deepEqual(estados, [401, 401, 401, 429]);
    }
    finally {
        servidor.cerrar();
    }
});
(0, node_test_1.test)('los inicios de sesión exitosos no consumen el límite', async () => {
    const servidor = crearServidor(200, 2);
    try {
        const estados = [];
        for (let intento = 0; intento < 5; intento += 1) {
            const respuesta = await intentarLogin(servidor.urlBase);
            estados.push(respuesta.status);
            // Deja que el limitador procese el decremento del éxito.
            await new Promise((resolver) => setTimeout(resolver, 10));
        }
        strict_1.default.deepEqual(estados, [200, 200, 200, 200, 200]);
    }
    finally {
        servidor.cerrar();
    }
});
