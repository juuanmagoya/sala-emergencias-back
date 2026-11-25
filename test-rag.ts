
import 'dotenv/config';
import mongoose from 'mongoose';

import connectDB from './src/config/database.js';

import {
  generarRespuestaRAG,
} from './src/modules/chatbot/services/rag.service.js';

const ejecutarPrueba = async (): Promise<void> => {
  try {
    console.log('\n========================================');
    console.log(' TEST RAG SERVICE');
    console.log('========================================\n');

    // 1. Verificar variables de entorno
    if (!process.env.DATABASE_URL_ATLAS) {
      throw new Error('Falta configurar DATABASE_URL_ATLAS');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Falta configurar GEMINI_API_KEY');
    }

    if (!process.env.GROQ_API_KEY) {
      throw new Error('Falta configurar GROQ_API_KEY');
    }

    console.log('Variables de entorno verificadas.');

    // 2. Conectar a MongoDB
    console.log('\nConectando a MongoDB Atlas...');

    await connectDB();

    console.log('Conexión establecida correctamente.');

    // 3. Pregunta de prueba
    const pregunta = '¿Qué puedo hacer si tengo tos?';

    console.log('\n========================================');
    console.log(' PREGUNTA DEL PACIENTE');
    console.log('========================================\n');

    console.log(pregunta);

    // 4. Ejecutar RAG
    console.log('\nIniciando generación de respuesta...');

    const resultado = await generarRespuestaRAG(pregunta);

    // 5. Mostrar respuesta
    console.log('\n========================================');
    console.log(' RESPUESTA GENERADA');
    console.log('========================================\n');

    console.log(resultado.respuesta);

    // 6. Mostrar modelo utilizado
    console.log('\n========================================');
    console.log(' INFORMACIÓN DE GENERACIÓN');
    console.log('========================================\n');

    console.log('Modelo utilizado:', resultado.modeloUtilizado);

    // 7. Mostrar fuentes
    console.log('\n========================================');
    console.log(' FUENTES RECUPERADAS');
    console.log('========================================\n');

    if (resultado.fuentes.length === 0) {
      console.log('No se utilizaron fuentes.');
    } else {
      console.table(resultado.fuentes);
    }

    console.log('\n========================================');
    console.log(' PRUEBA RAG FINALIZADA');
    console.log('========================================');

  } catch (error) {
    console.error('\nError durante la prueba RAG:');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;

  } finally {
    if (mongoose.connection.readyState !== 0) {
      console.log('\nCerrando conexión con MongoDB...');

      await mongoose.disconnect();

      console.log('Conexión cerrada correctamente.');
    }
  }
};

ejecutarPrueba();
