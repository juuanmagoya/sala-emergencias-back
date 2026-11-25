
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  EstadoValidacionMedica,
} from '../types/chatbot.types';

import DocumentoConocimiento from '../models/DocumentoConocimiento';
import {
  EMBEDDING_CONFIG,
  generarEmbedding,
} from './embedding.service';
import { procesarDocumentoMarkdown } from '../utils/document.processor';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const RUTA_DOCUMENTO_POR_DEFECTO = path.resolve(
  process.cwd(),
  'src/modules/chatbot/knowledge/base-conocimiento-medica.md'
);

const CONCURRENCIA_EMBEDDINGS = 1;
const TAMANO_LOTE = 10;
const PAUSA_ENTRE_EMBEDDINGS_MS = 700;

const esperar = (milisegundos: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milisegundos));


// ============================================================
// TIPOS
// ============================================================

interface DocumentoExistente {
  chunkId: string;
  metadata?: {
    modelo?: string;
    dimensiones?: number;
    hashContenido?: string;
  };
}

interface ChunkPendiente {
  chunkId: string;
  hashContenido: string;
  embedding: number[];
}

// ============================================================
// HASH DEL CONTENIDO
// ============================================================

const generarHashContenido = (contenido: string): string =>
  createHash('sha256')
    .update(contenido, 'utf-8')
    .digest('hex');

// ============================================================
// GENERACIÓN CONTROLADA DE EMBEDDINGS
// ============================================================

const generarEmbeddingsEnLotes = async (
  chunks: Array<{
    chunkId: string;
    contenido: string;
    hashContenido: string;
  }>
): Promise<ChunkPendiente[]> => {
  const resultados: ChunkPendiente[] = new Array(chunks.length);

  let siguienteIndice = 0;
  let errorGeneracion: unknown = null;

  const trabajador = async (): Promise<void> => {
    while (true) {
      if (errorGeneracion) return;

      const indice = siguienteIndice++;

      if (indice >= chunks.length) return;

      const chunk = chunks[indice];

      try {
        console.log(
          `Generando embedding ${indice + 1}/${chunks.length}: ${chunk.chunkId}`
        );

        await esperar(PAUSA_ENTRE_EMBEDDINGS_MS);

        const embedding = await generarEmbedding(
        chunk.contenido,
        'RETRIEVAL_DOCUMENT'
        );

        if (embedding.length !== EMBEDDING_CONFIG.dimensiones) {
          throw new Error(
            `Dimensiones incorrectas para el chunk ${chunk.chunkId}`
          );
        }

        resultados[indice] = {
          chunkId: chunk.chunkId,
          hashContenido: chunk.hashContenido,
          embedding,
        };
      } catch (error) {
        errorGeneracion = error;
        return;
      }
    }
  };

  const cantidadTrabajadores = Math.min(
    CONCURRENCIA_EMBEDDINGS,
    chunks.length
  );

  await Promise.all(
    Array.from(
      { length: cantidadTrabajadores },
      () => trabajador()
    )
  );

  if (errorGeneracion) {
    throw errorGeneracion;
  }

  return resultados;
};

// ============================================================
// INDEXACIÓN DE LA BASE DE CONOCIMIENTO
// ============================================================

export const indexarBaseConocimiento = async (
  rutaDocumento: string = RUTA_DOCUMENTO_POR_DEFECTO
) => {
  console.log('\n========================================');
  console.log(' INDEXACIÓN DE BASE DE CONOCIMIENTO');
  console.log('========================================\n');

  // ----------------------------------------------------------
  // 1. Leer Markdown
  // ----------------------------------------------------------

  console.log('Leyendo documento Markdown...');

  const markdown = await readFile(rutaDocumento, 'utf-8');

  if (!markdown.trim()) {
    throw new Error('El documento Markdown está vacío');
  }

  // ----------------------------------------------------------
  // 2. Procesar artículos
  // ----------------------------------------------------------

  console.log('Procesando artículos...');

  const chunks = procesarDocumentoMarkdown(markdown);

  if (chunks.length === 0) {
    throw new Error(
      'El procesador no generó chunks. Se cancela la indexación.'
    );
  }

  const idsChunks = chunks.map((chunk) => chunk.chunkId);

  if (new Set(idsChunks).size !== idsChunks.length) {
    throw new Error(
      'Hay IDs de chunks duplicados. Se cancela la indexación.'
    );
  }

  const articulosProcesados = new Set(
    chunks.map((chunk) => chunk.articuloId)
  ).size;

  console.log(`Artículos procesados: ${articulosProcesados}`);
  console.log(`Chunks encontrados: ${chunks.length}`);

  // ----------------------------------------------------------
  // 3. Calcular hashes
  // ----------------------------------------------------------

  const chunksConHash = chunks.map((chunk) => ({
    ...chunk,
    hashContenido: generarHashContenido(chunk.contenido),
  }));

  // ----------------------------------------------------------
  // 4. Consultar documentos existentes
  // ----------------------------------------------------------

  console.log('\nConsultando documentos existentes en MongoDB...');

  const documentosExistentes = await DocumentoConocimiento.find({
    chunkId: { $in: idsChunks },
  })
    .select('chunkId metadata')
    .lean();

  const existentesPorId = new Map<string, DocumentoExistente>(
    documentosExistentes.map((documento) => [
      documento.chunkId,
      documento as DocumentoExistente,
    ])
  );

  console.log(
    `Chunks que ya existen en MongoDB: ${documentosExistentes.length}`
  );

  // ----------------------------------------------------------
  // 5. Identificar embeddings pendientes
  // ----------------------------------------------------------

  const chunksQueNecesitanEmbedding = chunksConHash.filter((chunk) => {
    const existente = existentesPorId.get(chunk.chunkId);

    if (!existente) return true;

    const hashCoincide =
      existente.metadata?.hashContenido === chunk.hashContenido;

    const modeloCoincide =
      existente.metadata?.modelo === EMBEDDING_CONFIG.modelo;

    const dimensionesCoinciden =
      existente.metadata?.dimensiones === EMBEDDING_CONFIG.dimensiones;

    return !(
      hashCoincide &&
      modeloCoincide &&
      dimensionesCoinciden
    );
  });

  const cantidadSinCambios =
    chunks.length - chunksQueNecesitanEmbedding.length;

  console.log('\nResumen de embeddings:');
  console.log(`Sin cambios: ${cantidadSinCambios}`);
  console.log(
    `Necesitan generar embedding: ${chunksQueNecesitanEmbedding.length}`
  );

  // ----------------------------------------------------------
  // 6. Generar y guardar por lotes
  // ----------------------------------------------------------

  let embeddingsGenerados = 0;
  let documentosInsertados = 0;
  let documentosActualizados = 0;

  const cantidadLotes = Math.ceil(
    chunksQueNecesitanEmbedding.length / TAMANO_LOTE
  );

  for (
    let inicio = 0;
    inicio < chunksQueNecesitanEmbedding.length;
    inicio += TAMANO_LOTE
  ) {
    const numeroLote = Math.floor(inicio / TAMANO_LOTE) + 1;

    const lote = chunksQueNecesitanEmbedding.slice(
      inicio,
      inicio + TAMANO_LOTE
    );

    console.log('\n----------------------------------------');
    console.log(`Procesando lote ${numeroLote}/${cantidadLotes}`);
    console.log(`Fragmentos del lote: ${lote.length}`);
    console.log('----------------------------------------');

    // Generar embeddings del lote actual.

    const embeddings = await generarEmbeddingsEnLotes(
      lote.map((chunk) => ({
        chunkId: chunk.chunkId,
        contenido: chunk.contenido,
        hashContenido: chunk.hashContenido,
      }))
    );

    const embeddingsPorId = new Map(
      embeddings.map((item) => [item.chunkId, item])
    );

    const fechaIndexacion = new Date();

    // Preparar operaciones de MongoDB.

    const operaciones = lote.map((chunk) => {
      const existente = existentesPorId.get(chunk.chunkId);
      const embeddingNuevo = embeddingsPorId.get(chunk.chunkId);

      if (!embeddingNuevo) {
        throw new Error(
          `No se encontró el embedding generado para ${chunk.chunkId}`
        );
      }

      const contenidoCambio =
        !!existente &&
        existente.metadata?.hashContenido !== chunk.hashContenido;

      const set = {
        articuloId: chunk.articuloId,
        categoria: chunk.categoria,
        titulo: chunk.titulo,
        resumen: chunk.resumen,
        contenido: chunk.contenido,
        palabrasClave: chunk.palabrasClave,
        embedding: embeddingNuevo.embedding,
        metadata: {
          modelo: EMBEDDING_CONFIG.modelo,
          dimensiones: EMBEDDING_CONFIG.dimensiones,
          hashContenido: chunk.hashContenido,
          fechaIndexacion,
        },
        ...(contenidoCambio
          ? {
              estadoValidacion:
                'pendiente_revision_medica' as EstadoValidacionMedica,
              habilitadoConsultaClinica: false,
            }
          : {}),
      };

      const setOnInsert = {
        estadoValidacion:
          'pendiente_revision_medica' as EstadoValidacionMedica,
        habilitadoConsultaClinica: false,
      };

      return {
        updateOne: {
          filter: { chunkId: chunk.chunkId },
          update: {
            $set: set,
            ...(!existente ? { $setOnInsert: setOnInsert } : {}),
          },
          upsert: true,
        },
      };
    });

    // Guardar inmediatamente el lote.

    console.log('Guardando lote en MongoDB...');

    const resultado = await DocumentoConocimiento.bulkWrite(
      operaciones,
      { ordered: true }
    );

    embeddingsGenerados += embeddings.length;
    documentosInsertados += resultado.upsertedCount;
    documentosActualizados += resultado.modifiedCount;

    // Actualizar el mapa para reflejar los documentos guardados.

    for (const chunk of lote) {
      existentesPorId.set(chunk.chunkId, {
        chunkId: chunk.chunkId,
        metadata: {
          modelo: EMBEDDING_CONFIG.modelo,
          dimensiones: EMBEDDING_CONFIG.dimensiones,
          hashContenido: chunk.hashContenido,
        },
      });
    }

    console.log(`Lote ${numeroLote} guardado correctamente.`);
    console.log(`Embeddings acumulados: ${embeddingsGenerados}`);
  }

  // ----------------------------------------------------------
  // 7. Eliminar chunks obsoletos
  // ----------------------------------------------------------

  // Esta operación se ejecuta únicamente cuando todos los lotes
  // terminaron correctamente. Si falla un lote, no se eliminan datos.

  console.log('\nBuscando chunks obsoletos...');

  const eliminacion = await DocumentoConocimiento.deleteMany({
    chunkId: { $nin: idsChunks },
  });

  // ----------------------------------------------------------
  // 8. Resultado final
  // ----------------------------------------------------------

  const resumen = {
    articulosProcesados,
    chunksProcesados: chunks.length,
    chunksSinCambios: cantidadSinCambios,
    embeddingsGenerados,
    documentosInsertados,
    documentosActualizados,
    documentosEliminados: eliminacion.deletedCount,
    modeloEmbedding: EMBEDDING_CONFIG.modelo,
    dimensionesEmbedding: EMBEDDING_CONFIG.dimensiones,
  };

  console.log('\n========================================');
  console.log(' RESULTADO DE INDEXACIÓN');
  console.log('========================================\n');

  console.table(resumen);

  console.log('\nIndexación finalizada correctamente.');

  return resumen;
};
