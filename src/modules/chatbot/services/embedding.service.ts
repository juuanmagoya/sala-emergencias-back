
import { GoogleGenAI } from '@google/genai';

import { TipoTareaEmbedding } from '../types/chatbot.types';

// ============================================
// CONFIGURACIÓN
// ============================================

const API_KEY = process.env.GEMINI_API_KEY;

const MODELO_EMBEDDING = 'gemini-embedding-001';

const DIMENSIONES_EMBEDDING = 768;

// ============================================
// CLIENTE GEMINI
// ============================================

if (!API_KEY) {
  throw new Error(
    'La variable GEMINI_API_KEY no está configurada'
  );
}

const genAI = new GoogleGenAI({
  apiKey: API_KEY,
});

// ============================================
// GENERAR EMBEDDING
// ============================================

export const generarEmbedding = async (
  texto: string,
  tarea: TipoTareaEmbedding
): Promise<number[]> => {
  const textoLimpio = texto.trim();

  if (!textoLimpio) {
    throw new Error('No se puede generar un embedding de texto vacío');
  }

  try {
    const respuesta = await genAI.models.embedContent({
      model: MODELO_EMBEDDING,
      contents: textoLimpio,
      config: {
        taskType: tarea,
        outputDimensionality: DIMENSIONES_EMBEDDING,
      },
    });

    const embedding = respuesta.embeddings?.[0]?.values;

    if (!embedding || embedding.length !== DIMENSIONES_EMBEDDING) {
      throw new Error(
        'Gemini devolvió un embedding con dimensiones incorrectas'
      );
    }

    return embedding;
  } catch (error) {
    console.error('Error generando embedding con Gemini:', error);

    throw new Error('No se pudo generar el embedding');
  }
};

// ============================================
// EXPORTAR CONFIGURACIÓN
// ============================================

export const EMBEDDING_CONFIG = {
  modelo: MODELO_EMBEDDING,
  dimensiones: DIMENSIONES_EMBEDDING,
};
