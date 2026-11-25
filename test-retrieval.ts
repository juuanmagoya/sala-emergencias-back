
import 'dotenv/config';
import mongoose from 'mongoose';

import connectDB from './src/config/database.js';

import {
  recuperarFragmentosRelevantes,
} from './src/modules/chatbot/services/retrieval.service.js';

const ejecutarPrueba = async (): Promise<void> => {
  try {
    console.log('\n========================================');
    console.log(' TEST RETRIEVAL SERVICE');
    console.log('========================================\n');

    if (!process.env.DATABASE_URL_ATLAS) {
      throw new Error('Falta configurar DATABASE_URL_ATLAS');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Falta configurar GEMINI_API_KEY');
    }

    // 1. Conectar a MongoDB
    console.log('Conectando a MongoDB Atlas...');
    await connectDB();

    console.log('Conexión establecida correctamente.');

    // 2. Pregunta de prueba
    const pregunta = '¿Qué puedo hacer si tengo tos?';

    console.log('\nPregunta:', pregunta);

    // 3. Recuperar fragmentos
    const resultados = await recuperarFragmentosRelevantes(
      pregunta,
      {
        limite: 5,
        incluirPendientes: true,
      }
    );

    // 4. Mostrar resultados
    console.log('\n========================================');
    console.log(' RESULTADOS DEL RETRIEVAL');
    console.log('========================================\n');

    if (resultados.length === 0) {
      console.log('No se encontraron fragmentos.');
      return;
    }

    console.log(`Fragmentos encontrados: ${resultados.length}\n`);

    console.table(
      resultados.map((fragmento) => ({
        articulo: fragmento.articuloId,
        chunk: fragmento.chunkId,
        categoria: fragmento.categoria,
        titulo: fragmento.titulo,
        similitud: fragmento.puntuacion.toFixed(4),
        estado: fragmento.estadoValidacion,
      }))
    );

    // 5. Mostrar contenido recuperado
    resultados.forEach((fragmento, indice) => {
      console.log(`\n========== RESULTADO ${indice + 1} ==========`);
      console.log('Artículo:', fragmento.articuloId);
      console.log('Chunk:', fragmento.chunkId);
      console.log('Título:', fragmento.titulo);
      console.log('Similitud:', fragmento.puntuacion.toFixed(4));
      console.log('\nContenido:');
      console.log(fragmento.contenido);
    });

    console.log('\n========================================');
    console.log(' PRUEBA FINALIZADA');
    console.log('========================================');

  } catch (error) {
    console.error('\nError durante la prueba:');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;

  } finally {
    if (mongoose.connection.readyState !== 0) {
      console.log('\nCerrando conexión...');
      await mongoose.disconnect();
      console.log('Conexión cerrada.');
    }
  }
};

ejecutarPrueba();
