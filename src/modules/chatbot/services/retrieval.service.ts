import type { IDocumentoConocimientoDocument } from '../types/chatbot.types';

import DocumentoConocimiento from '../models/DocumentoConocimiento';
import { generarEmbedding } from './embedding.service';

import type {
  CategoriaConocimiento,
  EstadoValidacionMedica,
} from '../types/chatbot.types';



// ============================================================
// CONFIGURACIÓN
// ============================================================

const DIMENSIONES_EMBEDDING = 768;
const RESULTADOS_POR_DEFECTO = 5;
const MAXIMO_RESULTADOS = 10;

// ============================================================
// TIPOS
// ============================================================

interface OpcionesRecuperacion {
  limite?: number;

  /**
   * Exclusivamente para pruebas técnicas internas.
   * Permite recuperar documentos pendientes de aprobación.
   *
   * No habilitar desde las rutas públicas del portal.
   */
  incluirPendientes?: boolean;
}

export interface FragmentoRecuperado {
  articuloId: string;
  chunkId: string;
  categoria: CategoriaConocimiento;
  titulo: string;
  resumen: string;
  contenido: string;
  palabrasClave: string[];
  estadoValidacion: EstadoValidacionMedica;
  habilitadoConsultaClinica: boolean;
  puntuacion: number;
}

// ============================================================
// SIMILITUD COSENO
// ============================================================

const calcularSimilitudCoseno = (
  vectorA: number[],
  vectorB: number[]
): number => {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Los vectores tienen dimensiones diferentes');
  }

  let productoPunto = 0;
  let magnitudA = 0;
  let magnitudB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    productoPunto += vectorA[i] * vectorB[i];

    magnitudA += vectorA[i] * vectorA[i];
    magnitudB += vectorB[i] * vectorB[i];
  }

  if (magnitudA === 0 || magnitudB === 0) {
    return 0;
  }

  return productoPunto / (Math.sqrt(magnitudA) * Math.sqrt(magnitudB));
};

// ============================================================
// RECUPERACIÓN DE INFORMACIÓN
// ============================================================

export const recuperarFragmentosRelevantes = async (
  pregunta: string,
  opciones: OpcionesRecuperacion = {}
): Promise<FragmentoRecuperado[]> => {

  // ----------------------------------------------------------
  // 1. Validar pregunta
  // ----------------------------------------------------------

  const preguntaLimpia = pregunta.trim();

  if (!preguntaLimpia) {
    throw new Error('La pregunta no puede estar vacía');
  }

  // ----------------------------------------------------------
  // 2. Configurar cantidad de resultados
  // ----------------------------------------------------------

  const limiteSolicitado =
    opciones.limite ?? RESULTADOS_POR_DEFECTO;

  const limite = Math.min(
    MAXIMO_RESULTADOS,
    Math.max(1, Math.floor(limiteSolicitado))
  );

  // ----------------------------------------------------------
  // 3. Generar embedding de la pregunta
  // ----------------------------------------------------------

  console.log('Generando embedding de la pregunta...');

  const embeddingPregunta = await generarEmbedding(
    preguntaLimpia,
    'RETRIEVAL_QUERY'
  );

  if (embeddingPregunta.length !== DIMENSIONES_EMBEDDING) {
    throw new Error(
      'El embedding de la pregunta tiene dimensiones incorrectas'
    );
  }

  // ----------------------------------------------------------
  // 4. Construir filtro de documentos
  // ----------------------------------------------------------

    const filtro = opciones.incluirPendientes
    ? {
        estadoValidacion: {
            $in: [
            'pendiente_revision_medica' as const,
            'aprobado' as const,
            ],
        },
        }
    : {
        estadoValidacion: 'aprobado' as const,
        habilitadoConsultaClinica: true,
        };

  // ----------------------------------------------------------
  // 5. Recuperar documentos desde MongoDB
  // ----------------------------------------------------------

  console.log('Consultando documentos de conocimiento...');

  const documentos = await DocumentoConocimiento.find(filtro)
    .select(
      '+embedding articuloId chunkId categoria titulo resumen contenido palabrasClave estadoValidacion habilitadoConsultaClinica'
    )
    .lean();

  if (documentos.length === 0) {
    console.log('No se encontraron documentos disponibles.');

    return [];
  }

  console.log(`Documentos recuperados: ${documentos.length}`);

  // ----------------------------------------------------------
  // 6. Calcular similitud coseno
  // ----------------------------------------------------------

  const resultados: FragmentoRecuperado[] = [];

  for (const documento of documentos) {
    const embeddingDocumento = documento.embedding;

    if (
      !embeddingDocumento ||
      embeddingDocumento.length !== DIMENSIONES_EMBEDDING
    ) {
      console.warn(
        `Embedding inválido en el documento ${documento.chunkId}`
      );

      continue;
    }

    const puntuacion = calcularSimilitudCoseno(
      embeddingPregunta,
      embeddingDocumento
    );

    resultados.push({
      articuloId: documento.articuloId,
      chunkId: documento.chunkId,
      categoria: documento.categoria,
      titulo: documento.titulo,
      resumen: documento.resumen,
      contenido: documento.contenido,
      palabrasClave: documento.palabrasClave,
      estadoValidacion: documento.estadoValidacion,
      habilitadoConsultaClinica: documento.habilitadoConsultaClinica,
      puntuacion,
    });
  }

  // ----------------------------------------------------------
  // 7. Ordenar por relevancia
  // ----------------------------------------------------------

  resultados.sort(
    (a, b) => b.puntuacion - a.puntuacion
  );

  // ----------------------------------------------------------
  // 8. Seleccionar los mejores resultados
  // ----------------------------------------------------------

  const mejoresResultados = resultados.slice(0, limite);

  console.log('\nFragmentos más relevantes:');

  mejoresResultados.forEach((fragmento, indice) => {
    console.log(
      `${indice + 1}. ${fragmento.chunkId} | Similitud: ${fragmento.puntuacion.toFixed(4)}`
    );
  });

  return mejoresResultados;
};
