import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, beforeEach, test, mock } from 'node:test';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../../../app';

import HistoriaClinicaModel from '../models/HistoriaClinica';
import MedicoModel from '../../medico/models/Medico';
import PacienteModel from '../../pacientes/models/Paciente';

// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-historias-clinicas';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
});

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// HELPERS
// ============================================================

const pacienteId = new mongoose.Types.ObjectId().toString();
const medicoId = new mongoose.Types.ObjectId().toString();

const crearToken = () =>
    jwt.sign(
        {
            id: new mongoose.Types.ObjectId().toString(),
            email: 'medico@prueba.com',
            rol: 'medico',
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const solicitarCreacion = (cuerpo: unknown) =>
    fetch(`${urlBase}/api/v1/historias-clinicas`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${crearToken()}`,
        },
        body: JSON.stringify(cuerpo),
    });

const crearConsulta = (resultado: unknown) => {
    const consulta = Promise.resolve(resultado) as Promise<unknown> & {
        populate: () => typeof consulta;
    };

    consulta.populate = () => consulta;

    return consulta;
};

let datosCreados: Record<string, any> | undefined;

beforeEach(() => {
    datosCreados = undefined;

    mock.method(
        PacienteModel as any,
        'exists',
        async () => ({ _id: pacienteId })
    );

    mock.method(
        MedicoModel as any,
        'exists',
        async () => ({ _id: medicoId })
    );

    mock.method(
        HistoriaClinicaModel as any,
        'create',
        async (datos: Record<string, any>) => {
            datosCreados = datos;

            return { _id: new mongoose.Types.ObjectId() };
        }
    );

    mock.method(
        HistoriaClinicaModel as any,
        'findById',
        () =>
            crearConsulta({
                ...datosCreados,
                paciente: { id: pacienteId, nombre: 'Paciente' },
                medico: { id: medicoId, nombre: 'Medico' },
            })
    );
});

// ============================================================
// CREACIÓN CON RECETARIO
// ============================================================

test('guarda un medicamento con todos sus campos en el recetario', async () => {
    const recetario = [
        {
            nombre: 'Ibuprofeno',
            dosis: '400 mg',
            frecuencia: 'Cada 8 horas',
            duracion: '5 días',
            indicaciones: 'Tomar después de las comidas',
        },
    ];

    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
        recetario,
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.ok(datosCreados);
    assert.deepEqual(datosCreados!.recetario, recetario);
    assert.deepEqual(cuerpo.data.recetario, recetario);
});

test('conserva medicamentos sin duración ni indicaciones', async () => {
    const recetario = [
        {
            nombre: 'Paracetamol',
            dosis: '500 mg',
            frecuencia: 'Cada 6 horas',
        },
    ];

    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
        recetario,
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.ok(datosCreados);
    assert.deepEqual(datosCreados!.recetario, recetario);
    assert.equal(cuerpo.data.recetario[0].duracion, undefined);
    assert.equal(cuerpo.data.recetario[0].indicaciones, undefined);
});

test('permite crear una historia clínica con recetario vacío', async () => {
    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
        recetario: [],
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.ok(datosCreados);
    assert.deepEqual(datosCreados!.recetario, []);
    assert.deepEqual(cuerpo.data.recetario, []);
});

test('permite crear una historia clínica sin enviar recetario', async () => {
    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
    });

    const cuerpo = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.ok(datosCreados);
    assert.deepEqual(datosCreados!.recetario, []);
    assert.deepEqual(cuerpo.data.recetario, []);
});
