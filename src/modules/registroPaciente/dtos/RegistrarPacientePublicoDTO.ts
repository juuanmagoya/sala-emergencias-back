
export interface RegistrarPacientePublicoDTO {
    nombre: string;
    dni: string;
    telefono: {
        codigoArea: string;
        numero: string;
    };
    email: string;
}
