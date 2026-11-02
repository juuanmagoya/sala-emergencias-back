import 'dotenv/config';

import mongoose from 'mongoose';

import HistoriaClinicaModel from '../modules/historiaclinica/models/HistoriaClinica';

// ============================================================
// MIGRACIÓN DE HISTORIAS CLÍNICAS LEGADAS
//
// Copia la información del diseño anterior a los campos nuevos
// (`observaciones` y `recetario`). NO elimina los campos viejos
// ni borra documentos: la información clínica original se conserva.
//
// Por defecto se ejecuta en modo DRY-RUN. Para aplicar los cambios:
//   MIGRAR_APLICAR=true npx tsx src/migraciones/migrarHistoriasClinicas.ts
// ============================================================

const LONGITUD_MAXIMA_OBSERVACIONES = 2000;
const APLICAR_CAMBIOS = process.env.MIGRAR_APLICAR === 'true';

interface MedicamentoLegado {
    nombre?: string;
    dosis?: string;
    frecuencia?: string;
}

interface DocumentoHistoriaLegado {
    _id: mongoose.Types.ObjectId;
    observaciones?: string;
    recetario?: unknown[];
    activo?: boolean;
    motivoConsulta?: string;
    sintomas?: string[];
    examenFisico?: {
        hallazgos?: string;
    };
    diagnostico?: {
        impresionDiagnostica?: string;
        diagnosticoDefinitivo?: string;
    };
    tratamiento?: {
        indicaciones?: string;
        medicamentos?: MedicamentoLegado[];
    };
    recomendaciones?: string;
}

const agregarParte = (
    partes: string[],
    etiqueta: string,
    valor?: string
) => {
    if (typeof valor === 'string' && valor.trim()) {
        partes.push(`${etiqueta}: ${valor.trim()}`);
    }
};

const construirObservaciones = (
    documento: DocumentoHistoriaLegado
): string | null => {
    const partes: string[] = [];

    agregarParte(partes, 'Motivo de consulta', documento.motivoConsulta);

    if (Array.isArray(documento.sintomas) && documento.sintomas.length > 0) {
        agregarParte(partes, 'Síntomas', documento.sintomas.join(', '));
    }

    agregarParte(
        partes,
        'Hallazgos del examen físico',
        documento.examenFisico?.hallazgos
    );
    agregarParte(
        partes,
        'Impresión diagnóstica',
        documento.diagnostico?.impresionDiagnostica
    );
    agregarParte(
        partes,
        'Diagnóstico definitivo',
        documento.diagnostico?.diagnosticoDefinitivo
    );
    agregarParte(
        partes,
        'Indicaciones del tratamiento',
        documento.tratamiento?.indicaciones
    );
    agregarParte(partes, 'Recomendaciones', documento.recomendaciones);

    const observaciones = partes.join('\n').trim();

    return observaciones || null;
};

const construirRecetario = (documento: DocumentoHistoriaLegado) => {
    const medicamentos = documento.tratamiento?.medicamentos;

    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        return [];
    }

    const recetario: Array<{
        nombre: string;
        dosis: string;
        frecuencia: string;
    }> = [];

    medicamentos.forEach((medicamento, indice) => {
        const nombre =
            typeof medicamento.nombre === 'string'
                ? medicamento.nombre.trim()
                : '';
        const dosis =
            typeof medicamento.dosis === 'string'
                ? medicamento.dosis.trim()
                : '';
        const frecuencia =
            typeof medicamento.frecuencia === 'string'
                ? medicamento.frecuencia.trim()
                : '';

        if (!nombre || !dosis || !frecuencia) {
            console.warn(
                `⚠️ Historia ${documento._id.toString()}: el medicamento ${indice + 1} no tiene nombre, dosis o frecuencia. ` +
                    'Se omite del recetario y se conserva el dato original en `tratamiento.medicamentos`.'
            );
            return;
        }

        recetario.push({ nombre, dosis, frecuencia });
    });

    return recetario;
};

const migrar = async () => {
    const url = process.env.DATABASE_URL_ATLAS;

    if (!url) {
        console.error('❌ Falta la variable DATABASE_URL_ATLAS');
        process.exitCode = 1;
        return;
    }

    await mongoose.connect(url, {
        autoIndex: false,
        serverSelectionTimeoutMS: 10000,
    });

    console.log(
        `🔄 Modo: ${APLICAR_CAMBIOS ? 'APLICAR CAMBIOS' : 'DRY-RUN (sin escribir)'}`
    );

    const coleccion = HistoriaClinicaModel.collection;

    const filtro = {
        $or: [
            { observaciones: { $exists: false } },
            { recetario: { $exists: false } },
        ],
    };

    const total = await coleccion.countDocuments(filtro);

    console.log(`📄 Documentos legacy a revisar: ${total}`);

    const cursor = coleccion.find(filtro);

    let actualizados = 0;
    let omitidos = 0;

    for await (const documentoCrudo of cursor) {
        const documento =
            documentoCrudo as unknown as DocumentoHistoriaLegado;

        const cambios: Record<string, unknown> = {};

        if (documento.observaciones === undefined) {
            const observaciones = construirObservaciones(documento);

            if (!observaciones) {
                console.warn(
                    `⚠️ Historia ${documento._id.toString()}: no hay datos legacy para construir \`observaciones\`. Revisar manualmente.`
                );
                omitidos++;
            } else if (
                observaciones.length > LONGITUD_MAXIMA_OBSERVACIONES
            ) {
                console.warn(
                    `⚠️ Historia ${documento._id.toString()}: las observaciones construidas superan ${LONGITUD_MAXIMA_OBSERVACIONES} caracteres. ` +
                        'Se omiten para revisión manual; los datos originales siguen intactos.'
                );
                omitidos++;
            } else {
                cambios.observaciones = observaciones;
            }
        }

        if (documento.recetario === undefined) {
            cambios.recetario = construirRecetario(documento);
        }

        if (Object.keys(cambios).length === 0) {
            continue;
        }

        if (APLICAR_CAMBIOS) {
            await coleccion.updateOne(
                { _id: documento._id },
                { $set: cambios }
            );
        }

        actualizados++;
    }

    console.log(
        `✅ ${APLICAR_CAMBIOS ? 'Historias actualizadas' : 'Historias que se actualizarían'}: ${actualizados}`
    );

    if (omitidos > 0) {
        console.warn(
            `⚠️ Historias con datos que requieren revisión manual: ${omitidos}`
        );
    }

    const desactivadas = await (coleccion as any).countDocuments({
        activo: false,
    });

    if (desactivadas > 0) {
        console.warn(
            `⚠️ Documentos legacy con \`activo: false\`: ${desactivadas}. ` +
                'El nuevo esquema no tiene borrado lógico; definir manualmente si deben conservarse, archivarse o descartarse.'
        );
    }

    await mongoose.disconnect();

    console.log('🔌 Conexión cerrada');
};

migrar().catch(async (error: unknown) => {
    console.error(
        '❌ Error durante la migración:',
        (error as Error).message
    );

    await mongoose.disconnect().catch(() => undefined);
    process.exitCode = 1;
});
