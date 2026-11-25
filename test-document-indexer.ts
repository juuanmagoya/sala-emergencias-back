
import 'dotenv/config';

import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import { indexarBaseConocimiento } from './src/modules/chatbot/services/document.service.js';

const ejecutarIndexacion = async (): Promise<void> => {
  try {
    console.log('\n========================================');
    console.log(' TEST DOCUMENT INDEXER');
    console.log('========================================\n');

    // 1. Verificar variables de entorno.

    if (!process.env.DATABASE_URL_ATLAS) {
      throw new Error('Falta configurar DATABASE_URL_ATLAS en el .env');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Falta configurar GEMINI_API_KEY en el .env');
    }

    console.log('Variables de entorno verificadas.');

    // 2. Conectar a MongoDB Atlas.

    console.log('\nConectando a MongoDB Atlas...');

    await connectDB();

    console.log('Conexión lista para indexar.');

    // 3. Ejecutar indexación.

    console.log('\nIniciando indexación de la base médica...');

    const resultado = await indexarBaseConocimiento();

    // 4. Mostrar resultado.

    console.log('\n========================================');
    console.log(' INDEXACIÓN COMPLETADA');
    console.log('========================================\n');

    console.table(resultado);

  } catch (error) {
    console.error('\nError durante la indexación:');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;

  } finally {
    // 5. Cerrar conexión.

    if (mongoose.connection.readyState !== 0) {
      console.log('\nCerrando conexión con MongoDB...');

      await mongoose.disconnect();

      console.log('Conexión cerrada correctamente.');
    }
  }
};

ejecutarIndexacion();
