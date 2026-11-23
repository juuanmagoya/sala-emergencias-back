import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getPacientes,
    createPaciente,
    updatePaciente,
    deletePaciente,
} from '../controllers/paciente.controller';
import {
    previsualizarImportacion,
    confirmarImportacion,
} from '../controllers/importacionPacientes.controller';
import {
    limitadorImportacion,
    recibirArchivoImportacion,
} from '../middlewares/importacionPacientes.middleware';

const router = Router();

// Consulta de pacientes: recepción los administra y el personal médico
// necesita los datos para la atención.
router.get(
    '/',
    autorizarRoles('admin', 'medico', 'recepcionista'),
    getPacientes
);

// Importación masiva desde Excel: solo administración y recepción.
// La previsualización no escribe en MongoDB; la confirmación vuelve a
// validar el archivo y solo inserta pacientes nuevos.
router.post(
    '/importar/previsualizar',
    autorizarRoles('admin', 'recepcionista'),
    limitadorImportacion,
    recibirArchivoImportacion,
    previsualizarImportacion
);

router.post(
    '/importar',
    autorizarRoles('admin', 'recepcionista'),
    limitadorImportacion,
    recibirArchivoImportacion,
    confirmarImportacion
);

// Registro y actualización de datos demográficos: administración y recepción.
router.post('/', autorizarRoles('admin', 'recepcionista'), createPaciente);

router.put('/:id', autorizarRoles('admin', 'recepcionista'), updatePaciente);

// El borrado es físico y está condicionado a que no existan turnos activos.
// Se reserva a administración.
router.delete('/:id', autorizarRoles('admin'), deletePaciente);

export default router;
