export type ValorCeldaImportacion =
    | string
    | number
    | boolean
    | Date
    | null
    | undefined;

export type FilaExcelImportacion = ValorCeldaImportacion[];

export const esCeldaVacia = (valor: ValorCeldaImportacion): boolean => {
    if (valor === null || valor === undefined) {
        return true;
    }

    return typeof valor === 'string' && valor.trim() === '';
};
