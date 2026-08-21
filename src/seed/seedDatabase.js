// src/seed/seedDatabase.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Especialidad = require('../models/Especialidad');
const Consultorio = require('../models/Consultorio');
const Medico = require('../models/Medico');
const Paciente = require('../models/Paciente');
const Turno = require('../models/Turno');
const HistoriaClinica = require('../models/HistoriaClinica');

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL_ATLAS);
        console.log('✅ Conectado a la base de datos');

        // 1. Crear Especialidades
        console.log('📝 Creando especialidades...');
        const especialidadesData = [
            { nombre: 'CARDIOLOGIA', descripcion: 'Atención cardiovascular', codigo: 'CAR' },
            { nombre: 'NEUROLOGIA', descripcion: 'Atención neurológica', codigo: 'NEU' },
            { nombre: 'PEDIATRIA', descripcion: 'Atención pediátrica', codigo: 'PED' },
            { nombre: 'DERMATOLOGIA', descripcion: 'Atención dermatológica', codigo: 'DER' },
            { nombre: 'TRAUMATOLOGIA', descripcion: 'Atención traumatológica', codigo: 'TRA' },
            { nombre: 'GINECOLOGIA', descripcion: 'Atención ginecológica', codigo: 'GIN' },
            { nombre: 'CLINICA_MEDICA', descripcion: 'Atención médica general', codigo: 'CLI' },
            { nombre: 'OTORRINOLARINGOLOGIA', descripcion: 'Atención ORL', codigo: 'ORL' },
            { nombre: 'OFTALMOLOGIA', descripcion: 'Atención oftalmológica', codigo: 'OFT' }
        ];

        const especialidades = [];
        for (const data of especialidadesData) {
            const especialidad = await Especialidad.create(data);
            especialidades.push(especialidad);
            console.log(`✅ Especialidad creada: ${especialidad.nombre} (${especialidad.codigo})`);
        }

        // 2. Crear Consultorios
        console.log('📝 Creando consultorios...');
        const consultoriosData = [
            {
                nombre: 'CONSULTORIO CARDIOLOGÍA',
                numero: '101',
                piso: '1',
                ala: 'NORTE',
                especialidades: [especialidades[0]._id, especialidades[6]._id],
                equipamiento: ['CAMILLA', 'ELECTROCARDIOGRAFO', 'TENSIOMETRO'],
                capacidad: 2
            },
            {
                nombre: 'CONSULTORIO PEDIATRÍA',
                numero: '203',
                piso: '2',
                ala: 'SUR',
                especialidades: [especialidades[2]._id, especialidades[6]._id],
                equipamiento: ['CAMILLA', 'OTOSCOPIO', 'BALANZA'],
                capacidad: 1
            },
            {
                nombre: 'CONSULTORIO TRAUMATOLOGÍA',
                numero: '305',
                piso: '3',
                ala: 'ESTE',
                especialidades: [especialidades[4]._id],
                equipamiento: ['CAMILLA', 'ECOGRAFO', 'NEBULIZADOR'],
                capacidad: 2
            },
            {
                nombre: 'CONSULTORIO GENERAL',
                numero: '402',
                piso: '4',
                ala: 'CENTRAL',
                especialidades: [especialidades[6]._id],
                equipamiento: ['CAMILLA', 'TENSIOMETRO', 'ESTETOSCOPIO'],
                capacidad: 2
            }
        ];

        const consultorios = [];
        for (const data of consultoriosData) {
            const consultorio = await Consultorio.create(data);
            consultorios.push(consultorio);
            console.log(`✅ Consultorio creado: ${consultorio.nombre} (${consultorio.numero})`);
        }

        // 3. Crear Médicos
        console.log('📝 Creando médicos...');
        const medicosData = [
            {
                nombre: 'CARLOS',
                apellido: 'RODRÍGUEZ',
                matricula: '123456',
                especialidad: especialidades[0]._id,
                email: 'carlos.rodriguez@hospital.com',
                telefono: {
                    codigoArea: '011',
                    numero: '123456789'
                },
                consultorios: [consultorios[0]._id],
                horarioAtencion: {
                    dia: 'LUNES',
                    horaInicio: '08:00',
                    horaFin: '14:00'
                }
            },
            {
                nombre: 'ANA',
                apellido: 'MARTÍNEZ',
                matricula: '234567',
                especialidad: especialidades[2]._id,
                email: 'ana.martinez@hospital.com',
                telefono: {
                    codigoArea: '0351',
                    numero: '987654321'
                },
                consultorios: [consultorios[1]._id],
                horarioAtencion: {
                    dia: 'MIERCOLES',
                    horaInicio: '10:00',
                    horaFin: '18:00'
                }
            },
            {
                nombre: 'LAURA',
                apellido: 'GONZÁLEZ',
                matricula: '345678',
                especialidad: especialidades[4]._id,
                email: 'laura.gonzalez@hospital.com',
                telefono: {
                    codigoArea: '011',
                    numero: '4567890'
                },
                consultorios: [consultorios[2]._id],
                horarioAtencion: {
                    dia: 'VIERNES',
                    horaInicio: '09:00',
                    horaFin: '15:00'
                }
            },
            {
                nombre: 'ROBERTO',
                apellido: 'LÓPEZ',
                matricula: '456789',
                especialidad: especialidades[6]._id,
                email: 'roberto.lopez@hospital.com',
                telefono: {
                    codigoArea: '011',
                    numero: '555123456'
                },
                consultorios: [consultorios[3]._id],
                horarioAtencion: {
                    dia: 'MARTES',
                    horaInicio: '08:30',
                    horaFin: '16:30'
                }
            }
        ];

        const medicos = [];
        for (const data of medicosData) {
            const medico = await Medico.create(data);
            medicos.push(medico);
            console.log(`✅ Médico creado: ${medico.nombre} ${medico.apellido} (${medico.matricula})`);
        }

        // 4. Crear Pacientes (SIN historialMedico)
        console.log('📝 Creando pacientes...');
        
        const pacientesData = [
            {
                nombre: 'JUAN CARLOS',
                dni: '12345678',
                direccion: {
                    calle: 'AV. SAN MARTÍN',
                    numero: '1234',
                    barrio: 'CENTRO'
                },
                email: 'juan.perez@email.com',
                telefono: {
                    tipo: 'CELULAR',
                    codigoArea: '011',
                    numero: '123456789'
                },
                obraSocial: {
                    nombre: 'OSDE',
                    numeroAfiliado: '123456789'
                }
            },
            {
                nombre: 'MARÍA EUGENIA',
                dni: '87654321',
                direccion: {
                    calle: 'BELGRANO',
                    numero: '567',
                    barrio: 'NORTE'
                },
                email: 'maria.eugenia@email.com',
                telefono: {
                    tipo: 'FIJO',
                    codigoArea: '0351',
                    numero: '1234567'
                },
                obraSocial: {
                    nombre: 'PAMI',
                    numeroAfiliado: '78901234'
                }
            },
            {
                nombre: 'RODRIGO ANDRÉS',
                dni: '11223344',
                direccion: {
                    calle: 'RIVADAVIA',
                    numero: '890',
                    barrio: 'SUR'
                },
                email: 'rodrigo.andres@email.com',
                telefono: {
                    tipo: 'CELULAR',
                    codigoArea: '011',
                    numero: '987654321'
                },
                obraSocial: {
                    nombre: 'SANCOR',
                    numeroAfiliado: '56789012'
                }
            }
        ];

        const pacientes = [];
        for (const data of pacientesData) {
            try {
                const paciente = await Paciente.create(data);
                pacientes.push(paciente);
                console.log(`✅ Paciente creado: ${paciente.nombre} (DNI: ${paciente.dni})`);
            } catch (error) {
                console.error(`❌ Error al crear paciente ${data.nombre}:`, error.message);
            }
        }

        // 5. Crear Historias Clínicas
        console.log('📝 Creando historias clínicas...');
        
        const historiasClinicasData = [
            {
                paciente: pacientes[0]?._id,
                tipoAtencion: 'CONSULTA_GENERAL',
                fechaAtencion: new Date(),
                motivoConsulta: 'Control de hipertensión arterial',
                sintomas: ['FATIGA', 'DOLOR_CABEZA'],
                signosVitales: {
                    presionArterial: {
                        sistolica: 140,
                        diastolica: 90
                    },
                    frecuenciaCardiaca: 78,
                    frecuenciaRespiratoria: 16,
                    temperatura: 36.5,
                    saturacionOxigeno: 98,
                    glucemia: 95
                },
                examenFisico: {
                    hallazgos: 'Paciente en buen estado general, consciente y orientado',
                    examenesSolicitados: ['LABORATORIO', 'ELECTROCARDIOGRAMA'],
                    resultadosExamenes: 'Pendientes de resultados'
                },
                diagnostico: {
                    impresionDiagnostica: 'Hipertensión arterial controlada',
                    diagnosticoDefinitivo: 'Hipertensión arterial esencial',
                    codigoCIE10: 'I10.0'
                },
                tratamiento: {
                    indicaciones: 'Continuar con medicación habitual, control en 3 meses',
                    medicamentos: [
                        {
                            nombre: 'Enalapril',
                            dosis: '10 mg',
                            via: 'ORAL',
                            frecuencia: 'Cada 24 horas'
                        }
                    ]
                },
                medico: medicos[0]._id,
                estado: 'FINALIZADA',
                fechaAlta: new Date(),
                recomendaciones: 'Dieta baja en sodio, actividad física regular'
            },
            {
                paciente: pacientes[1]?._id,
                tipoAtencion: 'CONTROL',
                fechaAtencion: new Date(),
                motivoConsulta: 'Control de diabetes tipo 2',
                sintomas: ['FATIGA'],
                signosVitales: {
                    presionArterial: {
                        sistolica: 125,
                        diastolica: 80
                    },
                    frecuenciaCardiaca: 72,
                    frecuenciaRespiratoria: 15,
                    temperatura: 36.8,
                    saturacionOxigeno: 99,
                    glucemia: 140
                },
                examenFisico: {
                    hallazgos: 'Paciente estable, sin complicaciones agudas',
                    examenesSolicitados: ['LABORATORIO'],
                    resultadosExamenes: 'Hemoglobina glicosilada: 7.2%'
                },
                diagnostico: {
                    impresionDiagnostica: 'Diabetes tipo 2 controlada',
                    diagnosticoDefinitivo: 'Diabetes mellitus tipo 2',
                    codigoCIE10: 'E11.9'
                },
                tratamiento: {
                    indicaciones: 'Mantener tratamiento actual, control glucémico',
                    medicamentos: [
                        {
                            nombre: 'Metformina',
                            dosis: '850 mg',
                            via: 'ORAL',
                            frecuencia: 'Cada 12 horas'
                        }
                    ]
                },
                medico: medicos[3]._id,
                estado: 'FINALIZADA',
                fechaAlta: new Date(),
                recomendaciones: 'Dieta para diabéticos, ejercicio regular'
            },
            {
                paciente: pacientes[2]?._id,
                tipoAtencion: 'URGENCIA',
                fechaAtencion: new Date(),
                motivoConsulta: 'Dolor agudo en rodilla derecha',
                sintomas: ['TRAUMA', 'DOLOR_ABDOMINAL'],
                signosVitales: {
                    presionArterial: {
                        sistolica: 130,
                        diastolica: 85
                    },
                    frecuenciaCardiaca: 82,
                    frecuenciaRespiratoria: 18,
                    temperatura: 36.7,
                    saturacionOxigeno: 98
                },
                examenFisico: {
                    hallazgos: 'Inflamación y dolor en rodilla derecha, limitación funcional',
                    examenesSolicitados: ['RADIOGRAFIA'],
                    resultadosExamenes: 'Sin fracturas visibles'
                },
                diagnostico: {
                    impresionDiagnostica: 'Esguince de rodilla',
                    diagnosticoDefinitivo: 'Esguince de ligamentos de rodilla',
                    codigoCIE10: 'S83.6'
                },
                tratamiento: {
                    indicaciones: 'Reposo, hielo, compresión y elevación',
                    medicamentos: [
                        {
                            nombre: 'Ibuprofeno',
                            dosis: '400 mg',
                            via: 'ORAL',
                            frecuencia: 'Cada 8 horas'
                        }
                    ],
                    procedimientos: ['INMOVILIZACION']
                },
                medico: medicos[2]._id,
                estado: 'EN_ATENCION',
                recomendaciones: 'Control en 7 días, evitar actividad física intensa'
            }
        ];

        const historiasClinicas = [];
        for (const data of historiasClinicasData) {
            if (!data.paciente) {
                console.warn('⚠️ Historia clínica omitida: paciente no disponible');
                continue;
            }
            try {
                const historia = await HistoriaClinica.create(data);
                historiasClinicas.push(historia);
                console.log(`✅ Historia clínica creada para paciente: ${historia.paciente}`);
            } catch (error) {
                console.error(`❌ Error al crear historia clínica:`, error.message);
            }
        }

        // 6. Crear Turnos (CON FECHAS FUTURAS)
        console.log('📝 Creando turnos...');
        const hoy = new Date();
        const fechaTurno1 = new Date(hoy);
        fechaTurno1.setDate(hoy.getDate() + 10); // 10 días después
        const fechaTurno2 = new Date(hoy);
        fechaTurno2.setDate(hoy.getDate() + 20); // 20 días después
        const fechaTurno3 = new Date(hoy);
        fechaTurno3.setDate(hoy.getDate() + 30); // 30 días después

        const turnosData = [
            {
                paciente: pacientes[0]?._id,
                especialidad: especialidades[0]._id,
                fechaTurno: fechaTurno1,
                estado: 'pendiente',
                observaciones: 'Control con cardiólogo'
            },
            {
                paciente: pacientes[1]?._id,
                especialidad: especialidades[6]._id,
                fechaTurno: fechaTurno2,
                estado: 'pendiente',
                observaciones: 'Control general'
            },
            {
                paciente: pacientes[2]?._id,
                especialidad: especialidades[4]._id,
                fechaTurno: fechaTurno3,
                estado: 'pendiente',
                observaciones: 'Evaluación por lesión en rodilla'
            }
        ];

        let turnosCreados = 0;
        for (const data of turnosData) {
            if (!data.paciente) {
                console.warn('⚠️ Turno omitido: paciente no disponible');
                continue;
            }
            try {
                const turno = await Turno.create(data);
                turnosCreados++;
                console.log(`✅ Turno creado: ${turno._id} - Estado: ${turno.estado}`);
            } catch (error) {
                console.error(`❌ Error al crear turno:`, error.message);
            }
        }

        console.log('✅ Base de datos sembrada exitosamente');
        console.log('\n📊 Resumen:');
        console.log(`   - ${especialidades.length} especialidades`);
        console.log(`   - ${consultorios.length} consultorios`);
        console.log(`   - ${medicos.length} médicos`);
        console.log(`   - ${pacientes.length} pacientes`);
        console.log(`   - ${historiasClinicas.length} historias clínicas`);
        console.log(`   - ${turnosCreados} turnos`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al sembrar la base de datos:', error);
        process.exit(1);
    }
};

seedDatabase();