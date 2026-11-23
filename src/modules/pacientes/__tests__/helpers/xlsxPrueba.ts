import { deflateRawSync } from 'node:zlib';

export type ValorXlsxPrueba =
    | string
    | number
    | boolean
    | null
    | undefined;

export interface HojaXlsxPrueba {
    nombre: string;
    filas: ValorXlsxPrueba[][];
}

interface ArchivoZip {
    nombre: string;
    contenido: Buffer;
}

const escaparXml = (valor: string): string =>
    valor
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const letraColumna = (indice: number): string => {
    let resultado = '';
    let numero = indice + 1;

    while (numero > 0) {
        const resto = (numero - 1) % 26;

        resultado = String.fromCharCode(65 + resto) + resultado;
        numero = Math.floor((numero - 1) / 26);
    }

    return resultado;
};

const crearCelda = (
    valor: ValorXlsxPrueba,
    fila: number,
    columna: number
): string => {
    const referencia = `${letraColumna(columna)}${fila}`;

    if (valor === null || valor === undefined || valor === '') {
        return '';
    }

    if (typeof valor === 'number') {
        return `<c r="${referencia}"><v>${valor}</v></c>`;
    }

    if (typeof valor === 'boolean') {
        return `<c r="${referencia}" t="b"><v>${valor ? 1 : 0}</v></c>`;
    }

    return `<c r="${referencia}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(
        valor
    )}</t></is></c>`;
};

const crearHojaXml = (filas: ValorXlsxPrueba[][]): string =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>` +
    filas
        .map(
            (fila, indiceFila) =>
                `<row r="${indiceFila + 1}">` +
                fila
                    .map((valor, indiceColumna) =>
                        crearCelda(
                            valor,
                            indiceFila + 1,
                            indiceColumna
                        )
                    )
                    .join('') +
                `</row>`
        )
        .join('') +
    `</sheetData></worksheet>`;

const calcularCrc32 = (contenido: Buffer): number => {
    let crc = 0xffffffff;

    for (let indice = 0; indice < contenido.length; indice += 1) {
        crc ^= contenido[indice];

        for (let bit = 0; bit < 8; bit += 1) {
            crc =
                (crc >>> 1) ^
                (0xedb88320 & -(crc & 1));
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
};

const crearZip = (archivos: ArchivoZip[]): Buffer => {
    const partes: Buffer[] = [];
    const centrales: Buffer[] = [];
    let desplazamiento = 0;

    for (const archivo of archivos) {
        const comprimido = deflateRawSync(archivo.contenido);
        const checksum = calcularCrc32(archivo.contenido);
        const nombre = Buffer.from(archivo.nombre, 'utf8');

        const cabeceraLocal = Buffer.alloc(30);

        cabeceraLocal.writeUInt32LE(0x04034b50, 0);
        cabeceraLocal.writeUInt16LE(20, 4);
        cabeceraLocal.writeUInt16LE(0, 6);
        cabeceraLocal.writeUInt16LE(8, 8);
        cabeceraLocal.writeUInt16LE(0, 10);
        cabeceraLocal.writeUInt16LE(0x21, 12);
        cabeceraLocal.writeUInt32LE(checksum, 14);
        cabeceraLocal.writeUInt32LE(comprimido.length, 18);
        cabeceraLocal.writeUInt32LE(archivo.contenido.length, 22);
        cabeceraLocal.writeUInt16LE(nombre.length, 26);
        cabeceraLocal.writeUInt16LE(0, 28);

        partes.push(cabeceraLocal, nombre, comprimido);

        const cabeceraCentral = Buffer.alloc(46);

        cabeceraCentral.writeUInt32LE(0x02014b50, 0);
        cabeceraCentral.writeUInt16LE(20, 4);
        cabeceraCentral.writeUInt16LE(20, 6);
        cabeceraCentral.writeUInt16LE(0, 8);
        cabeceraCentral.writeUInt16LE(8, 10);
        cabeceraCentral.writeUInt16LE(0, 12);
        cabeceraCentral.writeUInt16LE(0x21, 14);
        cabeceraCentral.writeUInt32LE(checksum, 16);
        cabeceraCentral.writeUInt32LE(comprimido.length, 20);
        cabeceraCentral.writeUInt32LE(archivo.contenido.length, 24);
        cabeceraCentral.writeUInt16LE(nombre.length, 28);
        cabeceraCentral.writeUInt16LE(0, 30);
        cabeceraCentral.writeUInt16LE(0, 32);
        cabeceraCentral.writeUInt16LE(0, 34);
        cabeceraCentral.writeUInt16LE(0, 36);
        cabeceraCentral.writeUInt32LE(0, 38);
        cabeceraCentral.writeUInt32LE(desplazamiento, 42);

        centrales.push(cabeceraCentral, nombre);

        desplazamiento +=
            cabeceraLocal.length + nombre.length + comprimido.length;
    }

    const directorioCentral = Buffer.concat(centrales);
    const fin = Buffer.alloc(22);

    fin.writeUInt32LE(0x06054b50, 0);
    fin.writeUInt16LE(0, 4);
    fin.writeUInt16LE(0, 6);
    fin.writeUInt16LE(archivos.length, 8);
    fin.writeUInt16LE(archivos.length, 10);
    fin.writeUInt32LE(directorioCentral.length, 12);
    fin.writeUInt32LE(desplazamiento, 16);
    fin.writeUInt16LE(0, 20);

    return Buffer.concat([...partes, directorioCentral, fin]);
};

export const crearXlsxPrueba = (
    hojas: HojaXlsxPrueba[]
): Buffer => {
    const overridesHojas = hojas
        .map(
            (_hoja, indice) =>
                `<Override PartName="/xl/worksheets/sheet${
                    indice + 1
                }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
        )
        .join('');

    const contentTypes =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        overridesHojas +
        `</Types>`;

    const rels =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`;

    const workbook =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
        hojas
            .map(
                (hoja, indice) =>
                    `<sheet name="${escaparXml(
                        hoja.nombre
                    )}" sheetId="${indice + 1}" r:id="rId${indice + 1}"/>`
            )
            .join('') +
        `</sheets></workbook>`;

    const workbookRels =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        hojas
            .map(
                (_hoja, indice) =>
                    `<Relationship Id="rId${
                        indice + 1
                    }" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
                        indice + 1
                    }.xml"/>`
            )
            .join('') +
        `</Relationships>`;

    const archivos: ArchivoZip[] = [
        {
            nombre: '[Content_Types].xml',
            contenido: Buffer.from(contentTypes, 'utf8'),
        },
        {
            nombre: '_rels/.rels',
            contenido: Buffer.from(rels, 'utf8'),
        },
        {
            nombre: 'xl/workbook.xml',
            contenido: Buffer.from(workbook, 'utf8'),
        },
        {
            nombre: 'xl/_rels/workbook.xml.rels',
            contenido: Buffer.from(workbookRels, 'utf8'),
        },
    ];

    hojas.forEach((hoja, indice) => {
        archivos.push({
            nombre: `xl/worksheets/sheet${indice + 1}.xml`,
            contenido: Buffer.from(crearHojaXml(hoja.filas), 'utf8'),
        });
    });

    return crearZip(archivos);
};
