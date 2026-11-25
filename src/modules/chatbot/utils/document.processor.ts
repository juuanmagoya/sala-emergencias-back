
import {
  CategoriaConocimiento,
  EstadoValidacionMedica,
} from '../types/chatbot.types';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const MAX_CARACTERES_CHUNK = 1800;

// ============================================================
// TIPOS
// ============================================================

export interface ChunkPreparado {
  articuloId: string;
  chunkId: string;
  categoria: CategoriaConocimiento;
  titulo: string;
  resumen: string;
  contenido: string;
  palabrasClave: string[];
  estadoValidacion: EstadoValidacionMedica;
  habilitadoConsultaClinica: boolean;
}

interface ArticuloExtraido {
  articuloId: string;
  contenidoOriginal: string;
}

interface SeccionArticulo {
  titulo: string;
  contenido: string;
}

// ============================================================
// CATEGORÍAS
// ============================================================

const CATEGORIAS: Record<string, CategoriaConocimiento> = {
  'sintomas frecuentes': 'sintomas_frecuentes',
  'enfermedades frecuentes': 'enfermedades_frecuentes',
  'cuidados generales': 'cuidados_generales',
  'primeros auxilios': 'primeros_auxilios',
  medicamentos: 'medicamentos',
  prevencion: 'prevencion',
  'signos de alarma': 'signos_alarma',
  'atencion medica': 'atencion_medica',
};

const normalizarTexto = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

// ============================================================
// EXTRACCIÓN DE ARTÍCULOS
// ============================================================

const extraerArticulos = (markdown: string): ArticuloExtraido[] => {
  const patron =
    /<!--\s*INICIO ARTICULO:\s*([A-Z]{3}-\d{3})\s*-->([\s\S]*?)<!--\s*FIN ARTICULO:\s*\1\s*-->/g;

  const articulos: ArticuloExtraido[] = [];
  const idsEncontrados = new Set<string>();

  let coincidencia: RegExpExecArray | null;

  while ((coincidencia = patron.exec(markdown)) !== null) {
    const articuloId = coincidencia[1];
    const contenidoOriginal = coincidencia[2].trim();

    if (idsEncontrados.has(articuloId)) {
      throw new Error(`Artículo duplicado en el Markdown: ${articuloId}`);
    }

    idsEncontrados.add(articuloId);

    articulos.push({
      articuloId,
      contenidoOriginal,
    });
  }

  // Contamos únicamente los marcadores con identificadores válidos.
  const iniciosValidos = [
    ...markdown.matchAll(
      /<!--\s*INICIO ARTICULO:\s*[A-Z]{3}-\d{3}\s*-->/g
    ),
  ];

  const finalesValidos = [
    ...markdown.matchAll(
      /<!--\s*FIN ARTICULO:\s*[A-Z]{3}-\d{3}\s*-->/g
    ),
  ];

  if (iniciosValidos.length !== articulos.length) {
    throw new Error(
      `Hay artículos incompletos. ` +
      `Inicios válidos: ${iniciosValidos.length}. ` +
      `Artículos completos: ${articulos.length}.`
    );
  }

  if (finalesValidos.length !== articulos.length) {
    throw new Error(
      `Hay cierres de artículos sin correspondencia. ` +
      `Cierres válidos: ${finalesValidos.length}. ` +
      `Artículos completos: ${articulos.length}.`
    );
  }

  // Mostramos los marcadores adicionales que no siguen el formato XXX-000.
  const marcadoresGenericos = [
    ...markdown.matchAll(
      /<!--\s*INICIO ARTICULO:([\s\S]*?)-->/g
    ),
  ];

  const marcadoresAdicionales = marcadoresGenericos
    .map((item) => item[1].trim())
    .filter((valor) => !/^[A-Z]{3}-\d{3}$/.test(valor));

  if (marcadoresAdicionales.length > 0) {
    console.log(
      'Marcadores adicionales excluidos:',
      marcadoresAdicionales
    );
  }

  return articulos;
};


// ============================================================
// EXTRACCIÓN DE METADATOS
// ============================================================

const extraerCampo = (
  contenido: string,
  nombreCampo: string
): string => {
  const patron = new RegExp(
    `^-\\s*\\*\\*${nombreCampo}:\\*\\*\\s*(.+)$`,
    'im'
  );

  const coincidencia = contenido.match(patron);

  return coincidencia?.[1]?.trim() ?? '';
};

const extraerPalabrasClave = (contenido: string): string[] => {
  const valor = extraerCampo(contenido, 'Palabras clave');

  return valor
    .split(',')
    .map((palabra) => palabra.trim().replace(/\.$/, ''))
    .filter(Boolean);
};

const extraerCategoria = (
  contenido: string,
  articuloId: string
): CategoriaConocimiento => {
  const categoriaOriginal = extraerCampo(contenido, 'Categoría');

  const categoria = CATEGORIAS[normalizarTexto(categoriaOriginal)];

  if (!categoria) {
    throw new Error(
      `Categoría desconocida en el artículo ${articuloId}: "${categoriaOriginal}"`
    );
  }

  return categoria;
};

// ============================================================
// EXTRACCIÓN DE SECCIONES
// ============================================================

const extraerSecciones = (contenido: string): SeccionArticulo[] => {
  const patron = /^####\s+(.+)$/gm;

  const encabezados: {
    titulo: string;
    inicio: number;
    fin: number;
  }[] = [];

  let coincidencia: RegExpExecArray | null;

  while ((coincidencia = patron.exec(contenido)) !== null) {
    encabezados.push({
      titulo: coincidencia[1].trim(),
      inicio: coincidencia.index,
      fin: patron.lastIndex,
    });
  }

  const secciones: SeccionArticulo[] = [];

  encabezados.forEach((encabezado, indice) => {
    const siguiente = encabezados[indice + 1];

    const contenidoSeccion = contenido
      .slice(encabezado.fin, siguiente?.inicio ?? contenido.length)
      .trim();

    if (!contenidoSeccion) return;

    secciones.push({
      titulo: encabezado.titulo,
      contenido: contenidoSeccion,
    });
  });

  return secciones;
};

// ============================================================
// FILTRO DE SECCIONES
// ============================================================

const seccionDebeExcluirse = (seccion: SeccionArticulo): boolean => {
  const titulo = normalizarTexto(seccion.titulo);
  const contenido = normalizarTexto(seccion.contenido);

  // No indexamos las dosis ni las formas de administración.
  if (/dosis|administracion/.test(titulo)) {
    return true;
  }

  // Excluimos secciones que contengan una marca explícita de bloqueo.
  if (/\bbloqueado\b/.test(contenido)) {
    return true;
  }

  // Las fuentes y el estado administrativo quedan como metadatos,
  // no como contenido para recuperación semántica.
  if (
    titulo === 'fuentes' ||
    titulo === 'estado de validacion medica'
  ) {
    return true;
  }

  return false;
};

// ============================================================
// DIVISIÓN EN CHUNKS
// ============================================================

const dividirTexto = (
  texto: string,
  maxCaracteres: number
): string[] => {
  const parrafos = texto
    .split(/\n\s*\n/)
    .map((parrafo) => parrafo.trim())
    .filter(Boolean);

  const bloques: string[] = [];

  for (const parrafo of parrafos) {
    if (parrafo.length <= maxCaracteres) {
      bloques.push(parrafo);
      continue;
    }

    // Si un párrafo es demasiado largo, dividimos por líneas.
    const lineas = parrafo
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean);

    let bloqueActual = '';

    for (const linea of lineas) {
      if (linea.length > maxCaracteres) {
        if (bloqueActual) {
          bloques.push(bloqueActual);
          bloqueActual = '';
        }

        // Último recurso: dividir una línea extensa por palabras.
        const palabras = linea.split(/\s+/);
        let fragmento = '';

        for (const palabra of palabras) {
          const candidato = fragmento
            ? `${fragmento} ${palabra}`
            : palabra;

          if (candidato.length > maxCaracteres && fragmento) {
            bloques.push(fragmento);
            fragmento = palabra;
          } else {
            fragmento = candidato;
          }
        }

        if (fragmento) bloques.push(fragmento);

        continue;
      }

      const candidato = bloqueActual
        ? `${bloqueActual}\n${linea}`
        : linea;

      if (candidato.length > maxCaracteres && bloqueActual) {
        bloques.push(bloqueActual);
        bloqueActual = linea;
      } else {
        bloqueActual = candidato;
      }
    }

    if (bloqueActual) {
      bloques.push(bloqueActual);
    }
  }

  // Reunimos bloques pequeños cuando entran en el mismo chunk.
  const chunks: string[] = [];
  let chunkActual = '';

  for (const bloque of bloques) {
    const candidato = chunkActual
      ? `${chunkActual}\n\n${bloque}`
      : bloque;

    if (candidato.length > maxCaracteres && chunkActual) {
      chunks.push(chunkActual);
      chunkActual = bloque;
    } else {
      chunkActual = candidato;
    }
  }

  if (chunkActual) {
    chunks.push(chunkActual);
  }

  return chunks;
};

// ============================================================
// GENERACIÓN DE IDENTIFICADORES
// ============================================================

const generarSlug = (texto: string): string =>
  normalizarTexto(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

// ============================================================
// PROCESAMIENTO DE UN ARTÍCULO
// ============================================================

const procesarArticulo = (
  articulo: ArticuloExtraido
): ChunkPreparado[] => {
  const {
    articuloId,
    contenidoOriginal,
  } = articulo;

  const titulo = extraerCampo(contenidoOriginal, 'Título');
  const resumen = extraerCampo(
    contenidoOriginal,
    'Resumen para recuperación'
  );

  const categoria = extraerCategoria(
    contenidoOriginal,
    articuloId
  );

  const palabrasClave = extraerPalabrasClave(contenidoOriginal);

  if (!titulo || !resumen) {
    throw new Error(
      `Falta el título o el resumen del artículo ${articuloId}`
    );
  }

  const secciones = extraerSecciones(contenidoOriginal);

  const seccionesValidas = secciones.filter(
    (seccion) => !seccionDebeExcluirse(seccion)
  );

  const chunks: ChunkPreparado[] = [];

  for (const seccion of seccionesValidas) {
    const fragmentos = dividirTexto(
      seccion.contenido,
      MAX_CARACTERES_CHUNK
    );

    fragmentos.forEach((fragmento, indice) => {
      const numero = String(indice + 1).padStart(3, '0');

      const chunkId = [
        articuloId,
        generarSlug(seccion.titulo),
        numero,
      ].join('-');

      // Repetimos el contexto del artículo en cada chunk.
      // Esto ayuda a que el embedding conserve su significado.
      const contenido = [
        `Artículo: ${titulo}`,
        `Resumen: ${resumen}`,
        `Sección: ${seccion.titulo}`,
        `Contenido:`,
        fragmento,
      ].join('\n\n');

      chunks.push({
        articuloId,
        chunkId,
        categoria,
        titulo,
        resumen,
        contenido,
        palabrasClave,
        estadoValidacion: 'pendiente_revision_medica',
        habilitadoConsultaClinica: false,
      });
    });
  }

  return chunks;
};

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

export const procesarDocumentoMarkdown = (
  markdown: string
): ChunkPreparado[] => {
  if (!markdown.trim()) {
    throw new Error('El documento Markdown está vacío');
  }

  const articulos = extraerArticulos(markdown);

  if (articulos.length === 0) {
    throw new Error('No se encontraron artículos en el Markdown');
  }

  const chunks: ChunkPreparado[] = [];

  for (const articulo of articulos) {
    const chunksArticulo = procesarArticulo(articulo);

    chunks.push(...chunksArticulo);
  }

  return chunks;
};
