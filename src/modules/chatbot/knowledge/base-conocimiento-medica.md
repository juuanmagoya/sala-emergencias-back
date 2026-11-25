---
titulo: "Base de conocimiento médica para chatbot RAG"
descripcion: "Documento fuente de información educativa en salud para el asistente conversacional de la Sala de Emergencias Municipal."
version: "1.0.0"
fecha_de_corte_bibliografico: "2026-11-25"
idioma: "es-AR"
audiencia: "Pacientes adultos, cuidadores y población general. No está dirigido a profesionales de la salud."
estado_global: "pendiente_revision_medica"
uso_clinico: "prohibido_hasta_aprobacion"
responsable_de_validacion: "[pendiente de designación]"
licencia: "[pendiente de definición]"
---

# Base de conocimiento médica para chatbot RAG

> **Aviso de seguridad obligatorio**
>
> Este documento es material educativo. **No constituye diagnóstico, prescripción ni indicación de tratamiento personalizado.** No reemplaza la evaluación de un profesional de la salud habilitado.
>
> **Estado global: PENDIENTE DE REVISIÓN Y APROBACIÓN POR UN PROFESIONAL MÉDICO HABILITADO.** Hasta que se complete esa revisión, el contenido **no debe utilizarse para responder consultas de pacientes en un entorno de producción**. Las secciones marcadas como `bloqueado` no deben usarse bajo ninguna circunstancia.
>
> Ante una emergencia, la persona debe comunicarse de inmediato con el servicio de emergencias de su localidad. En Argentina se puede llamar al **107** o al **911**, según la jurisdicción, o acudir al centro de salud más cercano.

## 1. Propósito y alcance

Esta base de conocimiento reúne información educativa sobre síntomas frecuentes, enfermedades comunes, cuidados generales, primeros auxilios, medicamentos de uso frecuente, prevención, signos de alarma y preparación para la atención médica.

El objetivo es que el futuro chatbot pueda recuperar fragmentos temáticamente independientes y elaborar respuestas en lenguaje natural, siempre con estas condiciones:

- La respuesta debe ser educativa y no diagnóstica.
- La respuesta debe derivar a una consulta profesional cuando corresponda.
- La respuesta debe priorizar la atención de emergencia ante cualquier signo de alarma.
- La respuesta no debe indicar dosis, pautas de administración ni tratamientos personalizados.
- La respuesta debe reconocer cuándo la información es insuficiente o requiere validación local.

**Fuera de alcance:** interpretar estudios, indicar o suspender medicación, confirmar un diagnóstico, reemplazar una guardia médica, realizar triage clínico automatizado o dar consejos a poblaciones especiales sin derivación profesional.

## 2. Cómo está organizado el documento

Cada artículo tiene un identificador único con el formato `CATEGORÍA-NNN`:

- `SIN`: síntomas frecuentes.
- `ENF`: enfermedades frecuentes.
- `CUI`: cuidados generales.
- `AUX`: primeros auxilios.
- `MED`: medicamentos.
- `PRE`: prevención.
- `ALA`: signos de alarma.
- `ATE`: atención médica.

Cada artículo está delimitado por comentarios HTML de inicio y fin, por ejemplo:

```markdown
<!-- INICIO ARTICULO: CAT-NNN -->
### CAT-NNN · Título descriptivo del artículo
...
<!-- FIN ARTICULO: CAT-NNN -->
```

El identificador del ejemplo (`CAT-NNN`) es ficticio: no corresponde a ningún artículo real, de modo que los delimitadores del documento solo coinciden con artículos existentes.

Esto permite dividir el documento por artículo sin perder los límites. Dentro de cada artículo, los subtítulos `####` separan secciones semánticas que también pueden fragmentarse.

### 2.1. Metadatos de cada artículo

Siempre que corresponda, cada artículo incluye:

- **Identificador:** código único y estable.
- **Categoría:** categoría temática principal.
- **Título:** nombre descriptivo del tema.
- **Resumen para recuperación:** síntesis breve pensada para embeddings.
- **Palabras clave:** términos alternativos que un paciente podría usar.
- **Descripción general:** qué es el tema y cuál es su contexto.
- **Síntomas y características:** manifestaciones habituales, sin diagnóstico.
- **Posibles causas (orientativas):** causas frecuentes que un profesional puede evaluar.
- **Recomendaciones generales y cuidados:** medidas generales seguras y no farmacológicas.
- **Qué evitar:** conductas riesgosas o sin respaldo.
- **Cuándo buscar atención médica:** criterios de consulta.
- **Signos de alarma:** situaciones que requieren atención inmediata.
- **Medicamentos (información general):** solo cuando corresponde; sin dosis.
- **Poblaciones que requieren precauciones especiales:** bebés, niños, embarazadas, adultos mayores y personas con enfermedades preexistentes.
- **Fuentes:** referencias completas y verificables dentro del propio artículo.
- **Estado de validación médica:** nivel de revisión y condiciones de uso.

No todos los campos aplican a todos los artículos. Cuando un campo no aplica, se indica expresamente o se omite para evitar contenido artificial.

## 3. Niveles de validación

- `documentado`: información educativa respaldada por las fuentes citadas en el artículo. **No equivale a validación clínica local.**
- `pendiente`: información parcialmente respaldada, dependiente de protocolos locales o que requiere una fuente adicional.
- `bloqueado`: información que **no debe utilizarse** hasta su aprobación expresa. Se aplica a dosis, indicaciones personalizadas y cualquier contenido no verificable.

**Regla de oro:** ningún artículo de este documento está `validado` para uso clínico. La revisión por un profesional habilitado es obligatoria antes de la puesta en producción.

## 4. Reglas de respuesta para el futuro chatbot

Estas reglas son parte de la base de conocimiento y deben acompañar cualquier implementación:

1. **No diagnosticar.** Usar fórmulas como “puede deberse a distintas causas” y “un profesional debe evaluarlo”.
2. **No prescribir.** No indicar medicamentos, dosis, frecuencias, duraciones ni formas de administración.
3. **No recomendar automedicación.** Si el usuario pregunta qué tomar, explicar que la elección depende de la evaluación profesional y de sus antecedentes.
4. **No adaptar indicaciones de adultos a niños.** Toda mención a bebés, niños o niñas debe derivar a evaluación pediátrica.
5. **Priorizar signos de alarma.** Si el usuario describe dificultad respiratoria, dolor de pecho, pérdida de conocimiento, convulsión, signos de ACV, sangrado grave o reacción alérgica grave, interrumpir la conversación educativa y recomendar atención de emergencia inmediata.
6. **No reemplazar la consulta.** Recordar que la información es orientativa y que la evaluación presencial es la que permite diagnosticar.
7. **Reconocer incertidumbre.** Si no hay información suficiente o la fuente no está validada, decirlo.
8. **Citar la fuente.** Cuando se use un artículo, indicar que la información proviene de las fuentes oficiales citadas en ese artículo.
9. **No pedir datos sensibles innecesarios.** No solicitar estudios, imágenes ni datos clínicos que no sean necesarios para orientar la consulta.
10. **Derivar ante poblaciones de riesgo.** Embarazadas, bebés, adultos mayores, personas inmunodeprimidas y personas con enfermedades crónicas requieren una consulta profesional más temprana.

## 5. Índice de artículos

### Síntomas frecuentes
- `SIN-001` Dolor de cabeza
- `SIN-002` Fiebre
- `SIN-003` Tos
- `SIN-004` Dolor de garganta
- `SIN-005` Congestión nasal
- `SIN-006` Dolor muscular
- `SIN-007` Náuseas
- `SIN-008` Vómitos
- `SIN-009` Diarrea
- `SIN-010` Dolor abdominal

### Enfermedades frecuentes
- `ENF-001` Resfriado común
- `ENF-002` Gripe
- `ENF-003` Gastroenteritis
- `ENF-004` Infecciones respiratorias frecuentes
- `ENF-005` Deshidratación

### Cuidados generales
- `CUI-001` Hidratación
- `CUI-002` Descanso
- `CUI-003` Alimentación
- `CUI-004` Higiene
- `CUI-005` Cuidados durante estados febriles

### Primeros auxilios
- `AUX-001` Heridas superficiales
- `AUX-002` Quemaduras
- `AUX-003` Golpes
- `AUX-004` Caídas
- `AUX-005` Hemorragias
- `AUX-006` Situaciones que requieren asistencia inmediata

### Medicamentos
- `MED-001` Paracetamol
- `MED-002` Ibuprofeno
- `MED-003` Antihistamínicos
- `MED-004` Antitérmicos
- `MED-005` Otros medicamentos de uso frecuente

### Prevención
- `PRE-001` Prevención de enfermedades respiratorias
- `PRE-002` Higiene de manos
- `PRE-003` Vacunación
- `PRE-004` Prevención de enfermedades gastrointestinales

### Signos de alarma
- `ALA-001` Dificultad respiratoria
- `ALA-002` Dolor de pecho
- `ALA-003` Pérdida de conocimiento
- `ALA-004` Convulsiones
- `ALA-005` Signos de accidente cerebrovascular
- `ALA-006` Reacciones alérgicas graves
- `ALA-007` Otros síntomas que requieren atención urgente

### Atención médica
- `ATE-001` Preparación para consultas
- `ATE-002` Preparación para estudios
- `ATE-003` Recomendaciones generales antes de acudir a una consulta

---

# Categoría 1 · Síntomas frecuentes

> **Nota de categoría:** los artículos de esta sección describen síntomas, no enfermedades. Un mismo síntoma puede tener muchas causas. Ningún artículo permite confirmar un diagnóstico.

<!-- INICIO ARTICULO: SIN-001 -->
### SIN-001 · Dolor de cabeza

- **Identificador:** `SIN-001`
- **Categoría:** Síntomas frecuentes
- **Título:** Dolor de cabeza
- **Resumen para recuperación:** El dolor de cabeza es frecuente y puede aparecer por tensión, cansancio, deshidratación, infecciones o migraña. La mayoría de los episodios son leves, pero algunos signos exigen atención inmediata.
- **Palabras clave:** cefalea, dolor de cabeza, migraña, cabeza pesada, presión en la cabeza.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El dolor de cabeza o cefalea es una molestia en cualquier parte de la cabeza: frente, sienes, parte posterior o alrededor de los ojos. Es uno de los motivos de consulta más frecuentes y, en la mayoría de los casos, no indica una enfermedad grave. Sin embargo, la forma de inicio, la intensidad, la duración y los síntomas que lo acompañan son claves para decidir cuándo consultar.

#### Síntomas y características

- Dolor sordo, opresivo o pulsátil.
- Sensación de presión en la cabeza o en la nuca.
- Molestia con la luz, el ruido o el movimiento, en algunos casos.
- Náuseas o falta de apetito en algunos episodios.
- Empeoramiento con el cansancio, el estrés o la falta de sueño.

#### Posibles causas (orientativas, sin diagnóstico)

Un profesional puede evaluar causas frecuentes como tensión muscular, cansancio, deshidratación, falta de sueño, ayuno prolongado, estrés, infecciones respiratorias, migraña, dolor por sinusitis o efectos de algunos medicamentos. También existen causas poco frecuentes pero graves que requieren descartarse con una evaluación.

#### Recomendaciones generales y cuidados

- Descansar en un ambiente tranquilo, con luz suave si la luz molesta.
- Mantener una hidratación adecuada con agua segura.
- Evitar ayunos prolongados y respetar las comidas habituales.
- Dormir lo suficiente y hacer pausas durante el trabajo o el estudio.
- Anotar cuándo empezó, cuánto duró y qué lo desencadenó; esa información es útil para la consulta.
- Aplicar compresas frías o tibias en la frente o la nuca, según lo que resulte más cómodo.

#### Qué evitar

- No automedicarse ni repetir analgésicos sin indicación profesional.
- No consumir alcohol ni bebidas energizantes durante un episodio.
- No hacer esfuerzos físicos intensos si el dolor empeora con el movimiento.
- No atribuir un dolor intenso y repentino a “estrés” sin consultar.

#### Cuándo buscar atención médica

- El dolor es muy intenso, repentino o distinto de los habituales.
- Aparece después de un golpe en la cabeza.
- Se repite con frecuencia o interfiere con el trabajo, el estudio o el sueño.
- Se acompaña de fiebre, vómitos persistentes, visión borrosa o rigidez de cuello.
- Aparece en una persona embarazada, en un adulto mayor o en alguien con enfermedad crónica.
- El dolor no mejora o empeora a pesar del descanso.

#### Signos de alarma

- Dolor de cabeza súbito y muy intenso, descrito como “el peor de la vida”.
- Pérdida de fuerza o sensibilidad en un lado del cuerpo, dificultad para hablar o desviación de la boca.
- Confusión, somnolencia excesiva o pérdida de conocimiento.
- Convulsión.
- Fiebre alta con rigidez de cuello y mal estado general.
- Vómitos repetidos o dolor ocular intenso.
- Dolor después de un traumatismo craneal.

Ante cualquiera de estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas de administración. Los analgésicos de venta libre pueden tener contraindicaciones y efectos adversos; su uso debe consultarse con un profesional, especialmente si hay embarazo, enfermedad hepática o renal, úlcera, asma o consumo de otros medicamentos.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** el dolor de cabeza persistente, con fiebre, vómitos o cambios de conducta requiere evaluación pediátrica.
- **Embarazadas:** el dolor de cabeza intenso o acompañado de visión borrosa, hinchazón o presión arterial elevada requiere consulta urgente.
- **Adultos mayores:** puede ser la manifestación de una enfermedad grave; consultar temprano.
- **Personas con enfermedades preexistentes:** quienes tienen hipertensión, migraña diagnosticada, cáncer, inmunosupresión o anticoagulación deben consultar antes de tomar cualquier medicamento.

#### Fuentes

- MedlinePlus en español. «Dolor de cabeza». https://medlineplus.gov/spanish/headache.html (consultado el 25/11/2026).
- MedlinePlus en español. «Dolores musculares». https://medlineplus.gov/spanish/ency/article/003178.htm (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-001 -->

<!-- INICIO ARTICULO: SIN-002 -->
### SIN-002 · Fiebre

- **Identificador:** `SIN-002`
- **Categoría:** Síntomas frecuentes
- **Título:** Fiebre
- **Resumen para recuperación:** La fiebre es un aumento de la temperatura corporal, frecuentemente por infección. Suele ser un mecanismo de defensa. No siempre requiere bajar la temperatura, pero algunos grupos y algunos signos exigen consulta inmediata.
- **Palabras clave:** fiebre, temperatura alta, calentura, escalofríos, febril, antitérmico.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La fiebre es un aumento temporal de la temperatura corporal y forma parte de la respuesta del organismo, habitualmente frente a infecciones. La temperatura normal varía según la persona y el momento del día. Los valores de corte dependen del sitio de medición: MedlinePlus señala, por ejemplo, que una temperatura oral de 37,8 °C o más se considera fiebre en adultos. Para una evaluación correcta importa registrar la temperatura, el método de medición y los síntomas acompañantes.

#### Síntomas y características

- Sensación de calor, escalofríos o temblores.
- Sudoración.
- Dolor de cabeza o dolores musculares.
- Falta de apetito, cansancio o irritabilidad.
- En niños pequeños, llanto, irritabilidad o somnolencia inusual.
- Deshidratación si la fiebre se mantiene y la ingesta de líquidos es baja.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a infecciones virales o bacterianas, reacciones a vacunas, enfermedades inflamatorias o, con menor frecuencia, a otras condiciones. Un profesional debe evaluar la causa según la edad, los síntomas, el tiempo de evolución y los antecedentes.

#### Recomendaciones generales y cuidados

- Ofrecer líquidos con frecuencia, en pequeñas cantidades, especialmente a niños y adultos mayores.
- Mantener el ambiente fresco y ventilado.
- Usar ropa liviana y evitar abrigar en exceso.
- Descansar y controlar la temperatura de forma periódica.
- Anotar la temperatura, la hora y los síntomas para la consulta.
- Si la persona tiene mucho malestar, consultar antes de usar cualquier medicamento.

#### Qué evitar

- No usar baños de agua fría ni alcohol para bajar la fiebre.
- No abrigar en exceso ni “hacer transpirar” a la persona.
- No administrar aspirina a niños o adolescentes con fiebre.
- No alternar medicamentos sin indicación profesional.
- No automedicarse si hay sospecha de dengue: la aspirina y el ibuprofeno pueden agravar el cuadro. Consultar de inmediato.

#### Cuándo buscar atención médica

- Fiebre en un bebé menor de 3 meses.
- Fiebre que dura más de 3 días o que no cede con las medidas generales.
- Fiebre alta con mal estado general, somnolencia o irritabilidad intensa.
- Fiebre con sarpullido, dolor abdominal intenso, vómitos persistentes o diarrea con sangre.
- Fiebre en una persona embarazada, inmunodeprimida, con cáncer o con enfermedad crónica descompensada.
- Fiebre que aparece después de un viaje a una zona con enfermedades transmitidas por mosquitos.
- Fiebre con dificultad para respirar, dolor de pecho o confusión.

#### Signos de alarma

- Dificultad respiratoria o labios azulados.
- Convulsión.
- Pérdida de conocimiento o somnolencia difícil de despertar.
- Rigidez de cuello, dolor de cabeza intenso o manchas en la piel que no desaparecen al presionar.
- Signos de deshidratación grave: ausencia de orina, boca muy seca, ojos hundidos, llanto sin lágrimas.
- Piel pálida, fría o moteada, con pulso rápido y débil.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis, frecuencias ni duraciones. El paracetamol y el ibuprofeno son antipiréticos de uso frecuente, pero tienen contraindicaciones y efectos adversos. En niños, la indicación depende del peso y la edad. En caso de sospecha de dengue, consultar antes de usar cualquier medicamento.

#### Poblaciones que requieren precauciones especiales

- **Bebés menores de 3 meses:** cualquier fiebre requiere evaluación inmediata.
- **Niños pequeños:** no usar medicamentos de adultos ni adaptar dosis por cuenta propia.
- **Embarazadas:** consultar antes de tomar cualquier medicamento.
- **Adultos mayores:** pueden tener infecciones graves sin fiebre alta; consultar temprano.
- **Personas inmunodeprimidas:** la fiebre puede ser el único signo de una infección grave.

#### Fuentes

- MedlinePlus en español. «Fiebre». https://medlineplus.gov/spanish/fever.html (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Recomendaciones del Ministerio de Salud ante la ola de calor». https://www.argentina.gob.ar/noticias/recomendaciones-del-ministerio-de-salud-ante-la-ola-de-calor (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Síntomas y signos de alarma - Dengue». https://www.argentina.gob.ar/sintomas-y-signos-de-alarma (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-002 -->

<!-- INICIO ARTICULO: SIN-003 -->
### SIN-003 · Tos

- **Identificador:** `SIN-003`
- **Categoría:** Síntomas frecuentes
- **Título:** Tos
- **Resumen para recuperación:** La tos es un reflejo defensivo de las vías respiratorias. Suele acompañar resfriados y gripes, pero puede indicar asma, neumonía, reflujo u otras condiciones. La duración y los síntomas acompañantes orientan la consulta.
- **Palabras clave:** tos, tos seca, tos con flema, catarro, irritación de garganta, golpe de tos.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La tos es una respuesta del organismo para limpiar las vías respiratorias. Puede ser seca o con moco, y puede aparecer por infecciones, irritantes, asma, reflujo gastroesofágico o algunas enfermedades crónicas. La tos aguda dura menos de tres semanas; la tos persistente requiere evaluación.

#### Síntomas y características

- Tos seca, irritativa o con expectoración.
- Picazón o dolor de garganta.
- Congestión nasal o goteo posnasal.
- Ronquera o sensación de “cosquilleo” en el pecho.
- Empeoramiento nocturno en algunos casos.
- Cansancio o dolor muscular por el esfuerzo de toser.

#### Posibles causas (orientativas, sin diagnóstico)

Un profesional puede evaluar infecciones virales, gripe, resfriado, sinusitis, asma, alergias, reflujo, irritación por humo o productos químicos, neumonía y otras causas. La tos que dura semanas o se acompaña de otros síntomas necesita evaluación.

#### Recomendaciones generales y cuidados

- Beber líquidos con frecuencia para mantener las vías respiratorias hidratadas.
- Usar un humidificador de vapor frío o inhalar vapor de forma segura, sin agua hirviendo.
- Mantener el ambiente libre de humo de tabaco y de otros irritantes.
- Descansar y evitar el esfuerzo físico intenso mientras hay fiebre o malestar.
- En adultos y niños mayores de 1 año, una pequeña cantidad de miel puede aliviar la irritación; nunca dar miel a menores de 1 año por riesgo de botulismo.
- Lavarse las manos con frecuencia y cubrirse la boca al toser.

#### Qué evitar

- No fumar ni exponerse al humo de tabaco.
- No dar miel a bebés menores de 1 año.
- No usar jarabes ni medicamentos para la tos en niños pequeños sin indicación pediátrica.
- No tomar antibióticos por cuenta propia: la mayoría de las toses agudas son virales.
- No ignorar la tos con sangre, falta de aire o dolor de pecho.

#### Cuándo buscar atención médica

- La tos dura más de 3 semanas.
- Se acompaña de fiebre que persiste o vuelve.
- Hay dificultad para respirar, silbido al respirar o dolor de pecho.
- Hay expectoración con sangre.
- Hay pérdida de peso, sudoración nocturna o cansancio intenso.
- La tos aparece en un bebé, una persona mayor o alguien con enfermedad pulmonar crónica.
- La tos interfiere con el sueño o con la alimentación.

#### Signos de alarma

- Dificultad para respirar en reposo o al hablar.
- Labios o cara azulados.
- Hundimiento de las costillas al respirar en niños.
- Confusión, somnolencia o incapacidad para mantenerse despierto.
- Dolor de pecho intenso.
- Tos con sangre abundante.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. Los medicamentos para la tos y los descongestivos pueden tener efectos adversos y no están recomendados en niños pequeños sin evaluación. Los antibióticos solo se indican cuando un profesional confirma una infección bacteriana.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la tos con fiebre, respiración rápida o dificultad para alimentarse requiere evaluación pediátrica.
- **Embarazadas:** consultar antes de usar cualquier medicamento para la tos.
- **Adultos mayores:** consultar temprano, especialmente si hay enfermedades cardíacas o pulmonares.
- **Personas con asma o EPOC:** seguir el plan de acción indicado por su profesional y consultar si los síntomas empeoran.

#### Fuentes

- MedlinePlus en español. «Tos». https://medlineplus.gov/spanish/cough.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Neumonía». https://www.who.int/es/news-room/fact-sheets/detail/pneumonia (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Calendario Nacional de Vacunación». https://www.argentina.gob.ar/salud/vacunas (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-003 -->

<!-- INICIO ARTICULO: SIN-004 -->
### SIN-004 · Dolor de garganta

- **Identificador:** `SIN-004`
- **Categoría:** Síntomas frecuentes
- **Título:** Dolor de garganta
- **Resumen para recuperación:** El dolor de garganta es frecuente en infecciones virales como el resfriado. Puede deberse también a irritantes, alergias o infecciones bacterianas. La dificultad para tragar o respirar exige atención inmediata.
- **Palabras clave:** dolor de garganta, faringitis, amigdalitis, garganta irritada, dificultad para tragar, carraspera.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El dolor de garganta es una molestia o irritación en la faringe. La mayoría de los casos se debe a infecciones virales y mejora en pocos días. Algunas infecciones bacterianas, como la faringitis por estreptococo, requieren evaluación profesional. No es posible distinguir con certeza el origen solo por los síntomas.

#### Síntomas y características

- Dolor o picazón al tragar.
- Enrojecimiento de la garganta.
- Ronquera o voz apagada.
- Fiebre o malestar general.
- Ganglios del cuello sensibles.
- En algunos casos, placas blancas en las amígdalas.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a resfriado, gripe, otras infecciones virales, faringitis bacteriana, alergias, aire seco, humo, reflujo o irritantes químicos. Un profesional puede evaluar la causa y decidir si necesita estudios.

#### Recomendaciones generales y cuidados

- Beber líquidos con frecuencia y en pequeñas cantidades.
- Consumir alimentos blandos y fáciles de tragar.
- Mantener el ambiente húmedo con un humidificador de vapor frío.
- Hacer gárgaras con agua tibia y sal solo en adultos y niños mayores que sepan escupir, sin tragar la solución.
- Descansar y evitar hablar en exceso.
- Lavarse las manos y no compartir vasos ni cubiertos.

#### Qué evitar

- No fumar ni exponerse al humo.
- No tomar antibióticos por cuenta propia.
- No consumir bebidas muy frías, muy calientes, alcohólicas o irritantes si aumentan el dolor.
- No dar aspirina a niños o adolescentes.
- No ignorar la dificultad para respirar o tragar.

#### Cuándo buscar atención médica

- El dolor dura más de 3 a 5 días o empeora.
- Hay fiebre alta o persistente.
- Aparece un sarpullido.
- Hay amígdalas muy inflamadas con placas.
- El dolor impide comer o beber.
- La persona tiene inmunosupresión o enfermedad crónica.
- Hay antecedentes de fiebre reumática o infecciones recurrentes.

#### Signos de alarma

- Dificultad para respirar o para tragar saliva.
- Babeo o incapacidad para abrir la boca.
- Voz “de papa caliente” o hinchazón del cuello.
- Dolor intenso en un solo lado de la garganta.
- Fiebre alta con mal estado general.
- Rigidez de cuello o confusión.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. Los analgésicos y antipiréticos pueden aliviar el malestar, pero su indicación depende de la edad, el embarazo, las alergias y las enfermedades preexistentes. Los antibióticos solo deben usarse si un profesional los indica.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la negativa a alimentarse, la fiebre o la dificultad para respirar requieren evaluación pediátrica.
- **Embarazadas:** consultar antes de tomar cualquier medicamento.
- **Adultos mayores:** consultar temprano, especialmente si hay dificultad para tragar.
- **Personas inmunodeprimidas:** tienen mayor riesgo de infecciones graves.

#### Fuentes

- MedlinePlus en español. «Dolor de garganta». https://medlineplus.gov/spanish/sorethroat.html (consultado el 25/11/2026).
- MedlinePlus en español. «Resfriado común». https://medlineplus.gov/spanish/commoncold.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Gripe (estacional)». https://www.who.int/es/news-room/fact-sheets/detail/influenza-(seasonal) (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-004 -->

<!-- INICIO ARTICULO: SIN-005 -->
### SIN-005 · Congestión nasal

- **Identificador:** `SIN-005`
- **Categoría:** Síntomas frecuentes
- **Título:** Congestión nasal
- **Resumen para recuperación:** La congestión nasal es la sensación de nariz tapada por inflamación de los vasos de la nariz. Suele acompañar resfriados, gripes y alergias. Los lavados con solución fisiológica y la hidratación ayudan; los descongestivos nasales pueden causar rebote.
- **Palabras clave:** congestión nasal, nariz tapada, rinorrea, moqueo, goteo nasal, goteo posnasal, sinusitis.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La congestión nasal ocurre cuando los tejidos que recubren la nariz se hinchan por inflamación de los vasos sanguíneos. Puede acompañarse de secreción nasal o goteo posnasal. Habitualmente mejora en una semana, pero puede durar más o repetirse en personas con alergias.

#### Síntomas y características

- Sensación de nariz tapada o llena.
- Secreción nasal transparente, blanca o amarillenta.
- Goteo de moco hacia la garganta.
- Dificultad para respirar por la nariz.
- Dolor o presión facial.
- Tos o dolor de garganta por el goteo posnasal.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a resfriado, gripe, sinusitis, alergias, rinitis vasomotora, embarazo, pólipos nasales o uso excesivo de descongestivos nasales. Un profesional puede evaluar la causa si los síntomas persisten.

#### Recomendaciones generales y cuidados

- Beber líquidos claros con frecuencia.
- Aplicar un paño tibio y húmedo en la cara varias veces al día.
- Usar solución fisiológica nasal o lavados nasales con agua segura.
- Mantener la cabeza elevada al dormir.
- Usar un humidificador de vapor frío y limpiarlo según las instrucciones.
- Evitar el humo y los irritantes.

#### Qué evitar

- No usar descongestivos nasales de venta libre por más de 3 días seguidos: pueden empeorar la congestión.
- No usar medicamentos de adultos en niños pequeños.
- No introducir objetos ni hisopos profundamente en la nariz.
- No usar agua no segura para lavados nasales.
- No tomar antibióticos sin indicación profesional.

#### Cuándo buscar atención médica

- La congestión dura más de 3 semanas.
- Hay dolor facial intenso, hinchazón alrededor de los ojos o visión borrosa.
- La secreción sale por un solo lado, tiene mal olor o color verdoso.
- Hay fiebre alta o persistente.
- Hay antecedente de traumatismo craneal.
- Los síntomas empeoran después de una mejoría inicial.

#### Signos de alarma

- Hinchazón de frente, ojos o mejillas.
- Visión borrosa o dolor ocular.
- Dificultad respiratoria.
- Fiebre alta con rigidez de cuello o confusión.
- Sangrado nasal abundante que no cede.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. La solución fisiológica nasal es una medida de higiene. Los descongestivos y antihistamínicos pueden tener efectos adversos y contraindicaciones; consultar antes de usarlos, especialmente en niños, embarazadas y personas con hipertensión o enfermedades cardíacas.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** usar solo medidas indicadas por el pediatra; no aplicar descongestivos.
- **Embarazadas:** consultar antes de usar cualquier medicamento.
- **Adultos mayores:** consultar por riesgo de efectos adversos.
- **Personas con hipertensión, glaucoma o enfermedad cardíaca:** evitar descongestivos sin indicación profesional.

#### Fuentes

- MedlinePlus en español. «Rinorrea o congestión nasal en adultos». https://medlineplus.gov/spanish/ency/article/003049.htm (consultado el 25/11/2026).
- MedlinePlus en español. «Rinorrea o congestión nasal en niños». https://medlineplus.gov/spanish/ency/article/003051.htm (consultado el 25/11/2026).
- MedlinePlus en español. «Resfriado común». https://medlineplus.gov/spanish/commoncold.html (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-005 -->

<!-- INICIO ARTICULO: SIN-006 -->
### SIN-006 · Dolor muscular

- **Identificador:** `SIN-006`
- **Categoría:** Síntomas frecuentes
- **Título:** Dolor muscular
- **Resumen para recuperación:** El dolor muscular o mialgia es frecuente por sobrecarga, tensión o infecciones virales. También puede deberse a medicamentos, trastornos metabólicos o enfermedades inflamatorias. El dolor intenso con orina oscura o debilidad requiere consulta urgente.
- **Palabras clave:** mialgia, dolor muscular, dolores en el cuerpo, calambres, contractura, sobrecarga.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El dolor muscular puede afectar uno o varios músculos y también sentirse en ligamentos, tendones o fascias. Es habitual después de un esfuerzo físico, por tensión o durante infecciones virales. La mayoría de los cuadros son leves y mejoran con descanso, pero algunos pueden indicar una enfermedad que requiere evaluación.

#### Síntomas y características

- Dolor sordo, sensibilidad o rigidez muscular.
- Molestia al mover la zona afectada.
- Debilidad o cansancio.
- Inflamación o calor local en algunos casos.
- Dolor generalizado durante una infección.

#### Posibles causas (orientativas, sin diagnóstico)

Un profesional puede evaluar sobrecarga o lesión, tensión, estrés, infecciones como la gripe, efectos de medicamentos (por ejemplo, estatinas), desequilibrios de electrolitos, fibromialgia, enfermedades inflamatorias o, con menor frecuencia, rabdomiólisis. No es posible determinar la causa solo por el dolor.

#### Recomendaciones generales y cuidados

- Descansar la zona afectada y evitar el esfuerzo intenso.
- Mantener una hidratación adecuada.
- Aplicar frío en las primeras 48 horas de una lesión aguda y calor suave después, si resulta cómodo.
- Hacer estiramientos suaves cuando el dolor lo permita.
- Dormir lo suficiente y manejar el estrés.
- Consultar si el dolor aparece después de iniciar un medicamento nuevo.

#### Qué evitar

- No hacer masajes intensos ni estiramientos forzados sobre un músculo lesionado.
- No volver a la actividad intensa antes de que el dolor mejore.
- No automedicarse de forma repetida.
- No consumir alcohol en exceso.
- No ignorar la debilidad intensa o la orina oscura.

#### Cuándo buscar atención médica

- El dolor persiste más de 3 días o es intenso e inexplicable.
- Hay hinchazón, enrojecimiento o calor alrededor del músculo.
- Hay debilidad, calambres o pérdida de sensibilidad.
- Aparece después de un golpe o una caída.
- Se acompaña de fiebre, sarpullido o dolor articular.
- La persona toma estatinas, diuréticos o medicamentos nuevos.
- Hay antecedentes de enfermedad renal o metabólica.

#### Signos de alarma

- Orina muy oscura o de color “coca cola”.
- Debilidad muscular intensa o incapacidad para mover una extremidad.
- Dolor muscular con fiebre alta y mal estado general.
- Hinchazón dura de una pierna con dolor y calor.
- Dolor de pecho o dificultad para respirar.
- Confusión o disminución de la cantidad de orina.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. Los analgésicos y antiinflamatorios pueden tener contraindicaciones y no deben usarse de forma prolongada sin evaluación. Si el dolor aparece después de un medicamento nuevo, no suspenderlo por cuenta propia: consultar con el profesional que lo indicó.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** el dolor muscular con fiebre o dificultad para caminar requiere evaluación pediátrica.
- **Embarazadas:** consultar antes de usar cualquier medicamento.
- **Adultos mayores:** tienen mayor riesgo de efectos adversos por medicamentos y de lesiones.
- **Personas con enfermedad renal, hepática o cardiovascular:** consultar antes de usar antiinflamatorios.

#### Fuentes

- MedlinePlus en español. «Dolores musculares». https://medlineplus.gov/spanish/ency/article/003178.htm (consultado el 25/11/2026).
- MedlinePlus en español. «Distensión muscular». https://medlineplus.gov/spanish/ency/article/000042.htm (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Gripe (estacional)». https://www.who.int/es/news-room/fact-sheets/detail/influenza-(seasonal) (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-006 -->

<!-- INICIO ARTICULO: SIN-007 -->
### SIN-007 · Náuseas

- **Identificador:** `SIN-007`
- **Categoría:** Síntomas frecuentes
- **Título:** Náuseas
- **Resumen para recuperación:** Las náuseas son la sensación de querer vomitar. Pueden aparecer por infecciones, alimentos, embarazo, medicamentos, mareos o problemas abdominales. La náusea persistente con deshidratación o dolor intenso requiere consulta.
- **Palabras clave:** náuseas, asco, malestar estomacal, ganas de vomitar, estómago revuelto.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La náusea es una sensación desagradable en el estómago o la garganta que puede preceder al vómito. Es un síntoma inespecífico y puede deberse a muchas causas. La mayoría de los episodios son transitorios, pero la persistencia puede provocar deshidratación y requiere evaluación.

#### Síntomas y características

- Sensación de malestar en el estómago.
- Salivación aumentada.
- Sudoración fría o palidez.
- Mareo o debilidad.
- Arcadas o vómitos.
- Falta de apetito.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a gastroenteritis, intoxicación alimentaria, reflujo, migraña, mareos por movimiento, embarazo, efectos de medicamentos, dolor intenso, ansiedad o problemas abdominales. Un profesional debe evaluar la causa si persiste.

#### Recomendaciones generales y cuidados

- Beber pequeños sorbos de agua segura o solución de rehidratación oral con frecuencia.
- Comer porciones pequeñas y frecuentes de alimentos blandos si se toleran.
- Evitar olores fuertes y comidas grasosas.
- Descansar y ventilar el ambiente.
- No acostarse inmediatamente después de comer.
- Si hay vómitos, seguir las recomendaciones del artículo `SIN-008`.

#### Qué evitar

- No ingerir grandes cantidades de líquido de una sola vez.
- No consumir alcohol, café ni bebidas gaseosas en exceso.
- No automedicarse con antieméticos.
- No forzar la alimentación si hay vómitos.
- No ignorar la náusea con dolor abdominal intenso o signos de deshidratación.

#### Cuándo buscar atención médica

- La náusea persiste más de 24 a 48 horas o impide beber.
- Hay vómitos repetidos o signos de deshidratación.
- Hay dolor abdominal intenso o localizado.
- Hay fiebre alta, dolor de cabeza intenso o rigidez de cuello.
- La persona está embarazada y no puede retener líquidos.
- Hay diabetes, enfermedad renal o tratamiento con quimioterapia.
- Aparece después de un golpe en la cabeza.

#### Signos de alarma

- Vómito con sangre o con aspecto de “borra de café”.
- Vómito verde o amarillo intenso (bilis).
- Dolor abdominal intenso y continuo.
- Confusión, somnolencia o pérdida de conocimiento.
- Ausencia de orina, boca muy seca u ojos hundidos.
- Dificultad respiratoria o dolor de pecho.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. Los antieméticos pueden tener efectos adversos e interacciones; su uso debe ser indicado por un profesional. En embarazo y en niños, la indicación es especialmente cuidadosa.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la náusea con vómitos o falta de apetito requiere evaluación pediátrica.
- **Embarazadas:** consultar antes de usar cualquier medicamento; la deshidratación requiere atención.
- **Adultos mayores:** tienen mayor riesgo de deshidratación y de interacciones medicamentosas.
- **Personas con diabetes:** la náusea puede alterar la alimentación y el control de la glucosa.

#### Fuentes

- MedlinePlus en español. «Náuseas y vómitos». https://medlineplus.gov/spanish/nauseaandvomiting.html (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-007 -->

<!-- INICIO ARTICULO: SIN-008 -->
### SIN-008 · Vómitos

- **Identificador:** `SIN-008`
- **Categoría:** Síntomas frecuentes
- **Título:** Vómitos
- **Resumen para recuperación:** El vómito es la expulsión del contenido del estómago. Frecuentemente acompaña gastroenteritis, pero puede indicar obstrucción, intoxicación, lesión o enfermedad grave. Lo más importante es prevenir la deshidratación y detectar signos de alarma.
- **Palabras clave:** vómito, vomitar, arcadas, expulsión, deshidratación, gastroenteritis.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El vómito es la expulsión forzada del contenido del estómago por la boca. Puede ser un mecanismo de defensa frente a toxinas o acompañar infecciones digestivas. La pérdida de líquidos y electrolitos puede ser rápida, especialmente en bebés, niños pequeños y adultos mayores.

#### Síntomas y características

- Arcadas y expulsión de contenido gástrico.
- Náusea previa.
- Sudoración, palidez o mareo.
- Dolor abdominal.
- Diarrea asociada en muchos casos.
- Sed, boca seca o disminución de la orina si hay deshidratación.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a gastroenteritis viral, intoxicación alimentaria, reflujo, migraña, mareo por movimiento, embarazo, efectos de medicamentos, obstrucción intestinal, apendicitis u otras condiciones. El vómito repetido o con sangre requiere evaluación urgente.

#### Recomendaciones generales y cuidados

- Ofrecer pequeños sorbos de solución de rehidratación oral o agua segura, con frecuencia.
- Esperar unos minutos si el vómito se repite y volver a ofrecer pequeñas cantidades.
- Continuar la lactancia materna en bebés, sin interrumpirla.
- Reintroducir alimentos blandos de forma gradual cuando se toleren.
- Mantener a la persona sentada o incorporada durante el vómito para evitar atragantamiento.
- Lavarse las manos después de cada episodio y limpiar la zona.

#### Qué evitar

- No dar grandes volúmenes de líquido de una sola vez.
- No dar bebidas azucaradas, energizantes ni alcohol.
- No usar medicamentos antieméticos sin indicación.
- No forzar alimentos sólidos si hay vómitos persistentes.
- No acostar a la persona boca arriba si está somnolienta o inconsciente.

#### Cuándo buscar atención médica

- El vómito persiste más de 24 horas en adultos o más de 12 horas en niños.
- Hay signos de deshidratación.
- Hay sangre o bilis en el vómito.
- Hay dolor abdominal intenso o abdominal rígido.
- Hay fiebre alta, dolor de cabeza intenso o rigidez de cuello.
- El vómito aparece después de un golpe en la cabeza.
- La persona está embarazada, es un bebé o un adulto mayor.
- Hay diabetes, enfermedad renal o tratamiento inmunosupresor.

#### Signos de alarma

- Vómito con sangre o “borra de café”.
- Vómito verde intenso.
- Dolor abdominal intenso y continuo.
- Ausencia de orina, boca muy seca, ojos hundidos o llanto sin lágrimas.
- Somnolencia excesiva, confusión o pérdida de conocimiento.
- Convulsión.
- Dificultad respiratoria.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. La solución de rehidratación oral es un producto de rehidratación, no un medicamento para “cortar” el vómito. Los antieméticos solo deben usarse con indicación profesional.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la deshidratación puede ser rápida; consultar temprano.
- **Embarazadas:** la deshidratación y los vómitos persistentes requieren evaluación.
- **Adultos mayores:** tienen mayor riesgo de deshidratación y de complicaciones.
- **Personas con diabetes:** el vómito puede alterar la glucemia y la absorción de medicamentos.

#### Fuentes

- MedlinePlus en español. «Náuseas y vómitos». https://medlineplus.gov/spanish/nauseaandvomiting.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-008 -->

<!-- INICIO ARTICULO: SIN-009 -->
### SIN-009 · Diarrea

- **Identificador:** `SIN-009`
- **Categoría:** Síntomas frecuentes
- **Título:** Diarrea
- **Resumen para recuperación:** La diarrea son deposiciones líquidas o blandas, generalmente tres o más veces al día. La mayoría de los casos son infecciosos y autolimitados. El objetivo principal es prevenir la deshidratación y detectar signos de alarma.
- **Palabras clave:** diarrea, deposiciones líquidas, colitis, gastroenteritis, deshidratación, materia fecal.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Se habla de diarrea cuando hay deposiciones líquidas o blandas, con mayor frecuencia de lo habitual; el Ministerio de Salud de la Nación la describe como tres o más deposiciones sueltas o líquidas por día. Puede ser aguda (de corta duración) o persistente. Las causas más frecuentes son infecciones virales, bacterianas o parasitarias transmitidas por agua o alimentos contaminados.

#### Síntomas y características

- Deposiciones líquidas o blandas.
- Urgencia para evacuar.
- Dolor o cólicos abdominales.
- Náuseas, vómitos o fiebre.
- Deshidratación: sed, boca seca, orina oscura o escasa.
- En algunos casos, moco o sangre en las heces.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a infecciones gastrointestinales, intoxicación alimentaria, intolerancias, efectos de antibióticos, enfermedad inflamatoria intestinal o síndrome de intestino irritable. La presencia de sangre, fiebre alta o diarrea persistente requiere evaluación.

#### Recomendaciones generales y cuidados

- Beber líquidos con frecuencia; usar solución de rehidratación oral si está disponible.
- Continuar la lactancia materna en bebés.
- Mantener la alimentación habitual o fraccionada si se tolera; no suspenderla de forma prolongada.
- Lavarse las manos con agua y jabón después de ir al baño y antes de comer.
- Mantener los alimentos y el agua seguros.
- Consultar si la diarrea es intensa o persistente.

#### Qué evitar

- No usar antidiarreicos sin indicación, especialmente si hay fiebre o sangre en las heces.
- No tomar antibióticos por cuenta propia.
- No consumir bebidas azucaradas, energizantes ni alcohol en exceso.
- No preparar soluciones caseras con medidas incorrectas.
- No suspender la lactancia materna.

#### Cuándo buscar atención médica

- Hay sangre o moco en las heces.
- Hay fiebre alta o persistente.
- Hay signos de deshidratación.
- La diarrea dura más de 2 días en niños o más de 3 días en adultos.
- Hay vómitos que impiden beber.
- Hay dolor abdominal intenso.
- Aparece después de un viaje, de tomar antibióticos o en una persona inmunodeprimida.
- La persona está embarazada, es un bebé o un adulto mayor.

#### Signos de alarma

- Ausencia de orina por varias horas, boca muy seca u ojos hundidos.
- Somnolencia excesiva, confusión o debilidad intensa.
- Piel pálida, fría o moteada.
- Heces con sangre abundante o negras.
- Dolor abdominal intenso y continuo.
- Fiebre alta con mal estado general.
- Convulsión.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. La solución de rehidratación oral es la medida de referencia para prevenir y tratar la deshidratación leve o moderada. Los antidiarreicos y antibióticos solo deben usarse con indicación profesional. El zinc en niños puede ser indicado por un profesional según el protocolo local.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la deshidratación puede ser rápida; no interrumpir la lactancia y consultar temprano.
- **Embarazadas:** la deshidratación y las infecciones requieren evaluación.
- **Adultos mayores:** tienen mayor riesgo de complicaciones y deshidratación.
- **Personas inmunodeprimidas:** la diarrea puede ser grave y requerir estudios.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).
- MedlinePlus en español. «Diarrea». https://medlineplus.gov/spanish/diarrhea.html (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-009 -->

<!-- INICIO ARTICULO: SIN-010 -->
### SIN-010 · Dolor abdominal

- **Identificador:** `SIN-010`
- **Categoría:** Síntomas frecuentes
- **Título:** Dolor abdominal
- **Resumen para recuperación:** El dolor abdominal es una molestia en el abdomen con muchas causas posibles, desde digestivas leves hasta urgencias quirúrgicas. La localización, la intensidad y los síntomas acompañantes son importantes. El dolor intenso o con signos de alarma requiere atención inmediata.
- **Palabras clave:** dolor de panza, dolor abdominal, cólico, dolor de estómago, abdomen, retortijones.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El dolor abdominal puede originarse en el aparato digestivo, urinario, reproductivo o en otras estructuras. Puede ser leve y transitorio, o indicar una urgencia como apendicitis, obstrucción, pancreatitis o hemorragia. No es posible determinar la causa solo por la localización del dolor.

#### Síntomas y características

- Dolor difuso o localizado.
- Cólicos o dolor continuo.
- Hinchazón o distensión abdominal.
- Náuseas, vómitos o diarrea.
- Fiebre.
- Falta de apetito.
- Cambios en las deposiciones o en la micción.

#### Posibles causas (orientativas, sin diagnóstico)

Un profesional puede evaluar causas digestivas (gastritis, gastroenteritis, estreñimiento, apendicitis), urinarias (infección, cálculos), ginecológicas (menstruación, embarazo ectópico), musculares o relacionadas con otros órganos. El dolor intenso o progresivo requiere evaluación urgente.

#### Recomendaciones generales y cuidados

- Descansar y evitar comidas abundantes mientras se evalúa el dolor.
- Beber líquidos con pequeños sorbos si no hay vómitos.
- Anotar la localización, la intensidad, el inicio y los síntomas acompañantes.
- Evitar aplicar calor intenso en el abdomen sin saber la causa.
- Consultar si el dolor no mejora o empeora.

#### Qué evitar

- No automedicarse con analgésicos: pueden enmascarar un cuadro grave.
- No usar laxantes ni enemas sin indicación.
- No consumir alcohol ni comidas irritantes.
- No demorar la consulta si el dolor es intenso.
- No asumir que es “un cólico” si hay fiebre o vómitos persistentes.

#### Cuándo buscar atención médica

- El dolor es intenso, continuo o empeora progresivamente.
- Hay fiebre, vómitos persistentes o imposibilidad de beber.
- Hay sangre en las heces o en la orina.
- Hay ausencia de eliminación de gases o heces.
- El abdomen está rígido o muy sensible al tacto.
- El dolor aparece en una persona embarazada.
- Hay antecedente de traumatismo abdominal.
- El dolor se localiza en la parte inferior derecha y se acompaña de fiebre o vómitos.

#### Signos de alarma

- Abdomen rígido, “en tabla”, o dolor intenso al tocarlo.
- Desmayo, palidez, sudoración fría o pulso rápido.
- Vómito con sangre o con bilis.
- Heces negras o con sangre.
- Dificultad respiratoria.
- Fiebre alta con confusión.
- Dolor intenso en el pecho o el hombro que se irradia.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. Los analgésicos pueden aliviar el dolor pero también enmascarar una enfermedad grave; no deben usarse para “aguantar” antes de la consulta. Los antibióticos y antiinflamatorios requieren indicación profesional.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** el dolor abdominal con llanto inconsolable, vómitos o sangre en las heces requiere evaluación pediátrica.
- **Embarazadas:** el dolor abdominal puede indicar una urgencia obstétrica; consultar de inmediato.
- **Adultos mayores:** pueden tener cuadros graves con síntomas leves; consultar temprano.
- **Personas con cirugías abdominales previas:** mayor riesgo de obstrucción.

#### Fuentes

- MedlinePlus en español. «Dolor abdominal». https://medlineplus.gov/spanish/abdominalpain.html (consultado el 25/11/2026).
- MedlinePlus en español. «Náuseas y vómitos». https://medlineplus.gov/spanish/nauseaandvomiting.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: SIN-010 -->

---

# Categoría 2 · Enfermedades frecuentes

> **Nota de categoría:** los artículos describen enfermedades comunes desde una perspectiva educativa. No permiten confirmar un diagnóstico ni indicar un tratamiento. Cada enfermedad puede presentarse de forma diferente según la edad y los antecedentes de la persona.

<!-- INICIO ARTICULO: ENF-001 -->
### ENF-001 · Resfriado común

- **Identificador:** `ENF-001`
- **Categoría:** Enfermedades frecuentes
- **Título:** Resfriado común
- **Resumen para recuperación:** El resfriado común es una infección viral de las vías respiratorias superiores, leve y autolimitada. Se transmite por gotitas y contacto. No requiere antibióticos y mejora con medidas generales de cuidado.
- **Palabras clave:** resfriado, catarro, rinovirus, infección viral, moqueo, congestión, estornudos.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El resfriado común es una infección viral de la nariz y la garganta. Es una de las enfermedades más frecuentes y suele resolverse en una o dos semanas. Los adultos pueden tener varios resfriados por año; los niños pequeños, más. No es lo mismo que la gripe: el resfriado suele comenzar de forma gradual y con síntomas más leves.

#### Síntomas y características

- Congestión nasal o secreción.
- Estornudos.
- Dolor o picazón de garganta.
- Tos leve.
- Dolor de cabeza o malestar general.
- Fiebre baja, más frecuente en niños.
- Cansancio.

#### Posibles causas (orientativas, sin diagnóstico)

Está causado por virus respiratorios, especialmente rinovirus. Se transmite por gotitas respiratorias, por contacto con manos contaminadas y por superficies. No se transmite por el frío en sí, aunque las condiciones de hacinamiento y la temporada favorecen la circulación de virus.

#### Recomendaciones generales y cuidados

- Descansar y beber líquidos con frecuencia.
- Usar solución fisiológica nasal o humidificador de vapor frío.
- Mantener una alimentación habitual si se tolera.
- Lavarse las manos con frecuencia.
- Cubrirse la boca al toser o estornudar.
- Evitar el humo de tabaco.
- En adultos y niños mayores de 1 año, una pequeña cantidad de miel puede aliviar la irritación de garganta; nunca dar miel a menores de 1 año.

#### Qué evitar

- No tomar antibióticos: el resfriado es viral.
- No usar aspirina en niños o adolescentes.
- No dar medicamentos para la tos o el resfriado a niños pequeños sin indicación pediátrica.
- No compartir vasos, cubiertos ni toallas.
- No fumar ni exponerse al humo.

#### Cuándo buscar atención médica

- Los síntomas duran más de 10 días sin mejorar.
- Hay fiebre alta o que persiste más de 3 días.
- Hay dificultad para respirar, silbido o dolor de pecho.
- Hay dolor de oído intenso o secreción del oído.
- Hay dolor facial intenso o empeoramiento después de una mejoría.
- La persona es un bebé, un adulto mayor o tiene enfermedad crónica.
- Hay inmunosupresión.

#### Signos de alarma

- Dificultad respiratoria.
- Labios azulados.
- Somnolencia intensa o dificultad para despertar.
- Fiebre en un bebé menor de 3 meses.
- Deshidratación.
- Convulsión.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. No existe un tratamiento que “cure” el resfriado; los medicamentos de venta libre solo alivian síntomas y pueden tener efectos adversos. Los antibióticos no actúan sobre los virus. En niños pequeños, muchas combinaciones de venta libre no están recomendadas.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** consultar antes de usar cualquier medicamento; la dificultad para alimentarse o respirar requiere evaluación.
- **Embarazadas:** consultar antes de tomar medicamentos.
- **Adultos mayores:** pueden tener complicaciones; consultar temprano.
- **Personas con asma, EPOC o inmunosupresión:** mayor riesgo de complicaciones.

#### Fuentes

- MedlinePlus en español. «Resfriado común». https://medlineplus.gov/spanish/commoncold.html (consultado el 25/11/2026).
- MedlinePlus en español. «Resfriado común» (enciclopedia médica). https://medlineplus.gov/spanish/ency/article/000678.htm (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Gripe (estacional)». https://www.who.int/es/news-room/fact-sheets/detail/influenza-(seasonal) (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ENF-001 -->

<!-- INICIO ARTICULO: ENF-002 -->
### ENF-002 · Gripe

- **Identificador:** `ENF-002`
- **Categoría:** Enfermedades frecuentes
- **Título:** Gripe
- **Resumen para recuperación:** La gripe es una infección viral causada por el virus influenza. Comienza de forma súbita con fiebre, tos, dolor muscular y cansancio. Puede ser grave en personas de riesgo. La vacunación anual es la principal medida de prevención.
- **Palabras clave:** gripe, influenza, virus influenza, fiebre súbita, dolor muscular, vacuna antigripal.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La gripe o influenza es una infección de la nariz, la garganta y los pulmones causada por virus influenza. A diferencia del resfriado, suele comenzar de forma abrupta y con malestar intenso. La mayoría de las personas se recupera en una semana aproximadamente, pero algunas pueden tener complicaciones graves, especialmente embarazadas, niños pequeños, adultos mayores y personas con enfermedades crónicas.

#### Síntomas y características

- Aparición súbita de fiebre.
- Tos, generalmente seca.
- Dolor de cabeza.
- Dolores musculares y articulares.
- Dolor de garganta y congestión nasal.
- Cansancio intenso.
- En niños, vómitos o diarrea pueden ser más frecuentes que en adultos.

#### Posibles causas (orientativas, sin diagnóstico)

Está causada por virus influenza A y B, que circulan estacionalmente. Se transmite por gotitas respiratorias y por contacto con superficies contaminadas. La vacunación anual reduce el riesgo de enfermedad grave, aunque no elimina por completo la posibilidad de infectarse.

#### Recomendaciones generales y cuidados

- Quedarse en casa para evitar contagiar a otras personas.
- Descansar y beber líquidos con frecuencia.
- Mantener una alimentación liviana si se tolera.
- Lavarse las manos y cubrirse la boca al toser o estornudar.
- Ventilar los ambientes.
- Controlar la temperatura y los síntomas.
- Consultar temprano si se pertenece a un grupo de riesgo.

#### Qué evitar

- No tomar antibióticos: la gripe es viral.
- No dar aspirina a niños o adolescentes.
- No automedicarse con antivirales; solo se usan con indicación profesional.
- No volver a la actividad intensa hasta sentirse recuperado.
- No minimizar los síntomas en personas de riesgo.

#### Cuándo buscar atención médica

- Hay dificultad para respirar o falta de aire.
- Hay dolor o presión en el pecho.
- Hay confusión, mareos intensos o dificultad para mantenerse despierto.
- Hay signos de deshidratación.
- La fiebre o la tos mejoran y luego vuelven o empeoran.
- La persona es embarazada, menor de 5 años, mayor de 65 años o tiene enfermedad crónica.
- Hay inmunosupresión.

#### Signos de alarma

- Dificultad respiratoria o labios azulados.
- Dolor de pecho persistente.
- Convulsión.
- Pérdida de conocimiento.
- Confusión o incapacidad para estar alerta.
- Ausencia de orina o deshidratación grave.
- En niños: dificultad para respirar, irritabilidad extrema o falta de interacción.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. Los antivirales son medicamentos de prescripción y deben iniciarse según indicación profesional. Los analgésicos y antipiréticos pueden aliviar síntomas, pero tienen contraindicaciones. En caso de sospecha de dengue, evitar aspirina e ibuprofeno y consultar.

#### Poblaciones que requieren precauciones especiales

- **Embarazadas:** la gripe puede ser grave; consultar temprano y vacunarse según el calendario.
- **Niños menores de 5 años:** mayor riesgo de complicaciones.
- **Adultos mayores:** pueden presentar síntomas atípicos; consultar temprano.
- **Personas con enfermedades crónicas:** asma, diabetes, cardiopatías, enfermedad renal o inmunosupresión aumentan el riesgo.
- **Personal de salud y cuidadores:** la vacunación anual ayuda a proteger a quienes cuidan.

#### Fuentes

- Organización Mundial de la Salud. «Gripe (estacional)». https://www.who.int/es/news-room/fact-sheets/detail/influenza-(seasonal) (consultado el 25/11/2026).
- MedlinePlus en español. «Gripe». https://medlineplus.gov/spanish/flu.html (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Calendario Nacional de Vacunación». https://www.argentina.gob.ar/salud/vacunas (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ENF-002 -->

<!-- INICIO ARTICULO: ENF-003 -->
### ENF-003 · Gastroenteritis

- **Identificador:** `ENF-003`
- **Categoría:** Enfermedades frecuentes
- **Título:** Gastroenteritis
- **Resumen para recuperación:** La gastroenteritis es la inflamación del estómago y los intestinos, generalmente por una infección viral. Produce diarrea, vómitos y dolor abdominal. La mayoría de los casos mejora sola; el riesgo principal es la deshidratación.
- **Palabras clave:** gastroenteritis, infección gastrointestinal, diarrea, vómitos, dolor abdominal, deshidratación, virus.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La gastroenteritis es una inflamación del tracto digestivo que suele manifestarse con diarrea, vómitos y dolor abdominal. Puede ser causada por virus, bacterias o parásitos. La mayoría de los casos son leves y se resuelven en pocos días, pero la pérdida de líquidos puede ser peligrosa, especialmente en niños pequeños y adultos mayores.

#### Síntomas y características

- Diarrea acuosa.
- Náuseas y vómitos.
- Dolor o cólicos abdominales.
- Fiebre o malestar general.
- Pérdida de apetito.
- Signos de deshidratación si no se reponen líquidos.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a norovirus, rotavirus, bacterias como Salmonella o E. coli, parásitos, intoxicación alimentaria o efectos de antibióticos. La transmisión suele ser fecal-oral, por agua o alimentos contaminados o por manos sin lavar.

#### Recomendaciones generales y cuidados

- Reponer líquidos con frecuencia; usar solución de rehidratación oral si está disponible.
- Continuar la lactancia materna en bebés.
- Mantener una alimentación fraccionada y de fácil digestión cuando se tolere.
- Lavarse las manos con agua y jabón después de ir al baño y antes de comer.
- Limpiar y desinfectar superficies y utensilios.
- Evitar compartir vasos, cubiertos o toallas.

#### Qué evitar

- No usar antidiarreicos sin indicación, especialmente con fiebre o sangre en las heces.
- No tomar antibióticos por cuenta propia.
- No preparar soluciones de rehidratación con medidas incorrectas.
- No consumir bebidas azucaradas o alcohol en exceso.
- No suspender la lactancia materna.

#### Cuándo buscar atención médica

- Hay sangre o moco en las heces.
- Hay fiebre alta o persistente.
- Hay vómitos que impiden beber.
- Hay signos de deshidratación.
- La diarrea dura más de 2 días en niños o más de 3 días en adultos.
- El dolor abdominal es intenso.
- La persona está embarazada, es un bebé, un adulto mayor o tiene inmunosupresión.
- Aparece después de un viaje o de tomar antibióticos.

#### Signos de alarma

- Ausencia de orina, boca muy seca u ojos hundidos.
- Somnolencia excesiva, confusión o debilidad intensa.
- Piel pálida, fría o moteada.
- Heces con sangre abundante o negras.
- Dolor abdominal intenso y continuo.
- Convulsión.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. La solución de rehidratación oral es la medida principal para reponer líquidos y electrolitos. Los antidiarreicos, antibióticos y probióticos deben usarse solo con indicación profesional.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** mayor riesgo de deshidratación; consultar temprano.
- **Embarazadas:** la deshidratación requiere evaluación.
- **Adultos mayores:** pueden deshidratarse rápidamente.
- **Personas inmunodeprimidas:** mayor riesgo de infecciones graves.

#### Fuentes

- MedlinePlus en español. «Gastroenteritis». https://medlineplus.gov/spanish/gastroenteritis.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ENF-003 -->

<!-- INICIO ARTICULO: ENF-004 -->
### ENF-004 · Infecciones respiratorias frecuentes

- **Identificador:** `ENF-004`
- **Categoría:** Enfermedades frecuentes
- **Título:** Infecciones respiratorias frecuentes
- **Resumen para recuperación:** Las infecciones respiratorias frecuentes son un grupo de cuadros que afectan nariz, garganta, senos, oído o pulmones. La mayoría son virales y leves. La prevención incluye vacunación, higiene de manos, ventilación y evitar el humo.
- **Palabras clave:** infección respiratoria, vías respiratorias, catarro, faringitis, sinusitis, otitis, bronquitis, neumonía, prevención.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Las infecciones respiratorias frecuentes incluyen cuadros de las vías respiratorias superiores e inferiores, como resfriado, faringitis, sinusitis, otitis media, bronquitis y neumonía. La mayoría de las infecciones respiratorias agudas son virales y se resuelven sin antibióticos. Algunas pueden ser bacterianas o complicarse, especialmente en personas de riesgo.

Este artículo aborda el concepto general y las medidas de prevención. No reemplaza la información específica de cada enfermedad ni permite distinguir una infección viral de una bacteriana.

#### Síntomas y características

- Congestión o secreción nasal.
- Dolor de garganta y tos.
- Fiebre o malestar general.
- Dolor de oído o facial.
- Dificultad para respirar o silbido, en cuadros de vías inferiores.
- Cansancio y falta de apetito.

#### Posibles causas (orientativas, sin diagnóstico)

Pueden ser causadas por virus (rinovirus, influenza, virus sincicial respiratorio, entre otros) o bacterias. Los factores de riesgo incluyen edad temprana o avanzada, prematurez, hacinamiento, humo de tabaco, contaminación del aire, enfermedades crónicas e inmunosupresión.

#### Recomendaciones generales y cuidados

- Lavarse las manos con frecuencia.
- Cubrirse la boca al toser o estornudar.
- Ventilar los ambientes.
- Evitar el humo de tabaco y la exposición a irritantes.
- Mantener el calendario de vacunación al día.
- Descansar, hidratarse y alimentarse si se tolera.
- Consultar temprano si hay factores de riesgo.

#### Qué evitar

- No tomar antibióticos sin indicación.
- No fumar ni exponer a niños al humo.
- No automedicarse con descongestivos o jarabes en niños pequeños.
- No enviar a un niño con fiebre o dificultad respiratoria a la escuela o jardín.
- No minimizar la dificultad respiratoria.

#### Cuándo buscar atención médica

- Hay dificultad para respirar, silbido o respiración rápida.
- Hay dolor de pecho.
- Hay fiebre alta o persistente.
- Hay dolor de oído intenso o secreción.
- Hay dolor facial intenso o empeoramiento después de una mejoría.
- La tos dura más de 3 semanas.
- La persona es un bebé, un adulto mayor, una embarazada o tiene enfermedad crónica.
- Hay inmunosupresión.

#### Signos de alarma

- Dificultad respiratoria en reposo.
- Labios o cara azulados.
- Hundimiento de las costillas al respirar en niños.
- Somnolencia intensa o confusión.
- Incapacidad para beber o alimentarse.
- Convulsión.
- Fiebre en un bebé menor de 3 meses.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. Los antibióticos solo se indican cuando un profesional sospecha o confirma una infección bacteriana. El uso innecesario contribuye a la resistencia antimicrobiana. Los antivirales para influenza son de prescripción.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños pequeños:** mayor riesgo de bronquiolitis y neumonía.
- **Embarazadas:** consultar temprano y mantener la vacunación al día.
- **Adultos mayores:** mayor riesgo de complicaciones.
- **Personas con asma, EPOC, cardiopatías o diabetes:** mayor riesgo de descompensación.
- **Personas inmunodeprimidas:** consultar de inmediato ante fiebre o síntomas respiratorios.

#### Fuentes

- Organización Mundial de la Salud. «Neumonía». https://www.who.int/es/news-room/fact-sheets/detail/pneumonia (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Gripe (estacional)». https://www.who.int/es/news-room/fact-sheets/detail/influenza-(seasonal) (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Calendario Nacional de Vacunación». https://www.argentina.gob.ar/salud/vacunas (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ENF-004 -->

<!-- INICIO ARTICULO: ENF-005 -->
### ENF-005 · Deshidratación

- **Identificador:** `ENF-005`
- **Categoría:** Enfermedades frecuentes
- **Título:** Deshidratación
- **Resumen para recuperación:** La deshidratación ocurre cuando el cuerpo pierde más líquidos y electrolitos de los que incorpora. Es frecuente por diarrea, vómitos, fiebre o calor. Puede ser leve o grave y potencialmente mortal. Los bebés y adultos mayores son los más vulnerables.
- **Palabras clave:** deshidratación, falta de líquidos, sed intensa, boca seca, orina escasa, sales de rehidratación oral.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La deshidratación es la pérdida excesiva de agua y electrolitos del organismo. Puede producirse por diarrea, vómitos, fiebre, sudoración intensa, calor, ejercicio prolongado, falta de ingesta o uso de medicamentos que aumentan la diuresis. La gravedad depende de la cantidad de líquido perdido y de la velocidad de la pérdida.

#### Síntomas y características

En adultos:

- Sed intensa.
- Boca seca.
- Orina escasa y de color oscuro.
- Piel seca.
- Cansancio, mareo o dolor de cabeza.
- Confusión en casos graves.

En bebés y niños pequeños:

- Boca y lengua secas.
- Llanto sin lágrimas.
- Menos pañales mojados o ausencia de orina por varias horas.
- Ojos hundidos.
- Somnolencia o irritabilidad inusual.
- Fontanela hundida en bebés.

#### Posibles causas (orientativas, sin diagnóstico)

Puede deberse a gastroenteritis, vómitos, fiebre, golpe de calor, ejercicio intenso, quemaduras, diabetes descompensada, enfermedad renal o uso de diuréticos. Un profesional debe evaluar la causa y la gravedad.

#### Recomendaciones generales y cuidados

- Beber líquidos con frecuencia, en pequeños sorbos.
- Usar solución de rehidratación oral cuando haya pérdidas por diarrea o vómitos.
- Continuar la lactancia materna en bebés.
- Mantenerse en lugares frescos y evitar el sol en las horas de mayor calor.
- Controlar la cantidad y el color de la orina.
- Consultar si los síntomas no mejoran.

#### Qué evitar

- No dar grandes volúmenes de agua sola a bebés con diarrea o vómitos; puede empeorar el desequilibrio de electrolitos.
- No usar bebidas azucaradas, energizantes ni alcohol como rehidratación principal.
- No preparar soluciones caseras con medidas incorrectas.
- No esperar a tener sed intensa para beber, especialmente en personas mayores.
- No automedicarse con antidiarreicos o antieméticos.

#### Cuándo buscar atención médica

- Hay signos de deshidratación moderada o grave.
- La persona no puede beber o vomita todo lo que ingiere.
- Hay diarrea o vómitos persistentes.
- Hay fiebre alta o calor extremo.
- La persona es un bebé, un adulto mayor, una embarazada o tiene enfermedad crónica.
- Hay diabetes, enfermedad renal o tratamiento con diuréticos.
- Hay confusión, somnolencia o debilidad intensa.

#### Signos de alarma

- Confusión o pérdida de conocimiento.
- Ausencia de orina por varias horas.
- Piel pálida, fría o moteada.
- Pulso rápido y débil.
- Respiración rápida.
- Convulsión.
- Shock.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. La solución de rehidratación oral es el producto indicado para reponer agua y electrolitos en casos leves o moderados. La rehidratación intravenosa se reserva para casos graves o cuando no es posible la vía oral, y debe ser indicada por un profesional.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños pequeños:** se deshidratan más rápido; consultar temprano.
- **Embarazadas:** la deshidratación puede afectar a la madre y al bebé.
- **Adultos mayores:** la sensación de sed puede estar disminuida.
- **Personas con enfermedad renal, cardíaca o diabetes:** requieren indicaciones específicas.
- **Deportistas y trabajadores expuestos al calor:** necesitan reposición planificada.

#### Fuentes

- MedlinePlus en español. «Deshidratación». https://medlineplus.gov/spanish/dehydration.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Olas de calor». https://www.argentina.gob.ar/salud/verano/olas-de-calor (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ENF-005 -->

---

# Categoría 3 · Cuidados generales

> **Nota de categoría:** las recomendaciones de esta sección son medidas generales de autocuidado. No reemplazan la evaluación profesional y pueden no ser adecuadas para personas con enfermedades crónicas, embarazo o tratamientos específicos.

<!-- INICIO ARTICULO: CUI-001 -->
### CUI-001 · Hidratación

- **Identificador:** `CUI-001`
- **Categoría:** Cuidados generales
- **Título:** Hidratación
- **Resumen para recuperación:** Mantener una hidratación adecuada es importante para el funcionamiento del cuerpo. Las necesidades varían según la edad, el clima, la actividad física, la fiebre y el embarazo. El agua segura es la bebida principal; en pérdidas por diarrea o vómitos puede usarse solución de rehidratación oral.
- **Palabras clave:** hidratación, agua, tomar agua, líquidos, sed, deshidratación, agua segura.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El cuerpo necesita agua para regular la temperatura, transportar nutrientes, eliminar desechos y mantener el funcionamiento de los órganos. La cantidad de líquido necesaria no es idéntica para todas las personas: depende de la edad, el peso, el clima, la actividad física, la fiebre, el embarazo, la lactancia y las enfermedades preexistentes. La sed y el color de la orina son orientadores, pero no siempre son suficientes, especialmente en adultos mayores.

#### Características de una hidratación adecuada

- Orina de color claro o amarillo pálido.
- Menor sensación de sed y de boca seca.
- Buen estado de alerta y energía.
- Piel y mucosas hidratadas.
- Producción de orina regular.

#### Recomendaciones generales y cuidados

- Beber agua segura a lo largo del día, sin esperar a tener sed intensa.
- Aumentar la ingesta en días de calor, durante el ejercicio y en estados febriles.
- Incorporar caldos, infusiones sin azúcar y frutas con alto contenido de agua, si no hay restricciones médicas.
- Ofrecer agua con frecuencia a niños y adultos mayores.
- En caso de diarrea o vómitos, usar solución de rehidratación oral.
- Mantener el agua almacenada en recipientes limpios y tapados.

#### Qué evitar

- No reemplazar el agua por bebidas azucaradas, energizantes o alcohol.
- No consumir agua de origen dudoso sin tratarla.
- No forzar grandes volúmenes de agua en personas con restricciones médicas.
- No esperar a la deshidratación para ofrecer líquidos a bebés o adultos mayores.
- No usar soluciones caseras con medidas incorrectas.

#### Cuándo buscar atención médica

- Hay sed intensa que no cede.
- Hay signos de deshidratación.
- La persona no puede beber o vomita todo.
- Hay fiebre alta, diarrea o vómitos persistentes.
- Hay enfermedad renal, cardíaca o hepática con indicación de restricción de líquidos.
- La persona es un bebé, un adulto mayor o una embarazada.

#### Signos de alarma

- Confusión o somnolencia.
- Ausencia de orina por varias horas.
- Piel pálida, fría o moteada.
- Pulso rápido y débil.
- Respiración rápida.
- Pérdida de conocimiento.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** ofrecer líquidos con frecuencia y consultar si hay diarrea, vómitos o fiebre.
- **Embarazadas y personas que amamantan:** aumentan sus necesidades de líquidos; consultar ante signos de deshidratación.
- **Adultos mayores:** la sed puede estar disminuida; ofrecer líquidos de forma regular.
- **Personas con enfermedad renal, cardíaca o hepática:** deben seguir la indicación de su profesional sobre la cantidad de líquidos.
- **Deportistas y trabajadores al aire libre:** planificar la hidratación antes, durante y después de la actividad.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Olas de calor». https://www.argentina.gob.ar/salud/verano/olas-de-calor (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Hidratación adecuada y consumo de agua segura». https://www.argentina.gob.ar/salud/verano/aguasegura (consultado el 25/11/2026).
- MedlinePlus en español. «Deshidratación». https://medlineplus.gov/spanish/dehydration.html (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: CUI-001 -->

<!-- INICIO ARTICULO: CUI-002 -->
### CUI-002 · Descanso

- **Identificador:** `CUI-002`
- **Categoría:** Cuidados generales
- **Título:** Descanso
- **Resumen para recuperación:** El descanso adecuado ayuda a recuperarse de enfermedades, regular el ánimo y mantener la salud. Durante un cuadro agudo conviene reducir la actividad y retomarla en forma gradual. El descanso prolongado sin indicación puede ser perjudicial, especialmente en adultos mayores.
- **Palabras clave:** descanso, sueño, dormir, reposo, cansancio, recuperación, pausas.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El descanso incluye el sueño nocturno y las pausas durante el día. La cantidad de sueño necesaria varía con la edad y las circunstancias individuales. Durante una enfermedad aguda, el cuerpo suele necesitar más descanso. Sin embargo, el reposo en cama prolongado puede favorecer la pérdida de fuerza y otras complicaciones, por lo que debe indicarse con criterio.

#### Características de un descanso adecuado

- Sensación de recuperación de energía.
- Sueño de calidad, sin interrupciones frecuentes.
- Capacidad para realizar las actividades habituales.
- Menor irritabilidad y mejor concentración.

#### Recomendaciones generales y cuidados

- Mantener horarios regulares para dormir y despertarse.
- Crear un ambiente oscuro, silencioso y fresco.
- Evitar pantallas y estimulantes antes de dormir.
- Hacer pausas breves durante el trabajo o el estudio.
- Durante una enfermedad, reducir la actividad y retomarla en forma gradual.
- En adultos mayores, evitar el reposo prolongado innecesario y favorecer la movilidad segura.

#### Qué evitar

- No usar el sueño como única estrategia frente a síntomas persistentes.
- No consumir alcohol como ayuda para dormir.
- No automedicarse con sedantes o inductores del sueño.
- No permanecer en cama todo el día sin indicación profesional.
- No retomar la actividad física intensa de golpe después de una enfermedad.

#### Cuándo buscar atención médica

- El insomnio persiste por semanas o afecta la vida diaria.
- Hay somnolencia excesiva durante el día.
- Hay ronquidos fuertes con pausas respiratorias.
- El cansancio es intenso y no mejora con descanso.
- Hay dolor, fiebre u otros síntomas que impiden dormir.
- La persona es un adulto mayor y presenta un cambio reciente en el sueño o el estado de alerta.

#### Signos de alarma

- Somnolencia difícil de despertar.
- Confusión o desorientación.
- Pérdida de conocimiento.
- Dificultad respiratoria durante el sueño.
- Convulsión.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** necesitan más horas de sueño y rutinas estables; consultar si hay cambios marcados.
- **Embarazadas:** el descanso es importante; consultar si hay insomnio persistente o somnolencia intensa.
- **Adultos mayores:** evitar el reposo prolongado y consultar ante cambios del estado de alerta.
- **Personas con enfermedades crónicas:** el descanso debe adaptarse a su condición y tratamiento.

#### Fuentes

- MedlinePlus en español. «Dormir bien». https://medlineplus.gov/spanish/healthysleep.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Actividad física». https://www.who.int/es/news-room/fact-sheets/detail/physical-activity (consultado el 25/11/2026).
- MedlinePlus en español. «Dolores musculares». https://medlineplus.gov/spanish/ency/article/003178.htm (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: CUI-002 -->

<!-- INICIO ARTICULO: CUI-003 -->
### CUI-003 · Alimentación

- **Identificador:** `CUI-003`
- **Categoría:** Cuidados generales
- **Título:** Alimentación
- **Resumen para recuperación:** Una alimentación variada y segura ayuda a prevenir enfermedades y a mantener la salud. Durante una enfermedad aguda conviene comer porciones pequeñas y frecuentes si se toleran. Las dietas especiales deben ser indicadas por un profesional.
- **Palabras clave:** alimentación, dieta, comida, alimentación saludable, alimentación segura, nutrición.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La alimentación influye en el crecimiento, la energía, las defensas y la recuperación. No existe una única dieta válida para todas las personas: las necesidades cambian con la edad, el embarazo, la actividad física y las enfermedades. Una alimentación variada, con alimentos seguros y adecuadamente preparados, es la base de las recomendaciones generales.

#### Características de una alimentación saludable

- Predominio de frutas, verduras, legumbres, cereales integrales y frutos secos.
- Consumo de agua segura.
- Elección de carnes, huevos, pescados y lácteos bien cocidos o pasteurizados.
- Limitación de productos ultraprocesados, azúcares añadidos, sal y grasas trans.
- Comidas regulares y porciones adecuadas.

#### Recomendaciones generales y cuidados

- Lavarse las manos antes de cocinar y antes de comer.
- Lavar frutas y verduras con agua segura.
- Separar alimentos crudos de cocidos.
- Cocinar bien las carnes, los huevos y los pescados.
- Mantener los alimentos refrigerados y respetar la cadena de frío.
- Durante una enfermedad aguda, comer porciones pequeñas y frecuentes si se toleran.
- Continuar la lactancia materna en bebés durante episodios de diarrea o fiebre.

#### Qué evitar

- No consumir agua o alimentos de origen dudoso.
- No dejar alimentos cocidos a temperatura ambiente por períodos prolongados.
- No descongelar carnes a temperatura ambiente.
- No volver a congelar alimentos descongelados.
- No iniciar dietas restrictivas sin indicación profesional.
- No forzar la alimentación si hay vómitos persistentes.

#### Cuándo buscar atención médica

- Hay pérdida de peso involuntaria.
- Hay dificultad para comer o tragar.
- Hay diarrea o vómitos persistentes.
- Hay signos de deshidratación.
- Hay alergias alimentarias con síntomas respiratorios o cutáneos.
- La persona tiene diabetes, enfermedad renal, enfermedad hepática o trastorno de la conducta alimentaria.
- La persona está embarazada o es un niño en crecimiento.

#### Signos de alarma

- Dificultad respiratoria después de comer.
- Hinchazón de labios, lengua o garganta.
- Vómito con sangre.
- Dolor abdominal intenso.
- Confusión o pérdida de conocimiento.
- Signos de deshidratación grave.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la alimentación debe adaptarse a la edad; no dar miel a menores de 1 año ni alimentos que puedan causar atragantamiento.
- **Embarazadas:** evitar alimentos crudos o de riesgo y consultar por restricciones específicas.
- **Adultos mayores:** pueden necesitar texturas adaptadas y control de la hidratación.
- **Personas con enfermedades crónicas:** seguir las indicaciones de su profesional y no modificar la dieta por cuenta propia.

#### Fuentes

- Organización Mundial de la Salud. «Alimentación saludable». https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Alimentación segura». https://www.argentina.gob.ar/salud/verano/alimentacionsegura (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: CUI-003 -->

<!-- INICIO ARTICULO: CUI-004 -->
### CUI-004 · Higiene

- **Identificador:** `CUI-004`
- **Categoría:** Cuidados generales
- **Título:** Higiene
- **Resumen para recuperación:** La higiene personal y del entorno reduce la transmisión de infecciones. El lavado de manos con agua y jabón, la higiene respiratoria y la limpieza de alimentos y superficies son medidas simples y eficaces.
- **Palabras clave:** higiene, lavado de manos, limpieza, desinfección, higiene respiratoria, prevención de infecciones.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La higiene incluye prácticas personales y ambientales que reducen la presencia y transmisión de microorganismos. Las manos son una de las principales vías de transmisión, por lo que su lavado frecuente es una de las medidas más importantes. La higiene respiratoria, la limpieza de alimentos y la desinfección de superficies complementan estas acciones.

#### Recomendaciones generales y cuidados

- Lavarse las manos con agua y jabón antes de comer, después de ir al baño, después de cambiar pañales y antes de cocinar.
- Usar alcohol en gel si no hay agua y jabón disponibles, y lavarse con agua y jabón lo antes posible.
- Cubrirse la boca y la nariz al toser o estornudar con el codo o un pañuelo desechable.
- Desechar los pañuelos usados en un cesto cerrado.
- Lavar frutas y verduras con agua segura.
- Limpiar y desinfectar superficies de cocina y baño.
- Mantener las uñas cortas y limpias.
- No compartir vasos, cubiertos, toallas ni cepillos de dientes.

#### Qué evitar

- No usar la misma tabla o cuchillo para carnes crudas y alimentos cocidos sin lavarlos.
- No dejar alimentos descubiertos.
- No acumular basura cerca de los alimentos.
- No usar lavandina sin diluir ni mezclarla con otros productos.
- No reutilizar pañuelos de tela sin lavarlos.
- No descuidar la higiene de las manos por falta de agua: usar una alternativa segura y lavarse luego.

#### Cuándo buscar atención médica

- Hay una herida que se infecta.
- Hay diarrea o vómitos persistentes.
- Hay fiebre con mal estado general.
- Hay síntomas respiratorios que empeoran.
- Hay una infección cutánea con enrojecimiento, calor o pus.
- La persona es un bebé, un adulto mayor o tiene inmunosupresión.

#### Signos de alarma

- Fiebre alta con confusión.
- Dificultad respiratoria.
- Piel con enrojecimiento extenso, calor y dolor intenso.
- Diarrea con sangre.
- Signos de deshidratación.
- Pérdida de conocimiento.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** requieren supervisión y ayuda con el lavado de manos.
- **Embarazadas:** extremar la higiene de alimentos y manos.
- **Adultos mayores:** facilitar el acceso a jabón y agua.
- **Personas inmunodeprimidas:** extremar la higiene del entorno y de los alimentos.
- **Cuidadores:** lavarse las manos antes y después de atender a una persona enferma.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Lavado de manos y alimentos». https://www.argentina.gob.ar/anmat/comunidad/informacion-de-interes-para-tu-salud/lavado-de-manos-y-alimentos (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Alimentación segura». https://www.argentina.gob.ar/salud/verano/alimentacionsegura (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Agua segura y salud». https://www.argentina.gob.ar/anmat/comunidad/informacion-de-interes-para-tu-salud/agua (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: CUI-004 -->

<!-- INICIO ARTICULO: CUI-005 -->
### CUI-005 · Cuidados durante estados febriles

- **Identificador:** `CUI-005`
- **Categoría:** Cuidados generales
- **Título:** Cuidados durante estados febriles
- **Resumen para recuperación:** Durante la fiebre es importante hidratar, descansar y controlar la temperatura y los síntomas. No siempre es necesario bajar la fiebre; el objetivo es el bienestar. Evitar baños fríos, alcohol y abrigo excesivo. En sospecha de dengue, no usar aspirina ni ibuprofeno.
- **Palabras clave:** fiebre, cuidados, antitérmico, escalofríos, temperatura, dengue, estado febril.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La fiebre es un síntoma, no una enfermedad. Durante un estado febril el cuerpo pierde más líquidos y puede haber malestar, cansancio y falta de apetito. Las medidas de cuidado buscan mantener el confort, prevenir la deshidratación y detectar complicaciones. Bajar la temperatura no siempre es necesario ni beneficioso por sí mismo.

#### Recomendaciones generales y cuidados

- Ofrecer líquidos con frecuencia, en pequeñas cantidades.
- Mantener el ambiente fresco y ventilado.
- Usar ropa liviana y una manta liviana si hay escalofríos.
- Descansar y evitar el esfuerzo físico.
- Controlar la temperatura y anotar los valores y la hora.
- Si hay mucho malestar, consultar antes de usar un antitérmico.
- En sospecha de dengue, consultar de inmediato y no automedicarse.

#### Qué evitar

- No usar baños de agua fría ni alcohol en la piel.
- No abrigar en exceso para “hacer transpirar”.
- No dar aspirina a niños o adolescentes.
- No alternar antitérmicos sin indicación profesional.
- No usar ibuprofeno ni aspirina si hay sospecha de dengue.
- No ignorar los signos de alarma.

#### Cuándo buscar atención médica

- Fiebre en un bebé menor de 3 meses.
- Fiebre que dura más de 3 días.
- Fiebre alta con mal estado general.
- Fiebre con sarpullido, dolor abdominal, vómitos persistentes o diarrea con sangre.
- Fiebre en una persona embarazada, inmunodeprimida o con enfermedad crónica.
- Fiebre con dificultad respiratoria, dolor de pecho o confusión.
- Fiebre después de un viaje a zona con dengue u otras enfermedades transmitidas por mosquitos.

#### Signos de alarma

- Dificultad respiratoria.
- Convulsión.
- Pérdida de conocimiento o somnolencia difícil de despertar.
- Rigidez de cuello o dolor de cabeza intenso.
- Manchas en la piel que no desaparecen al presionar.
- Signos de deshidratación grave.
- Piel pálida, fría o moteada.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Medicamentos (información general)

No se incluyen dosis ni pautas. El paracetamol y el ibuprofeno son antipiréticos frecuentes, pero tienen contraindicaciones. En niños, la indicación depende del peso y la edad. En sospecha de dengue, evitar aspirina e ibuprofeno. La decisión de usar un antitérmico debe basarse en el malestar y en la evaluación profesional.

#### Poblaciones que requieren precauciones especiales

- **Bebés menores de 3 meses:** cualquier fiebre requiere evaluación inmediata.
- **Niños:** no usar medicamentos de adultos ni adaptar dosis por cuenta propia.
- **Embarazadas:** consultar antes de tomar cualquier medicamento.
- **Adultos mayores:** pueden deshidratarse y descompensarse con facilidad.
- **Personas inmunodeprimidas:** la fiebre puede ser el único signo de infección grave.

#### Fuentes

- MedlinePlus en español. «Fiebre». https://medlineplus.gov/spanish/fever.html (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Síntomas y signos de alarma - Dengue». https://www.argentina.gob.ar/sintomas-y-signos-de-alarma (consultado el 25/11/2026).
- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «Disposición 7572/2006 - Paracetamol». https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-7572-2006-123362/texto (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: CUI-005 -->

---

# Categoría 4 · Primeros auxilios

> **Nota de categoría:** los primeros auxilios son medidas inmediatas y provisorias hasta la llegada de asistencia profesional. Ante una emergencia, llamar primero al servicio de emergencias. No realizar maniobras para las que no se tenga entrenamiento. Estas indicaciones no reemplazan un curso de primeros auxilios.

<!-- INICIO ARTICULO: AUX-001 -->
### AUX-001 · Heridas superficiales

- **Identificador:** `AUX-001`
- **Categoría:** Primeros auxilios
- **Título:** Heridas superficiales
- **Resumen para recuperación:** Las heridas superficiales son cortes o raspaduras que afectan la piel. Se lavan con agua y jabón, se cubren con una gasa limpia y se controla la infección. Las heridas profundas, sucias, por mordedura o con objetos incrustados requieren atención médica.
- **Palabras clave:** herida, corte, raspadura, lastimadura, apósito, curación, infección, tétanos.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Una herida superficial afecta la piel y el tejido subcutáneo sin comprometer órganos profundos. La mayoría son menores, pero deben limpiarse bien para prevenir infecciones. La evaluación médica es necesaria cuando la herida es profunda, extensa, está en una zona de riesgo, fue producida por un objeto sucio o animal, o no se puede limpiar por completo.

#### Características

- Corte o raspadura con sangrado leve.
- Dolor local.
- Bordes separados o irregulares.
- Enrojecimiento alrededor.
- Riesgo de infección si no se limpia.

#### Recomendaciones generales y cuidados

- Lavarse las manos antes de tocar la herida; usar guantes si están disponibles.
- Lavar la herida con agua corriente y jabón, retirando la suciedad visible.
- Aplicar un antiséptico adecuado según la indicación del manual de primeros auxilios.
- Cubrir con una gasa o apósito limpio; no usar algodón directamente sobre la herida.
- Cambiar el apósito cuando se moje o se ensucie.
- Controlar la aparición de enrojecimiento, calor, dolor creciente o pus.
- Verificar el estado de vacunación antitetánica.

#### Qué evitar

- No usar alcohol, agua oxigenada ni algodón directamente sobre la herida.
- No aplicar pasta de dientes, café, barro ni remedios caseros.
- No retirar un objeto incrustado: inmovilizarlo y buscar atención.
- No usar torniquete para una herida superficial.
- No cerrar una herida sucia por cuenta propia.
- No demorar la consulta si hay signos de infección.

#### Cuándo buscar atención médica

- La herida es profunda, extensa o de bordes muy separados.
- Está en la cara, las manos, los pies, los genitales o una articulación.
- Fue producida por mordedura de animal o persona.
- Tiene tierra, vidrio u otro material incrustado.
- No se puede limpiar completamente.
- Han pasado más de 6 horas desde la lesión.
- Hay signos de infección.
- El estado de vacunación antitetánica es desconocido o incompleto.

#### Signos de alarma

- Sangrado abundante que no cede con presión.
- Enrojecimiento que se extiende, calor intenso o pus.
- Fiebre.
- Dolor creciente o mal olor.
- Pérdida de sensibilidad o movimiento en la zona.
- Piel que se vuelve oscura o negra.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** consultar por cualquier herida que no sea un raspón mínimo.
- **Embarazadas:** verificar el estado de vacunación antitetánica.
- **Adultos mayores:** la piel es más frágil y las heridas pueden infectarse con facilidad.
- **Personas con diabetes o inmunosupresión:** mayor riesgo de infección; consultar temprano.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Manual de primeros auxilios y prevención de lesiones». https://immca.conicet.gov.ar/wp-content/uploads/sites/13/2019/07/manual_1ros_auxilios_web.pdf (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: AUX-001 -->

<!-- INICIO ARTICULO: AUX-002 -->
### AUX-002 · Quemaduras

- **Identificador:** `AUX-002`
- **Categoría:** Primeros auxilios
- **Título:** Quemaduras
- **Resumen para recuperación:** Una quemadura es una lesión de la piel por calor, electricidad, productos químicos o radiación. Se enfría con agua corriente fresca y se cubre con un paño limpio. No usar hielo, cremas ni romper ampollas. Las quemaduras extensas, profundas o en zonas críticas requieren atención inmediata.
- **Palabras clave:** quemadura, escaldadura, ampolla, piel quemada, agua fría, primeros auxilios.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Las quemaduras pueden ser superficiales (enrojecimiento y dolor), de espesor parcial (ampollas) o profundas (piel blanca, marrón o negra, a veces con menos dolor por daño nervioso). La gravedad depende de la extensión, la profundidad, la zona afectada y la edad de la persona. Las quemaduras eléctricas y químicas pueden ser más graves de lo que parece.

#### Características

- Enrojecimiento y dolor.
- Hinchazón.
- Ampollas.
- Piel blanquecina, marrón o negra en quemaduras profundas.
- En quemaduras graves: palidez, sudoración, mareo o shock.

#### Recomendaciones generales y cuidados

- Retirar a la persona de la fuente de calor y apagar el fuego.
- Enfriar la zona con agua corriente fresca durante unos 20 minutos, si la quemadura es reciente.
- Retirar anillos, pulseras y ropa que no esté adherida a la piel.
- Cubrir con una gasa estéril o un paño limpio.
- Mantener a la persona abrigada y tranquila.
- Buscar atención médica según la gravedad.

#### Qué evitar

- No aplicar hielo directamente.
- No aplicar pasta de dientes, cremas, aceites, manteca ni remedios caseros.
- No romper las ampollas.
- No retirar ropa pegada a la quemadura.
- No usar algodón directamente sobre la lesión.
- No aplicar vendajes apretados.

#### Cuándo buscar atención médica

- La quemadura es extensa o profunda.
- Afecta cara, manos, pies, genitales, articulaciones o vías respiratorias.
- Es eléctrica o química.
- Hay inhalación de humo, tos, ronquera o dificultad respiratoria.
- La persona es un bebé, un niño, un adulto mayor o una embarazada.
- Hay ampollas grandes o varias ampollas.
- La quemadura rodea un brazo, una pierna o el torso.

#### Signos de alarma

- Dificultad respiratoria, ronquera o tos con hollín.
- Quemadura en cara o cuello.
- Palidez, sudoración fría, pulso rápido o desmayo.
- Quemadura extensa o profunda.
- Dolor intenso que no cede.
- Signos de infección: pus, mal olor, fiebre.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la piel es más fina y la quemadura puede ser más grave; consultar siempre.
- **Embarazadas:** consultar ante quemaduras extensas o eléctricas.
- **Adultos mayores:** mayor riesgo de complicaciones y de infección.
- **Personas con diabetes o inmunosupresión:** mayor riesgo de infección.

#### Fuentes

- Ministerio de Salud de la Provincia de Córdoba. «Primeros auxilios: quemaduras». https://ministeriodesalud.cba.gov.ar/prevencion-y-cuidados/primeros-auxilios-quemaduras (consultado el 25/11/2026).
- Ministerio de Salud de la Provincia de Córdoba. «Cómo prevenir quemaduras y qué hacer ante este tipo de accidentes». https://ministeriodesalud.cba.gov.ar/como-prevenir-quemaduras-y-que-hacer-ante-este-tipo-de-accidentes (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Quemaduras». https://www.who.int/es/news-room/fact-sheets/detail/burns (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: AUX-002 -->

<!-- INICIO ARTICULO: AUX-003 -->
### AUX-003 · Golpes

- **Identificador:** `AUX-003`
- **Categoría:** Primeros auxilios
- **Título:** Golpes
- **Resumen para recuperación:** Un golpe puede producir un hematoma, una contusión o una lesión más grave. La mayoría de los golpes leves mejoran con frío local y reposo. Los golpes en la cabeza, el cuello, el abdomen o con pérdida de conocimiento requieren evaluación inmediata.
- **Palabras clave:** golpe, contusión, hematoma, chichón, traumatismo, moretón, primeros auxilios.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Un golpe es un impacto sobre el cuerpo que puede lesionar la piel, los músculos, los huesos o los órganos internos. La gravedad no siempre es visible: un golpe en la cabeza o el abdomen puede producir una lesión interna aunque la piel esté intacta. La evaluación de la persona y de la escena es el primer paso.

#### Características

- Dolor local.
- Hinchazón.
- Moretón o hematoma.
- Rigidez o dificultad para mover la zona.
- En golpes graves: mareo, vómitos, confusión, palidez o pérdida de conocimiento.

#### Recomendaciones generales y cuidados

- Evaluar la escena y asegurarse de que no haya peligro.
- Verificar si la persona está consciente y respira.
- En un golpe leve, aplicar frío indirecto (paño con hielo) durante 15 a 20 minutos varias veces al día.
- Mantener la zona en reposo y elevada si es una extremidad.
- Observar la aparición de nuevos síntomas.
- Consultar si el dolor o la hinchazón aumentan.

#### Qué evitar

- No mover a una persona con sospecha de lesión de cuello o columna.
- No aplicar hielo directamente sobre la piel.
- No masajear intensamente un hematoma reciente.
- No ignorar un golpe en la cabeza aunque la persona se sienta bien.
- No dar alimentos ni líquidos si hay somnolencia o vómitos.

#### Cuándo buscar atención médica

- El golpe fue en la cabeza, el cuello, el pecho o el abdomen.
- Hubo pérdida de conocimiento, aunque sea breve.
- Hay vómitos, dolor de cabeza intenso, confusión o somnolencia.
- Hay deformidad, incapacidad para mover la zona o dolor intenso.
- Hay hormigueo, pérdida de sensibilidad o debilidad.
- La persona toma anticoagulantes.
- La persona es un bebé, un adulto mayor o una embarazada.
- Hay signos de shock.

#### Signos de alarma

- Pérdida de conocimiento o somnolencia difícil de despertar.
- Convulsión.
- Vómitos repetidos.
- Pupilas desiguales.
- Dificultad respiratoria.
- Dolor abdominal intenso o abdomen rígido.
- Sangrado por oídos, nariz o boca después de un golpe.
- Palidez, sudoración fría o pulso rápido.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** consultar ante cualquier golpe en la cabeza con vómitos, somnolencia o cambio de conducta.
- **Embarazadas:** un golpe en el abdomen requiere evaluación inmediata.
- **Adultos mayores:** mayor riesgo de fracturas y de sangrado intracraneal.
- **Personas anticoaguladas:** consultar ante cualquier golpe en la cabeza.

#### Fuentes

- Ministerio de Salud de la Provincia de Córdoba. «Consejos para evitar accidentes domésticos». https://ministeriodesalud.cba.gov.ar/consejos-para-evitar-accidentes-domesticos (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Manual de primeros auxilios y prevención de lesiones». https://immca.conicet.gov.ar/wp-content/uploads/sites/13/2019/07/manual_1ros_auxilios_web.pdf (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: AUX-003 -->

<!-- INICIO ARTICULO: AUX-004 -->
### AUX-004 · Caídas

- **Identificador:** `AUX-004`
- **Categoría:** Primeros auxilios
- **Título:** Caídas
- **Resumen para recuperación:** Una caída puede producir desde un golpe leve hasta fracturas o lesiones internas. No se debe mover a la persona si hay sospecha de fractura o lesión de columna. Las caídas en adultos mayores, embarazadas o personas anticoaguladas requieren evaluación.
- **Palabras clave:** caída, fractura, esguince, golpe, traumatismo, adultos mayores, primeros auxilios.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Las caídas son una causa frecuente de lesiones, especialmente en niños y adultos mayores. Pueden producir contusiones, esguinces, fracturas o traumatismos craneales. La gravedad depende de la altura, la superficie, la zona del cuerpo y la condición de la persona. La prevención es especialmente importante en el hogar.

#### Características

- Dolor e hinchazón en la zona afectada.
- Dificultad para mover una extremidad.
- Deformidad visible.
- Moretones.
- En traumatismo craneal: dolor de cabeza, vómitos, somnolencia o confusión.
- En adultos mayores: fractura de cadera, dificultad para ponerse de pie.

#### Recomendaciones generales y cuidados

- Evaluar la escena antes de acercarse.
- Verificar si la persona está consciente y respira.
- No mover a la persona si hay sospecha de fractura o lesión de columna; llamar a emergencias.
- Si la persona está consciente y no hay lesión grave, ayudarla a incorporarse despacio.
- Aplicar frío indirecto en la zona inflamada.
- Mantener la extremidad en reposo y elevada.
- Observar durante las horas siguientes.

#### Qué evitar

- No levantar bruscamente a una persona caída.
- No mover el cuello ni la espalda si hay dolor o sospecha de lesión.
- No intentar “acomodar” una fractura.
- No aplicar hielo directamente.
- No dejar sola a una persona con traumatismo craneal.
- No ignorar una caída en una persona anticoagulada.

#### Cuándo buscar atención médica

- Hay deformidad, incapacidad para mover la extremidad o para apoyar el peso.
- Hay dolor intenso que no cede.
- Hay hormigueo, pérdida de sensibilidad o debilidad.
- La caída fue de altura o con impacto fuerte.
- Hubo golpe en la cabeza, el cuello o la espalda.
- La persona es un adulto mayor, una embarazada o toma anticoagulantes.
- Hay vómitos, somnolencia o confusión.
- Hay heridas abiertas o sangrado.

#### Signos de alarma

- Pérdida de conocimiento.
- Convulsión.
- Vómitos repetidos o dolor de cabeza intenso.
- Dificultad respiratoria.
- Palidez, sudoración fría o pulso rápido.
- Incapacidad para mover brazos o piernas.
- Sangrado abundante.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** consultar ante caídas de altura o golpes en la cabeza.
- **Embarazadas:** una caída con dolor abdominal o sangrado requiere atención inmediata.
- **Adultos mayores:** mayor riesgo de fractura y de complicaciones; consultar temprano.
- **Personas con osteoporosis o anticoagulación:** mayor riesgo de fracturas y sangrado.

#### Fuentes

- Organización Mundial de la Salud. «Caídas». https://www.who.int/es/news-room/fact-sheets/detail/falls (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Manual de primeros auxilios y prevención de lesiones». https://immca.conicet.gov.ar/wp-content/uploads/sites/13/2019/07/manual_1ros_auxilios_web.pdf (consultado el 25/11/2026).
- Ministerio de Salud de la Provincia de Córdoba. «Consejos para evitar accidentes domésticos». https://ministeriodesalud.cba.gov.ar/consejos-para-evitar-accidentes-domesticos (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: AUX-004 -->

<!-- INICIO ARTICULO: AUX-005 -->
### AUX-005 · Hemorragias

- **Identificador:** `AUX-005`
- **Categoría:** Primeros auxilios
- **Título:** Hemorragias
- **Resumen para recuperación:** Una hemorragia es una pérdida de sangre que puede ser externa o interna. La medida inicial es la presión directa con un paño limpio y llamar a emergencias. No retirar el apósito empapado. El torniquete solo debe usarlo personal entrenado en hemorragias graves de extremidades.
- **Palabras clave:** hemorragia, sangrado, sangrado abundante, presión directa, torniquete, primeros auxilios.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Una hemorragia es la salida de sangre de los vasos sanguíneos. Puede ser externa, visible en una herida, o interna, sin sangrado visible. La hemorragia grave es una emergencia porque puede provocar shock y poner en riesgo la vida. La presión directa sobre la herida es la medida inicial más importante.

#### Características

- Sangrado que empapa apósitos o ropa.
- Sangre que sale a borbotones o de forma continua.
- Palidez, sudoración fría, mareo o debilidad.
- Pulso rápido y débil.
- Confusión o pérdida de conocimiento en casos graves.
- Dolor o hinchazón en una hemorragia interna.

#### Recomendaciones generales y cuidados

- Llamar al servicio de emergencias.
- Usar guantes o una barrera limpia si es posible.
- Aplicar presión directa y firme sobre la herida con una gasa o un paño limpio.
- Si el apósito se empapa, agregar más capas sin retirar el anterior.
- Elevar la extremidad si no hay sospecha de fractura.
- Mantener a la persona acostada y abrigada.
- Si hay un objeto incrustado, no retirarlo; inmovilizarlo y presionar alrededor.

#### Qué evitar

- No retirar el apósito empapado.
- No usar torniquete improvisado salvo hemorragia grave de extremidad y personal entrenado.
- No retirar objetos incrustados.
- No dar alimentos ni líquidos.
- No dejar sola a la persona.
- No aplicar presión sobre los ojos ni sobre un objeto incrustado.

#### Cuándo buscar atención médica

- El sangrado no cede con presión directa.
- La sangre sale a borbotones.
- El apósito se empapa rápidamente.
- Hay palidez, sudoración fría, mareo o desmayo.
- Hay signos de shock.
- La hemorragia es interna (dolor abdominal, torácico o hinchazón).
- La persona toma anticoagulantes.

#### Signos de alarma

- Pérdida de conocimiento.
- Pulso rápido y débil.
- Respiración rápida.
- Piel pálida, fría o moteada.
- Confusión.
- Sangrado abundante que no se controla.
- Dolor intenso en el pecho o el abdomen.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** una pérdida de sangre pequeña puede ser significativa; consultar.
- **Embarazadas:** cualquier sangrado vaginal requiere atención inmediata.
- **Adultos mayores:** mayor riesgo de shock y de complicaciones.
- **Personas anticoaguladas:** el sangrado puede ser más difícil de controlar.

#### Fuentes

- Organización Mundial de la Salud. «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Manual de primeros auxilios y prevención de lesiones». https://immca.conicet.gov.ar/wp-content/uploads/sites/13/2019/07/manual_1ros_auxilios_web.pdf (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: AUX-005 -->

<!-- INICIO ARTICULO: AUX-006 -->
### AUX-006 · Situaciones que requieren asistencia inmediata

- **Identificador:** `AUX-006`
- **Categoría:** Primeros auxilios
- **Título:** Situaciones que requieren asistencia inmediata
- **Resumen para recuperación:** Algunas situaciones son emergencias y requieren llamar de inmediato al servicio de emergencias: pérdida de conocimiento, dificultad respiratoria, dolor de pecho, convulsión prolongada, sangrado grave, signos de ACV, reacción alérgica grave o traumatismo mayor.
- **Palabras clave:** emergencia, urgencia, llamar al 107, llamar al 911, pérdida de conocimiento, no respira, RCP, shock.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Una emergencia es una situación que pone en riesgo la vida o puede dejar secuelas graves si no se atiende de inmediato. En estos casos, la prioridad es llamar al servicio de emergencias, mantener la seguridad de la escena y acompañar a la persona hasta que llegue la ayuda. No se debe perder tiempo en diagnósticos ni en remedios caseros.

#### Situaciones que requieren asistencia inmediata

- Persona inconsciente o que no responde.
- Persona que no respira o respira de forma anormal.
- Dificultad respiratoria intensa o labios azulados.
- Dolor de pecho opresivo o que se irradia.
- Signos de accidente cerebrovascular: cara caída, debilidad de un brazo, dificultad para hablar.
- Convulsión que dura más de 5 minutos o se repite.
- Sangrado abundante que no se controla.
- Quemadura extensa, profunda o en cara, manos, pies o genitales.
- Traumatismo grave, caída de altura o accidente de tránsito.
- Reacción alérgica grave con hinchazón de garganta o dificultad respiratoria.
- Intoxicación o ingestión de sustancia desconocida.
- Ahogamiento o electrocución.
- Dolor abdominal intenso con abdomen rígido.
- Fiebre en un bebé menor de 3 meses.
- Ideación suicida o riesgo para sí mismo o para terceros.

#### Recomendaciones generales y cuidados

- Llamar al **107** o al **911** según la jurisdicción, o al número local de emergencias.
- Informar la ubicación exacta, qué ocurrió y el estado de la persona.
- No mover a la persona si hay sospecha de lesión de cuello o columna, salvo peligro inminente.
- Si la persona no respira y se tiene entrenamiento, iniciar RCP y pedir un desfibrilador externo automático.
- Si la persona respira pero está inconsciente, colocarla en posición de seguridad si no hay sospecha de lesión de columna.
- Mantener a la persona abrigada y acompañada.
- Seguir las instrucciones del operador de emergencias.

#### Qué evitar

- No dejar sola a la persona.
- No dar alimentos ni líquidos si está somnolienta o inconsciente.
- No administrar medicamentos sin indicación.
- No mover a una persona con sospecha de lesión grave salvo peligro inminente.
- No usar remedios caseros.
- No conducir por cuenta propia si se puede llamar a una ambulancia.

#### Cuándo buscar atención médica

Este artículo describe situaciones que ya son una emergencia: ante cualquiera de ellas, la conducta correcta es llamar de inmediato al servicio de emergencias y no esperar a que los síntomas mejoren. Si la persona está consciente y respira, pero el cuadro empeora, aparece un nuevo signo de alarma o persiste la duda sobre la gravedad, también corresponde una evaluación inmediata. La consulta posterior con un profesional sirve para controlar la evolución, pero no reemplaza la llamada de emergencia.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** llamar ante cualquier signo de dificultad respiratoria, somnolencia o convulsión.
- **Embarazadas:** llamar ante dolor abdominal, sangrado, pérdida de líquido o disminución de movimientos fetales.
- **Adultos mayores:** llamar ante caídas con golpe en la cabeza, confusión o incapacidad para levantarse.
- **Personas con enfermedades crónicas:** llamar ante descompensación o síntomas nuevos intensos.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Manual de primeros auxilios y prevención de lesiones». https://immca.conicet.gov.ar/wp-content/uploads/sites/13/2019/07/manual_1ros_auxilios_web.pdf (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: AUX-006 -->

---

# Categoría 5 · Medicamentos

> **Advertencia de categoría:** esta sección es informativa y **no contiene dosis, frecuencias, duraciones ni pautas de administración**. La indicación de un medicamento depende de la edad, el peso, el embarazo, la lactancia, las alergias, las enfermedades preexistentes y otros medicamentos. **No se debe recomendar automedicación.** Todo el contenido de esta categoría está en estado `documentado` con las dosis en estado `bloqueado`.

<!-- INICIO ARTICULO: MED-001 -->
### MED-001 · Paracetamol

- **Identificador:** `MED-001`
- **Categoría:** Medicamentos
- **Título:** Paracetamol
- **Resumen para recuperación:** El paracetamol es un analgésico y antipirético de uso frecuente. No es antiinflamatorio. Su principal riesgo es la toxicidad hepática por sobredosis o por combinación con otros productos que lo contienen. No se incluyen dosis.
- **Palabras clave:** paracetamol, acetaminofén, analgésico, antipirético, antifebril, hígado, sobredosis.
- **Estado de validación:** `documentado` con dosis `bloqueado` — pendiente de revisión médica local.

#### Descripción general

El paracetamol, también llamado acetaminofén, es un medicamento analgésico y antipirético. Se utiliza para aliviar dolor leve o moderado y para reducir la fiebre. No tiene un efecto antiinflamatorio relevante. Es uno de los medicamentos más usados, pero no es inocuo: en sobredosis puede producir daño hepático grave.

#### Usos frecuentes (información general)

- Alivio sintomático de dolor leve a moderado.
- Reducción de la fiebre.
- Alivio de dolores musculares o de cabeza, cuando un profesional lo indica.

#### Precauciones y efectos adversos

- La sobredosis puede causar daño hepático grave, a veces sin síntomas iniciales.
- El riesgo aumenta con el consumo de alcohol, la desnutrición, la enfermedad hepática y la combinación con otros productos que contienen paracetamol.
- Puede interactuar con anticoagulantes y otros medicamentos.
- En personas alérgicas al paracetamol puede producir reacciones cutáneas.
- Es fundamental revisar si otros medicamentos de venta libre ya contienen paracetamol para no duplicar la sustancia.

#### Qué evitar

- No superar la dosis indicada en el prospecto o por el profesional.
- No combinar varios productos que contengan paracetamol.
- No consumir alcohol mientras se usa.
- No usarlo por períodos prolongados sin evaluación.
- No darlo a niños sin indicación pediátrica basada en peso y edad.
- No usarlo para “prevenir” fiebre o dolor.

#### Cuándo consultar antes de usarlo

- Embarazo o lactancia.
- Enfermedad hepática o renal.
- Desnutrición o bajo peso.
- Consumo frecuente de alcohol.
- Tratamiento con anticoagulantes.
- Alergia previa al paracetamol.
- Uso de otros medicamentos que contengan paracetamol.

#### Signos de alarma

- Sospecha de sobredosis, aunque la persona se sienta bien: acudir de inmediato a un servicio de emergencias o centro de toxicología.
- Dolor intenso en la parte superior derecha del abdomen, náuseas o vómitos persistentes.
- Color amarillento de piel u ojos, orina muy oscura o cansancio inusual.
- Hinchazón de cara, labios o lengua, dificultad para respirar o erupción generalizada.
- Confusión o somnolencia marcada.

#### Dosis y administración

**BLOQUEADO.** Este documento no incluye dosis, frecuencias, duraciones ni formas de administración. La información debe obtenerse del prospecto oficial aprobado por ANMAT y de la indicación de un profesional habilitado. En niños, la dosis depende del peso y la edad.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** solo con indicación pediátrica; no adaptar dosis de adultos.
- **Embarazadas:** consultar antes de usar; no automedicarse.
- **Adultos mayores:** mayor riesgo de interacciones y de enfermedad hepática.
- **Personas con enfermedad hepática:** consultar antes de usar.
- **Personas con consumo de alcohol:** mayor riesgo de toxicidad hepática.

#### Fuentes

- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «Disposición 7572/2006 - Paracetamol». https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-7572-2006-123362/texto (consultado el 25/11/2026).
- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «Vademécum Nacional de Medicamentos». http://anmatvademecum.servicios.pami.org.ar/ (consultado el 25/11/2026).
- MedlinePlus en español. «Fiebre». https://medlineplus.gov/spanish/fever.html (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — información general respaldada por las fuentes citadas. **Dosis, frecuencia y duración: `bloqueado`.** **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: MED-001 -->

<!-- INICIO ARTICULO: MED-002 -->
### MED-002 · Ibuprofeno

- **Identificador:** `MED-002`
- **Categoría:** Medicamentos
- **Título:** Ibuprofeno
- **Resumen para recuperación:** El ibuprofeno es un antiinflamatorio no esteroideo (AINE) con efecto analgésico, antipirético y antiinflamatorio. Puede irritar el estómago, afectar los riñones y el sistema cardiovascular, y agravar el asma. En sospecha de dengue no debe usarse. No se incluyen dosis.
- **Palabras clave:** ibuprofeno, AINE, antiinflamatorio, analgésico, antipirético, estómago, riñón, dengue.
- **Estado de validación:** `documentado` con dosis `bloqueado` — pendiente de revisión médica local.

#### Descripción general

El ibuprofeno pertenece al grupo de los antiinflamatorios no esteroideos (AINE). Se usa para aliviar dolor, reducir la fiebre y disminuir la inflamación. Como todo AINE, puede producir efectos adversos digestivos, renales y cardiovasculares, y puede interactuar con otros medicamentos.

#### Usos frecuentes (información general)

- Alivio de dolor leve a moderado.
- Reducción de la fiebre.
- Alivio de dolor asociado a inflamación, cuando un profesional lo indica.

#### Precauciones y efectos adversos

- Irritación gástrica, acidez, náuseas y, en casos graves, úlcera o sangrado digestivo.
- Reducción del flujo sanguíneo renal; riesgo de daño renal, especialmente con deshidratación o enfermedad renal.
- Aumento de la presión arterial y mayor riesgo cardiovascular en tratamientos prolongados.
- Broncoespasmo en personas con asma sensible a los AINE.
- Interacciones con anticoagulantes, aspirina, corticoides, diuréticos, antihipertensivos y otros fármacos.
- En sospecha de dengue, puede aumentar el riesgo de sangrado.

#### Qué evitar

- No usar en sospecha de dengue sin consultar.
- No usar si hay antecedente de úlcera o sangrado digestivo.
- No usar en enfermedad renal grave o deshidratación.
- No combinar con otros AINE ni con aspirina sin indicación.
- No usar en el tercer trimestre del embarazo sin indicación médica.
- No usar por períodos prolongados sin control.
- No dar a niños sin indicación pediátrica basada en peso y edad.

#### Cuándo consultar antes de usarlo

- Embarazo o lactancia.
- Enfermedad renal, hepática o cardíaca.
- Hipertensión arterial.
- Antecedente de úlcera o sangrado digestivo.
- Asma o alergia a los AINE.
- Tratamiento con anticoagulantes o corticoides.
- Deshidratación, vómitos o diarrea.
- Sospecha de dengue.
- Personas mayores de 65 años.

#### Signos de alarma

- Vómito con sangre o con aspecto de café molido, o heces negras y pegajosas.
- Dolor abdominal intenso o persistente.
- Hinchazón de cara, labios o lengua, dificultad para respirar o urticaria generalizada.
- Disminución marcada de la cantidad de orina o hinchazón de piernas.
- Dolor de pecho, palpitaciones o presión arterial muy elevada.
- Confusión, mareo intenso o desmayo.

#### Dosis y administración

**BLOQUEADO.** Este documento no incluye dosis, frecuencias, duraciones ni formas de administración. La información debe obtenerse del prospecto oficial aprobado por ANMAT y de la indicación de un profesional habilitado. En niños, la dosis depende del peso y la edad.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** solo con indicación pediátrica; no adaptar dosis de adultos.
- **Embarazadas:** consultar; evitar especialmente cerca del parto.
- **Adultos mayores:** mayor riesgo de efectos digestivos, renales y cardiovasculares.
- **Personas con enfermedad renal, cardíaca o hipertensión:** consultar antes de usar.
- **Personas con asma:** consultar por riesgo de broncoespasmo.

#### Fuentes

- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «Prospecto Actron Pediátrico 4% (ibuprofeno)». http://ifas.anmat.gob.ar/VerArchivo?id=4752&srnd=ec71ebb6-67f7-4a6e-aa45-837f0ab8e27a&tipo=pdf (consultado el 25/11/2026).
- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «ANMAT informa sobre ibuprofeno». https://www.argentina.gob.ar/noticias/anmat-informa-sobre-ibuprofeno (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Síntomas y signos de alarma - Dengue». https://www.argentina.gob.ar/sintomas-y-signos-de-alarma (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — información general respaldada por las fuentes citadas. **Dosis, frecuencia y duración: `bloqueado`.** **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: MED-002 -->

<!-- INICIO ARTICULO: MED-003 -->
### MED-003 · Antihistamínicos

- **Identificador:** `MED-003`
- **Categoría:** Medicamentos
- **Título:** Antihistamínicos
- **Resumen para recuperación:** Los antihistamínicos son medicamentos usados para alergias, rinitis y urticaria. Los de primera generación suelen producir somnolencia; los de segunda, menos. Pueden causar sequedad de boca, visión borrosa y retención urinaria. No se incluyen dosis.
- **Palabras clave:** antihistamínico, alergia, rinitis, urticaria, loratadina, cetirizina, difenhidramina, somnolencia.
- **Estado de validación:** `documentado` con dosis `bloqueado` — pendiente de revisión médica local.

#### Descripción general

Los antihistamínicos son medicamentos que bloquean la histamina, una sustancia que el cuerpo libera en las reacciones alérgicas. Se usan para aliviar síntomas de rinitis alérgica, urticaria y otras alergias. No son útiles para tratar infecciones ni para “curar” un resfriado.

#### Usos frecuentes (información general)

- Rinitis alérgica: estornudos, picazón nasal, secreción.
- Urticaria: ronchas y picazón.
- Otras reacciones alérgicas leves, según indicación profesional.

#### Precauciones y efectos adversos

- Los antihistamínicos de primera generación (como la difenhidramina) producen somnolencia y reducen los reflejos.
- Pueden causar sequedad de boca, visión borrosa, estreñimiento o dificultad para orinar.
- En adultos mayores pueden aumentar el riesgo de confusión, caídas y retención urinaria.
- Pueden interactuar con alcohol, sedantes, antidepresivos y otros medicamentos.
- Algunos productos combinados incluyen descongestivos u otros principios activos; leer siempre el prospecto.

#### Qué evitar

- No conducir ni operar maquinaria si producen somnolencia.
- No combinar con alcohol ni con otros sedantes.
- No usar en niños pequeños sin indicación pediátrica.
- No usar para tratar un resfriado o una infección.
- No usar de forma prolongada sin evaluación si los síntomas persisten.
- No usar en glaucoma de ángulo cerrado, retención urinaria o hipertrofia prostática sin consultar.

#### Cuándo consultar antes de usarlo

- Embarazo o lactancia.
- Adultos mayores.
- Glaucoma, hipertrofia prostática o dificultad para orinar.
- Enfermedad hepática o renal.
- Epilepsia.
- Tratamiento con sedantes, antidepresivos o alcohol.
- Niños pequeños.

#### Signos de alarma

- Hinchazón de cara, labios o lengua, dificultad para respirar o urticaria generalizada.
- Somnolencia excesiva, confusión o dificultad para despertar.
- Palpitaciones, temblor intenso o convulsión.
- Incapacidad para orinar o dolor intenso al orinar.
- Fiebre alta con rigidez de cuello o confusión.
- Sequedad de boca intensa, ausencia de orina o signos de deshidratación.

#### Dosis y administración

**BLOQUEADO.** Este documento no incluye dosis, frecuencias, duraciones ni formas de administración. La información debe obtenerse del prospecto oficial aprobado por ANMAT y de la indicación de un profesional habilitado. En niños, la dosis depende del peso y la edad.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** solo con indicación pediátrica; algunos antihistamínicos no se recomiendan en menores de 2 años.
- **Embarazadas:** consultar antes de usar.
- **Adultos mayores:** mayor riesgo de somnolencia, confusión y caídas.
- **Personas con glaucoma o problemas urinarios:** consultar antes de usar.
- **Personas que conducen o trabajan con maquinaria:** evitar los de primera generación.

#### Fuentes

- MedlinePlus en español. «Alergia». https://medlineplus.gov/spanish/allergy.html (consultado el 25/11/2026).
- MedlinePlus en español. «Rinitis alérgica». https://medlineplus.gov/spanish/hayfever.html (consultado el 25/11/2026).
- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «Vademécum Nacional de Medicamentos». http://anmatvademecum.servicios.pami.org.ar/ (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — información general respaldada por las fuentes citadas. **Dosis, frecuencia y duración: `bloqueado`.** **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: MED-003 -->

<!-- INICIO ARTICULO: MED-004 -->
### MED-004 · Antitérmicos

- **Identificador:** `MED-004`
- **Categoría:** Medicamentos
- **Título:** Antitérmicos
- **Resumen para recuperación:** Los antitérmicos son medicamentos que reducen la fiebre. El paracetamol y el ibuprofeno son los más usados. La fiebre no siempre necesita tratamiento; el objetivo es aliviar el malestar. La aspirina no debe usarse en niños o adolescentes. No se incluyen dosis.
- **Palabras clave:** antitérmico, antipirético, bajar la fiebre, paracetamol, ibuprofeno, aspirina, fiebre.
- **Estado de validación:** `documentado` con dosis `bloqueado` — pendiente de revisión médica local.

#### Descripción general

Los antitérmicos o antipiréticos son medicamentos que disminuyen la temperatura corporal. Se usan para aliviar el malestar asociado a la fiebre, no para tratar la causa. La fiebre es un mecanismo de defensa y no siempre es necesario bajarla; la decisión depende del malestar, la edad y los antecedentes de la persona.

#### Usos frecuentes (información general)

- Alivio del malestar por fiebre.
- Reducción de la temperatura en personas con fiebre alta y molestias.
- Tratamiento sintomático de dolor asociado a infecciones, según indicación profesional.

#### Precauciones y efectos adversos

- El paracetamol puede producir daño hepático en sobredosis.
- El ibuprofeno puede irritar el estómago, afectar los riñones y el sistema cardiovascular, y agravar el asma.
- La aspirina no debe usarse en niños o adolescentes con fiebre por riesgo de síndrome de Reye.
- En sospecha de dengue, evitar aspirina e ibuprofeno.
- La combinación de antitérmicos puede aumentar el riesgo de errores de dosis y efectos adversos.

#### Qué evitar

- No usar antitérmicos para “prevenir” fiebre.
- No alternar paracetamol e ibuprofeno sin indicación profesional.
- No usar aspirina en niños o adolescentes.
- No usar ibuprofeno en sospecha de dengue.
- No superar la dosis del prospecto.
- No usar medicamentos vencidos ni de envases sin rótulo.

#### Cuándo consultar antes de usarlo

- Embarazo o lactancia.
- Enfermedad hepática, renal o cardíaca.
- Úlcera o sangrado digestivo.
- Asma.
- Tratamiento con anticoagulantes.
- Sospecha de dengue.
- Niño menor de 12 años o bebé.
- Adulto mayor.

#### Signos de alarma

- Fiebre en un bebé menor de 3 meses.
- Rigidez de cuello, confusión, convulsión o manchas en la piel que no desaparecen al presionar.
- Dificultad para respirar o labios azulados.
- Signos de deshidratación: boca muy seca, ausencia de orina, llanto sin lágrimas o somnolencia.
- Fiebre que empeora o no mejora tras varios días de seguimiento.
- Hinchazón de cara, labios o lengua o dificultad para respirar.

#### Dosis y administración

**BLOQUEADO.** Este documento no incluye dosis, frecuencias, duraciones ni formas de administración. La información debe obtenerse del prospecto oficial aprobado por ANMAT y de la indicación de un profesional habilitado. En niños, la dosis depende del peso y la edad.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** solo con indicación pediátrica; no usar aspirina.
- **Embarazadas:** consultar antes de usar cualquier antitérmico.
- **Adultos mayores:** mayor riesgo de efectos adversos e interacciones.
- **Personas con enfermedad hepática o renal:** consultar antes de usar.
- **Personas con dengue:** evitar aspirina e ibuprofeno.

#### Fuentes

- MedlinePlus en español. «Fiebre». https://medlineplus.gov/spanish/fever.html (consultado el 25/11/2026).
- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «Disposición 7572/2006 - Paracetamol». https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-7572-2006-123362/texto (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Síntomas y signos de alarma - Dengue». https://www.argentina.gob.ar/sintomas-y-signos-de-alarma (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — información general respaldada por las fuentes citadas. **Dosis, frecuencia y duración: `bloqueado`.** **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: MED-004 -->

<!-- INICIO ARTICULO: MED-005 -->
### MED-005 · Otros medicamentos de uso frecuente

- **Identificador:** `MED-005`
- **Categoría:** Medicamentos
- **Título:** Otros medicamentos de uso frecuente
- **Resumen para recuperación:** Además de los analgésicos y antitérmicos, existen productos de uso frecuente como las sales de rehidratación oral, la solución fisiológica nasal y los antisépticos. No son “inocuos”: deben usarse según el prospecto y con orientación profesional. Los antibióticos requieren receta.
- **Palabras clave:** sales de rehidratación oral, suero, solución fisiológica, antiséptico, medicamentos de venta libre, antibioticoterapia.
- **Estado de validación:** `documentado` con dosis `bloqueado` — pendiente de revisión médica local.

#### Descripción general

Existen productos de venta libre y de uso domiciliario frecuente que pueden ayudar en el autocuidado, pero no reemplazan la evaluación profesional. Entre ellos se encuentran las sales de rehidratación oral, la solución fisiológica nasal, los antisépticos para heridas y los protectores solares. Los antibióticos, los antivirales y muchos otros medicamentos requieren receta médica.

#### Productos frecuentes (información general)

- **Sales de rehidratación oral:** reponen agua y electrolitos en diarrea o vómitos. Deben prepararse exactamente según el prospecto.
- **Solución fisiológica nasal:** ayuda a humidificar y limpiar la nariz.
- **Antisépticos para heridas:** se usan después del lavado con agua y jabón, según el prospecto.
- **Protector solar:** ayuda a prevenir quemaduras solares y daño acumulativo.
- **Termómetro:** permite registrar la temperatura y comunicar el valor y el método de medición.

#### Precauciones y efectos adversos

- Las sales de rehidratación oral mal preparadas pueden empeorar el desequilibrio de electrolitos.
- Los antisépticos pueden irritar la piel o producir alergias.
- Los descongestivos nasales pueden causar rebote y aumentar la congestión.
- Los productos combinados pueden contener varios principios activos y duplicar sustancias.
- Los antibióticos mal usados favorecen la resistencia antimicrobiana y pueden causar efectos adversos.

#### Qué evitar

- No usar antibióticos sin receta.
- No preparar sales de rehidratación “a ojo”.
- No usar productos vencidos ni envases sin rótulo.
- No compartir medicamentos con otras personas.
- No usar descongestivos nasales por más de 3 días seguidos.
- No automedicarse con productos “naturales” sin consultar, ya que también pueden interactuar.

#### Cuándo consultar antes de usarlo

- Embarazo o lactancia.
- Niños pequeños o bebés.
- Adultos mayores.
- Enfermedad renal, hepática o cardíaca.
- Tratamiento con otros medicamentos.
- Alergias conocidas.
- Síntomas que persisten o empeoran.

#### Signos de alarma

- Vómito con sangre, heces negras o diarrea intensa con sangre, especialmente después de usar antibióticos.
- Hinchazón de cara, labios o lengua, dificultad para respirar o urticaria generalizada.
- Dolor de pecho, palpitaciones intensas o presión arterial muy elevada con un descongestivo.
- Confusión, somnolencia marcada o convulsión.
- Fiebre alta persistente o empeoramiento rápido del estado general.
- Signos de deshidratación: boca muy seca, ausencia de orina o mareo al ponerse de pie.

#### Dosis y administración

**BLOQUEADO.** Este documento no incluye dosis, frecuencias, duraciones ni formas de administración para ningún producto. La información debe obtenerse del prospecto oficial aprobado por ANMAT y de la indicación de un profesional habilitado.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** no usar productos de adultos ni adaptar dosis por cuenta propia.
- **Embarazadas:** consultar antes de usar cualquier medicamento o producto.
- **Adultos mayores:** mayor riesgo de interacciones y efectos adversos.
- **Personas con enfermedades crónicas:** consultar antes de usar productos de venta libre.
- **Personas inmunodeprimidas:** evitar la automedicación y consultar temprano.

#### Fuentes

- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Agua segura y salud». https://www.argentina.gob.ar/anmat/comunidad/informacion-de-interes-para-tu-salud/agua (consultado el 25/11/2026).
- MedlinePlus en español. «Rinorrea o congestión nasal en adultos». https://medlineplus.gov/spanish/ency/article/003049.htm (consultado el 25/11/2026).
- Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT). «Vademécum Nacional de Medicamentos». http://anmatvademecum.servicios.pami.org.ar/ (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Resistencia a los antimicrobianos». https://www.who.int/es/news-room/fact-sheets/detail/antimicrobial-resistance (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — información general respaldada por las fuentes citadas. **Dosis, frecuencia y duración: `bloqueado`.** **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: MED-005 -->

---

# Categoría 6 · Prevención

> **Nota de categoría:** las medidas de prevención reducen el riesgo, pero no lo eliminan por completo. Las recomendaciones deben adaptarse a la edad, el embarazo, las enfermedades preexistentes y el contexto local.

<!-- INICIO ARTICULO: PRE-001 -->
### PRE-001 · Prevención de enfermedades respiratorias

- **Identificador:** `PRE-001`
- **Categoría:** Prevención
- **Título:** Prevención de enfermedades respiratorias
- **Resumen para recuperación:** Las infecciones respiratorias se previenen con vacunación, lavado de manos, higiene respiratoria, ventilación de ambientes y evitación del humo de tabaco. Las personas de riesgo deben consultar temprano y mantener sus vacunas al día.
- **Palabras clave:** prevención, enfermedades respiratorias, gripe, resfriado, vacuna, lavado de manos, ventilación, humo de tabaco.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Las enfermedades respiratorias incluyen resfriados, gripes, faringitis, sinusitis, otitis, bronquitis y neumonía. La mayoría se transmiten por gotitas respiratorias y por contacto con manos o superficies contaminadas. La prevención combina vacunación, higiene, ventilación y reducción de la exposición a irritantes.

#### Medidas de prevención

- Mantener el Calendario Nacional de Vacunación al día, especialmente la vacuna antigripal y las vacunas indicadas según la edad y las condiciones de salud.
- Lavarse las manos con agua y jabón con frecuencia.
- Cubrirse la boca y la nariz al toser o estornudar con el codo o un pañuelo desechable.
- Ventilar los ambientes cerrados.
- Evitar el humo de tabaco y otros irritantes.
- Limpiar las superficies de uso frecuente.
- Evitar el contacto cercano con personas enfermas cuando sea posible.
- Quedarse en casa si se tienen síntomas respiratorios y fiebre.

#### Qué evitar

- No fumar ni exponer a niños al humo.
- No compartir vasos, cubiertos ni toallas.
- No automedicarse con antibióticos.
- No enviar a un niño con fiebre o dificultad respiratoria a la escuela o jardín.
- No minimizar los síntomas en personas de riesgo.

#### Cuándo buscar atención médica

- Hay dificultad respiratoria, silbido o respiración rápida.
- Hay dolor de pecho.
- Hay fiebre alta o persistente.
- Hay dolor de oído intenso o secreción.
- Hay empeoramiento después de una mejoría inicial.
- La persona es un bebé, un adulto mayor, una embarazada o tiene enfermedad crónica.
- Hay inmunosupresión.

#### Signos de alarma

- Dificultad respiratoria en reposo.
- Labios o cara azulados.
- Hundimiento de las costillas al respirar en niños.
- Somnolencia intensa o confusión.
- Incapacidad para beber o alimentarse.
- Convulsión.
- Fiebre en un bebé menor de 3 meses.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** mantener las vacunas al día y evitar el humo de tabaco.
- **Embarazadas:** vacunarse según el calendario y consultar temprano ante síntomas.
- **Adultos mayores:** mayor riesgo de complicaciones; mantener vacunas y consultar temprano.
- **Personas con enfermedades crónicas:** seguir su plan de tratamiento y consultar ante exacerbaciones.
- **Personal de salud y cuidadores:** vacunarse y extremar la higiene.

#### Fuentes

- Organización Mundial de la Salud. «Gripe (estacional)». https://www.who.int/es/news-room/fact-sheets/detail/influenza-(seasonal) (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Neumonía». https://www.who.int/es/news-room/fact-sheets/detail/pneumonia (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Calendario Nacional de Vacunación». https://www.argentina.gob.ar/salud/vacunas (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: PRE-001 -->

<!-- INICIO ARTICULO: PRE-002 -->
### PRE-002 · Higiene de manos

- **Identificador:** `PRE-002`
- **Categoría:** Prevención
- **Título:** Higiene de manos
- **Resumen para recuperación:** El lavado de manos con agua y jabón es una de las medidas más eficaces para prevenir infecciones. Debe realizarse antes de comer, después de ir al baño, después de cambiar pañales y antes de cocinar. Si no hay agua, puede usarse alcohol en gel y lavarse luego.
- **Palabras clave:** lavado de manos, higiene de manos, agua y jabón, alcohol en gel, prevención, infecciones.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Las manos transportan microorganismos que pueden ingresar al cuerpo por la boca, la nariz o los ojos, o contaminar alimentos y superficies. El lavado de manos con agua y jabón reduce esa transmisión. Es una medida simple, económica y aplicable en el hogar, la escuela, el trabajo y los centros de salud.

#### Cuándo lavarse las manos

- Antes de comer y antes de preparar alimentos.
- Después de ir al baño.
- Después de cambiar pañales o ayudar a un niño a ir al baño.
- Después de toser, estornudar o sonarse la nariz.
- Después de tocar animales.
- Después de llegar de la calle.
- Antes y después de cuidar a una persona enferma.
- Antes y después de curar una herida.

#### Cómo lavarse las manos

- Mojar las manos con agua segura.
- Aplicar jabón y frotar palmas, dorso, entre los dedos y debajo de las uñas.
- Frotar durante al menos 40 a 60 segundos.
- Enjuagar con agua segura.
- Secar con una toalla limpia o un paño desechable.
- Cerrar la canilla con la toalla o el codo si es posible.

#### Qué evitar

- No usar solo agua cuando hay jabón disponible.
- No reutilizar toallas sucias.
- No usar alcohol en gel si las manos están visiblemente sucias; primero lavar con agua y jabón.
- No descuidar la higiene de las uñas.
- No compartir toallas ni cepillos.
- No tocar la cara con las manos sucias.

#### Cuándo buscar atención médica

- Hay una herida que se infecta.
- Hay diarrea o vómitos persistentes.
- Hay fiebre con mal estado general.
- Hay síntomas respiratorios que empeoran.
- La persona es un bebé, un adulto mayor o tiene inmunosupresión.

#### Signos de alarma

- Fiebre alta con confusión.
- Dificultad respiratoria.
- Diarrea con sangre.
- Signos de deshidratación.
- Infección de piel que se extiende.
- Pérdida de conocimiento.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** requieren supervisión y ayuda.
- **Embarazadas:** extremar la higiene antes de comer y al preparar alimentos.
- **Adultos mayores:** facilitar el acceso a jabón y agua.
- **Personas inmunodeprimidas:** extremar la higiene de manos y del entorno.
- **Cuidadores:** lavarse las manos antes y después de cada cuidado.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Lavado de manos y alimentos». https://www.argentina.gob.ar/anmat/comunidad/informacion-de-interes-para-tu-salud/lavado-de-manos-y-alimentos (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Agua segura y salud». https://www.argentina.gob.ar/anmat/comunidad/informacion-de-interes-para-tu-salud/agua (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Alimentación segura». https://www.argentina.gob.ar/salud/verano/alimentacionsegura (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: PRE-002 -->

<!-- INICIO ARTICULO: PRE-003 -->
### PRE-003 · Vacunación

- **Identificador:** `PRE-003`
- **Categoría:** Prevención
- **Título:** Vacunación
- **Resumen para recuperación:** Las vacunas previenen enfermedades graves y protegen a la comunidad. El Calendario Nacional de Vacunación de Argentina incluye vacunas para todas las etapas de la vida y son gratuitas en centros de salud y hospitales públicos. El calendario se actualiza; consultar la versión vigente.
- **Palabras clave:** vacunación, vacunas, calendario nacional, vacuna antigripal, refuerzos, inmunización, prevención.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La vacunación es una de las principales medidas de prevención en salud pública. Las vacunas entrenan al sistema inmunitario para reconocer y responder frente a determinados microorganismos. Protegen a la persona vacunada y, cuando hay buenas coberturas, reducen la circulación de enfermedades y protegen a quienes no pueden vacunarse.

#### Aspectos generales del calendario

- El Calendario Nacional de Vacunación de Argentina incluye vacunas para bebés, niños, adolescentes, adultos, embarazadas y adultos mayores.
- Las vacunas del calendario están disponibles en vacunatorios, centros de salud y hospitales públicos, y no requieren orden médica.
- Algunas vacunas requieren refuerzos o dosis periódicas, como la antitetánica y la antigripal.
- El calendario se actualiza periódicamente; la versión vigente debe consultarse en el sitio oficial del Ministerio de Salud.
- Las personas con condiciones especiales pueden requerir esquemas particulares.

#### Recomendaciones generales y cuidados

- Revisar el carnet de vacunación y completar esquemas pendientes.
- Llevar el carnet a cada consulta y a cada vacunatorio.
- Consultar antes de viajar si se necesita alguna vacuna específica.
- Vacunarse contra la gripe si se pertenece a un grupo de riesgo.
- Vacunar a las personas que conviven con bebés o personas inmunodeprimidas, según indicación.
- Registrar las vacunas aplicadas.

#### Qué evitar

- No asumir que las vacunas de la infancia son suficientes para toda la vida.
- No interrumpir esquemas sin consultar.
- No usar remedios caseros en lugar de vacunas.
- No vacunarse en un momento de enfermedad aguda grave sin consultar.
- No difundir información sin verificar la fuente oficial.

#### Cuándo consultar antes de vacunarse

- Embarazo o lactancia.
- Fiebre o enfermedad aguda.
- Inmunosupresión o tratamiento con corticoides.
- Antecedente de reacción alérgica grave a una vacuna.
- Enfermedad crónica descompensada.
- Tratamiento con anticoagulantes.
- Viaje a una zona con requerimientos específicos.

#### Signos de alarma después de una vacuna

- Dificultad respiratoria.
- Hinchazón de labios, lengua o garganta.
- Urticaria generalizada.
- Mareo intenso o pérdida de conocimiento.
- Fiebre alta persistente.
- Convulsión.

Ante estos signos, acudir de inmediato a un servicio de emergencias y mencionar la vacuna recibida.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** seguir el calendario y consultar si hay atrasos.
- **Embarazadas:** hay vacunas recomendadas y otras contraindicadas; consultar.
- **Adultos mayores:** mantener refuerzos y vacuna antigripal según indicación.
- **Personas inmunodeprimidas:** consultar qué vacunas son seguras.
- **Personas con alergias graves:** informar antes de vacunarse.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Calendario Nacional de Vacunación». https://www.argentina.gob.ar/salud/vacunas (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Vacunas: preguntas frecuentes». https://www.argentina.gob.ar/salud/vacunas/preguntas-frecuentes (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Inmunización». https://www.who.int/es/news-room/fact-sheets/detail/immunization-coverage (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: PRE-003 -->

<!-- INICIO ARTICULO: PRE-004 -->
### PRE-004 · Prevención de enfermedades gastrointestinales

- **Identificador:** `PRE-004`
- **Categoría:** Prevención
- **Título:** Prevención de enfermedades gastrointestinales
- **Resumen para recuperación:** Las enfermedades gastrointestinales se transmiten por agua y alimentos contaminados o por manos sin lavar. Se previenen con agua segura, higiene de manos, correcta manipulación de alimentos, lactancia materna y vacunación según el calendario.
- **Palabras clave:** prevención, diarrea, gastroenteritis, agua segura, alimentos seguros, lavado de manos, SUH, higiene.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Las enfermedades gastrointestinales incluyen diarrea, gastroenteritis, intoxicaciones alimentarias y el síndrome urémico hemolítico (SUH). Se transmiten por vía fecal-oral: agua o alimentos contaminados, manos sin lavar u objetos contaminados. La prevención se basa en la higiene y en el uso de agua y alimentos seguros.

#### Medidas de prevención

- Usar agua segura para beber, cocinar, lavar alimentos y lavarse los dientes.
- Si el agua no es potable, hervirla o desinfectarla según las indicaciones oficiales.
- Lavarse las manos con agua y jabón antes de comer y después de ir al baño.
- Lavar frutas y verduras con agua segura.
- Cocinar bien las carnes, especialmente la carne picada.
- Separar alimentos crudos de cocidos.
- Mantener los alimentos refrigerados y respetar la cadena de frío.
- No consumir alimentos de procedencia dudosa o en mal estado.
- Continuar la lactancia materna durante los primeros meses de vida.

#### Qué evitar

- No consumir agua de origen dudoso sin tratarla.
- No dejar alimentos cocidos a temperatura ambiente por más de 2 horas.
- No descongelar alimentos a temperatura ambiente.
- No volver a congelar alimentos descongelados.
- No usar la misma tabla o cuchillo para crudos y cocidos sin lavarlos.
- No suspender la lactancia materna durante un episodio de diarrea.

#### Cuándo buscar atención médica

- Hay diarrea o vómitos persistentes.
- Hay sangre o moco en las heces.
- Hay fiebre alta.
- Hay signos de deshidratación.
- Hay dolor abdominal intenso.
- La persona es un bebé, un adulto mayor o una embarazada.
- Hay inmunosupresión.
- Aparece después de un viaje o de tomar antibióticos.

#### Signos de alarma

- Ausencia de orina, boca muy seca u ojos hundidos.
- Somnolencia excesiva o confusión.
- Piel pálida, fría o moteada.
- Heces con sangre abundante o negras.
- Dolor abdominal intenso.
- Convulsión.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** mayor riesgo de deshidratación y de SUH; extremar la higiene.
- **Embarazadas:** evitar alimentos crudos de riesgo y consultar ante diarrea.
- **Adultos mayores:** mayor riesgo de deshidratación.
- **Personas inmunodeprimidas:** mayor riesgo de infecciones graves.
- **Personas que manipulan alimentos:** extremar la higiene y la cadena de frío.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Alimentación segura». https://www.argentina.gob.ar/salud/verano/alimentacionsegura (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: PRE-004 -->

---

# Categoría 7 · Signos de alarma

> **Advertencia de categoría:** los artículos de esta sección describen situaciones de emergencia. La respuesta del chatbot debe ser breve, directa y orientada a llamar al servicio de emergencias. No se debe intentar diagnosticar ni calmar la situación con información educativa extensa.

<!-- INICIO ARTICULO: ALA-001 -->
### ALA-001 · Dificultad respiratoria

- **Identificador:** `ALA-001`
- **Categoría:** Signos de alarma
- **Título:** Dificultad respiratoria
- **Resumen para recuperación:** La dificultad respiratoria es la sensación de falta de aire o de esfuerzo para respirar. Puede ser una emergencia. Signos como labios azulados, incapacidad para hablar, somnolencia o hundimiento de costillas requieren llamar de inmediato a emergencias.
- **Palabras clave:** dificultad para respirar, falta de aire, disnea, ahogo, respiración rápida, labios azules, silbido.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La dificultad respiratoria puede ser leve o grave. Puede aparecer por asma, infecciones respiratorias, alergias, enfermedad cardíaca, obstrucción de la vía aérea, ansiedad o exposición a humo. La presencia de signos de gravedad exige atención inmediata, sin esperar a que los síntomas mejoren solos.

#### Signos y características

- Sensación de falta de aire.
- Respiración rápida o superficial.
- Silbido al respirar.
- Dificultad para hablar o completar frases.
- Uso de los músculos del cuello o del pecho para respirar.
- Hundimiento de las costillas en niños.
- Labios o cara azulados.
- Sudoración, agitación o somnolencia.

#### Posibles causas (orientativas, sin diagnóstico)

Asma, infección respiratoria, neumonía, reacción alérgica, obstrucción por un objeto, enfermedad cardíaca, ansiedad, exposición a humo o gases, entre otras. Un profesional debe evaluar la causa.

#### Qué hacer

- Llamar de inmediato al **107** o al **911** según la jurisdicción.
- Mantener a la persona sentada, incorporada y tranquila.
- Aflojar la ropa ajustada.
- Ventilar el ambiente.
- Si la persona tiene un inhalador de rescate indicado para asma, ayudarla a usarlo según su plan de acción.
- No dejarla sola.
- Seguir las instrucciones del operador de emergencias.

#### Qué evitar

- No acostar a la persona boca arriba si le cuesta respirar.
- No dar alimentos ni líquidos.
- No dar medicamentos que no estén indicados.
- No esperar a que los síntomas empeoren para llamar.
- No conducir por cuenta propia si se puede llamar a una ambulancia.

#### Cuándo buscar atención médica

- La dificultad respiratoria es intensa o repentina.
- Hay labios azulados, confusión o somnolencia.
- La persona no puede hablar o caminar.
- Hay dolor de pecho o silbido intenso.
- La persona es un bebé, un niño, una embarazada o un adulto mayor.
- Hay asma o enfermedad pulmonar crónica.
- Los síntomas no mejoran con el tratamiento indicado.

#### Signos de alarma

- Incapacidad para respirar o hablar.
- Labios o cara azulados.
- Pérdida de conocimiento.
- Respiración muy rápida o muy lenta.
- Hundimiento de costillas o uso de músculos del cuello.
- Confusión o agitación.
- Ronquido o estridor al respirar.

Ante estos signos, llamar de inmediato a emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la dificultad respiratoria puede empeorar rápido; consultar de inmediato.
- **Embarazadas:** consultar ante falta de aire intensa o dolor de pecho.
- **Adultos mayores:** pueden tener síntomas atípicos; consultar temprano.
- **Personas con asma o EPOC:** seguir su plan de acción y consultar si no mejora.
- **Personas con alergias graves:** considerar reacción anafiláctica.

#### Fuentes

- MedlinePlus en español. «Problemas respiratorios». https://medlineplus.gov/spanish/breathingproblems.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Neumonía». https://www.who.int/es/news-room/fact-sheets/detail/pneumonia (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ALA-001 -->

<!-- INICIO ARTICULO: ALA-002 -->
### ALA-002 · Dolor de pecho

- **Identificador:** `ALA-002`
- **Categoría:** Signos de alarma
- **Título:** Dolor de pecho
- **Resumen para recuperación:** El dolor de pecho puede deberse a causas musculares, digestivas o pulmonares, pero también puede ser un signo de infarto u otra emergencia cardiovascular. Ante un dolor opresivo, persistente o con sudoración, falta de aire o náuseas, llamar de inmediato a emergencias.
- **Palabras clave:** dolor de pecho, dolor torácico, infarto, presión en el pecho, dolor que irradia, emergencia cardíaca.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El dolor de pecho es un síntoma que puede tener causas muy distintas. Algunas son leves, como una contractura muscular o un cuadro digestivo; otras son graves, como un infarto agudo de miocardio, una embolia pulmonar o una disección aórtica. No es posible distinguirlas solo por la intensidad o la localización.

#### Signos y características

- Presión, opresión o peso en el pecho.
- Dolor que se irradia al brazo, el hombro, la mandíbula o la espalda.
- Sudoración fría.
- Falta de aire.
- Náuseas o vómitos.
- Mareo o desmayo.
- Palpitaciones.
- Dolor que empeora con el esfuerzo o no cede con el reposo.

#### Posibles causas (orientativas, sin diagnóstico)

Infarto, angina, pericarditis, embolia pulmonar, neumotórax, disección aórtica, reflujo gastroesofágico, espasmo esofágico, costocondritis, ansiedad o dolor muscular. Un profesional debe evaluar la causa.

#### Qué hacer

- Llamar de inmediato al **107** o al **911** según la jurisdicción.
- Mantener a la persona en reposo, sentada o semincorporada si le cuesta respirar.
- Aflojar la ropa ajustada.
- No dejarla sola.
- Seguir las instrucciones del operador de emergencias.
- Si el operador lo indica y la persona no tiene alergia ni sangrado, se le puede dar aspirina según sus instrucciones.

#### Qué evitar

- No conducir por cuenta propia.
- No esperar a que el dolor pase.
- No automedicarse con analgésicos ni antiácidos para “descartar” un infarto.
- No dar alimentos ni líquidos si hay náuseas o somnolencia.
- No hacer esfuerzo físico.
- No minimizar el dolor en personas con diabetes o adultos mayores, que pueden tener síntomas atípicos.

#### Cuándo buscar atención médica

- El dolor es opresivo, intenso o persistente.
- Se irradia al brazo, la mandíbula o la espalda.
- Se acompaña de falta de aire, sudoración o náuseas.
- Hay mareo, desmayo o palpitaciones.
- Hay antecedente de enfermedad cardíaca.
- La persona es un adulto mayor, una embarazada o tiene diabetes.
- El dolor aparece con el esfuerzo y mejora con el reposo.

#### Signos de alarma

- Dolor de pecho intenso con sudoración fría.
- Falta de aire.
- Pérdida de conocimiento.
- Pulso irregular o muy rápido.
- Dolor que se irradia al brazo o la mandíbula.
- Palidez, piel fría o moteada.
- Sensación de muerte inminente.

Ante estos signos, llamar de inmediato a emergencias.

#### Poblaciones que requieren precauciones especiales

- **Embarazadas:** el dolor de pecho requiere evaluación urgente.
- **Adultos mayores:** pueden tener infartos sin dolor típico.
- **Personas con diabetes:** pueden tener síntomas atípicos o silentes.
- **Personas con enfermedad cardíaca conocida:** seguir su plan de emergencia y llamar si el dolor no cede.
- **Personas con anticoagulantes:** no tomar aspirina sin indicación.

#### Fuentes

- MedlinePlus en español. «Dolor de pecho». https://medlineplus.gov/spanish/chestpain.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades cardiovasculares». https://www.who.int/es/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds) (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ALA-002 -->

<!-- INICIO ARTICULO: ALA-003 -->
### ALA-003 · Pérdida de conocimiento

- **Identificador:** `ALA-003`
- **Categoría:** Signos de alarma
- **Título:** Pérdida de conocimiento
- **Resumen para recuperación:** La pérdida de conocimiento puede ser un desmayo breve o un signo de una enfermedad grave. Si la persona no responde, verificar la respiración, llamar a emergencias e iniciar RCP si no respira y se tiene entrenamiento. No dar alimentos ni líquidos.
- **Palabras clave:** desmayo, síncope, pérdida de conciencia, inconsciencia, no responde, lipotimia, RCP.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La pérdida de conocimiento es la incapacidad de responder a estímulos. Puede ser breve, como en un desmayo, o prolongada, como en una convulsión, un traumatismo, una intoxicación o un paro cardíaco. La evaluación de la respiración y la llamada inmediata a emergencias son prioritarias.

#### Signos y características

- Falta de respuesta a la voz o al tacto.
- Palidez.
- Sudoración fría.
- Mareo previo.
- Visión borrosa o “visión en túnel”.
- En casos graves: ausencia de respiración, pulso débil o piel azulada.

#### Posibles causas (orientativas, sin diagnóstico)

Desmayo por bajada de presión, deshidratación, ayuno, calor, dolor intenso, problemas cardíacos, convulsión, traumatismo, intoxicación, hipoglucemia o accidente cerebrovascular. Un profesional debe evaluar la causa.

#### Qué hacer

- Verificar que la escena sea segura.
- Llamar al **107** o al **911** según la jurisdicción.
- Comprobar si la persona responde y respira.
- Si respira y no hay sospecha de lesión de columna, colocarla en posición de seguridad.
- Si no respira y se tiene entrenamiento, iniciar RCP y pedir un desfibrilador externo automático.
- Aflojar la ropa ajustada.
- Mantenerla abrigada y acompañada.

#### Qué evitar

- No dar alimentos ni líquidos a una persona inconsciente.
- No sacudirla con fuerza.
- No sentarla bruscamente.
- No dejarla sola.
- No moverla si hay sospecha de lesión de cuello o columna, salvo peligro inminente.
- No administrar medicamentos.

#### Cuándo buscar atención médica

- La persona no recupera el conocimiento en pocos segundos.
- Hay dificultad respiratoria.
- Hubo un golpe en la cabeza.
- Hay convulsión.
- Hay dolor de pecho o palpitaciones.
- La persona está embarazada, es un adulto mayor o tiene enfermedad cardíaca.
- Hay pérdida de conocimiento recurrente.
- Hay signos de accidente cerebrovascular.

#### Signos de alarma

- Ausencia de respiración.
- Pulso ausente o muy débil.
- Labios azulados.
- Convulsión prolongada.
- Pérdida de conocimiento repetida.
- Traumatismo craneal.
- Confusión al despertar.

Ante estos signos, llamar de inmediato a emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** consultar siempre, aunque el episodio haya sido breve.
- **Embarazadas:** la pérdida de conocimiento requiere evaluación urgente.
- **Adultos mayores:** mayor riesgo de causas cardíacas y de lesiones por caída.
- **Personas con diabetes:** considerar hipoglucemia, pero no dar azúcar si está inconsciente.
- **Personas con epilepsia:** seguir su plan de emergencia.

#### Fuentes

- MedlinePlus en español. «Desmayo». https://medlineplus.gov/spanish/fainting.html (consultado el 25/11/2026).
- Ministerio de Salud de la Provincia de Córdoba. «Primeros auxilios: desmayo». https://ministeriodesalud.cba.gov.ar/prevencion-y-cuidados/primeros-auxilios-desmayo (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ALA-003 -->

<!-- INICIO ARTICULO: ALA-004 -->
### ALA-004 · Convulsiones

- **Identificador:** `ALA-004`
- **Categoría:** Signos de alarma
- **Título:** Convulsiones
- **Resumen para recuperación:** Una convulsión es una alteración súbita de la actividad eléctrica del cerebro. Durante la crisis hay que proteger a la persona de golpes, no sujetarla y no poner objetos en la boca. Llamar a emergencias si dura más de 5 minutos, se repite, hay lesión o es la primera vez.
- **Palabras clave:** convulsión, epilepsia, crisis convulsiva, ataque, temblores, pérdida de conocimiento, primeros auxilios.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Una convulsión es una descarga eléctrica anormal en el cerebro que puede producir movimientos involuntarios, pérdida de conocimiento, rigidez, confusión o cambios de conducta. No todas las convulsiones son epilépticas: pueden deberse a fiebre, traumatismo, intoxicación, hipoglucemia, infección o accidente cerebrovascular. La mayoría de las crisis breves terminan solas.

#### Signos y características

- Movimientos rítmicos o sacudidas.
- Rigidez corporal.
- Pérdida de conocimiento.
- Mirada fija o desviada.
- Confusión o somnolencia después de la crisis.
- Incontinencia urinaria.
- Morderse la lengua o salivación.
- En algunos casos, solo desconexión breve o movimientos sutiles.

#### Posibles causas (orientativas, sin diagnóstico)

Epilepsia, fiebre en niños, traumatismo craneal, hipoglucemia, intoxicación o abstinencia, infección del sistema nervioso, accidente cerebrovascular, trastornos metabólicos. Un profesional debe evaluar la causa.

#### Qué hacer

- Proteger a la persona de golpes: retirar objetos cercanos y colocar algo blando bajo la cabeza.
- Aflojar la ropa alrededor del cuello.
- No sujetarla con fuerza.
- Medir el tiempo de la convulsión.
- Colocarla en posición de seguridad cuando termine, si respira.
- Llamar a emergencias.
- Acompañarla hasta que llegue la ayuda.

#### Qué evitar

- No poner objetos en la boca.
- No intentar abrir la boca a la fuerza.
- No dar agua ni alimentos durante la convulsión.
- No sujetar los brazos o las piernas.
- No dejarla sola.
- No moverla si hay sospecha de traumatismo, salvo peligro inminente.

#### Cuándo buscar atención médica

- La convulsión dura más de 5 minutos.
- Se repite en pocos minutos.
- Hay dificultad respiratoria o lesión.
- Es la primera convulsión de la persona.
- La persona está embarazada, es un bebé o un adulto mayor.
- Hay fiebre alta, dolor de cabeza intenso o rigidez de cuello.
- Hay diabetes o enfermedad renal.
- La persona no recupera la conciencia después de la crisis.

#### Signos de alarma

- Convulsión de más de 5 minutos.
- Convulsiones repetidas sin recuperar la conciencia.
- Dificultad respiratoria o labios azulados.
- Lesión en la cabeza.
- Fiebre alta en un bebé.
- Embarazo.
- Confusión persistente después de la crisis.

Ante estos signos, llamar de inmediato a emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** la convulsión con fiebre requiere evaluación inmediata.
- **Embarazadas:** una convulsión puede indicar una emergencia obstétrica.
- **Adultos mayores:** considerar causas metabólicas, infecciosas o vasculares.
- **Personas con epilepsia:** seguir su plan de acción y no suspender medicación.
- **Personas con diabetes:** considerar hipoglucemia, pero no dar azúcar durante la convulsión.

#### Fuentes

- MedlinePlus en español. «Convulsiones». https://medlineplus.gov/spanish/ency/article/003200.htm (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Manual de primeros auxilios y prevención de lesiones». https://immca.conicet.gov.ar/wp-content/uploads/sites/13/2019/07/manual_1ros_auxilios_web.pdf (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ALA-004 -->

<!-- INICIO ARTICULO: ALA-005 -->
### ALA-005 · Signos de accidente cerebrovascular

- **Identificador:** `ALA-005`
- **Categoría:** Signos de alarma
- **Título:** Signos de accidente cerebrovascular
- **Resumen para recuperación:** El accidente cerebrovascular (ACV) ocurre por obstrucción o ruptura de una arteria cerebral. Se reconoce por aparición repentina de cara caída, debilidad en un brazo, dificultad para hablar, pérdida de equilibrio o alteración de la visión. Es una emergencia: cada minuto cuenta.
- **Palabras clave:** ACV, accidente cerebrovascular, derrame cerebral, ictus, cara caída, debilidad, dificultad para hablar, emergencia.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

El accidente cerebrovascular (ACV) se produce cuando una arteria del cerebro se obstruye o se rompe, y una parte del cerebro deja de recibir sangre. Es una de las principales causas de muerte y discapacidad. El tratamiento oportuno puede reducir las secuelas, por lo que la detección rápida y el traslado inmediato son fundamentales.

#### Signos y características

- Debilidad o parálisis repentina de un lado de la cara, un brazo o una pierna.
- Desviación de la boca.
- Dificultad para hablar o entender.
- Pérdida de visión o visión doble.
- Pérdida de equilibrio o dificultad para caminar.
- Dolor de cabeza súbito e intenso.
- Confusión o alteración del estado de conciencia.

#### Posibles causas (orientativas, sin diagnóstico)

Obstrucción por un coágulo (ACV isquémico), ruptura de una arteria (ACV hemorrágico), hipertensión, fibrilación auricular, diabetes, tabaquismo, dislipemia y otras enfermedades vasculares. No es posible determinar el tipo sin estudios.

#### Qué hacer

- Llamar de inmediato al **107** o al **911** según la jurisdicción.
- Anotar la hora en que comenzaron los síntomas.
- Mantener a la persona en reposo, sentada o recostada de lado si está inconsciente.
- No darle alimentos ni líquidos.
- No darle medicamentos.
- Acompañarla hasta que llegue la ayuda.
- Informar al operador los síntomas y la hora de inicio.

#### Qué evitar

- No esperar a que los síntomas pasen.
- No dar aspirina ni otros medicamentos.
- No dar alimentos ni líquidos.
- No dejar sola a la persona.
- No conducir por cuenta propia si se puede llamar a una ambulancia.
- No minimizar los síntomas aunque mejoren.

#### Cuándo buscar atención médica

- Cualquier signo repentino de ACV.
- Debilidad o adormecimiento de un lado del cuerpo.
- Dificultad para hablar o entender.
- Pérdida súbita de visión.
- Pérdida de equilibrio o caída inexplicable.
- Dolor de cabeza súbito e intenso.
- Confusión o alteración de la conciencia.

#### Signos de alarma

- Cara caída.
- Debilidad o parálisis de un brazo o una pierna.
- Dificultad para hablar o comprender.
- Pérdida de visión.
- Pérdida de equilibrio.
- Dolor de cabeza súbito e intenso.
- Pérdida de conocimiento.

Ante estos signos, llamar de inmediato a emergencias.

#### Poblaciones que requieren precauciones especiales

- **Embarazadas:** el ACV puede ocurrir durante el embarazo o el puerperio; consultar de inmediato.
- **Adultos mayores:** mayor riesgo; no atribuir los síntomas a la edad.
- **Personas con hipertensión, diabetes o fibrilación auricular:** controlar los factores de riesgo.
- **Personas con antecedente de ACV:** seguir el tratamiento y consultar ante síntomas nuevos.
- **Personas que toman anticoagulantes:** informar al equipo de salud.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Programa Nacional para el Diagnóstico y Tratamiento del Accidente Cerebrovascular (PRONAC-ACV)». https://www.argentina.gob.ar/salud/programa-nacional-para-el-diagnostico-y-tratamiento-del-accidente-cerebrovascular-pronac-acv-0 (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Accidente cerebrovascular». https://www.who.int/es/news-room/fact-sheets/detail/stroke (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Enfermedades cardiovasculares». https://www.who.int/es/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds) (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ALA-005 -->

<!-- INICIO ARTICULO: ALA-006 -->
### ALA-006 · Reacciones alérgicas graves

- **Identificador:** `ALA-006`
- **Categoría:** Signos de alarma
- **Título:** Reacciones alérgicas graves
- **Resumen para recuperación:** Una reacción alérgica grave o anafilaxia puede comprometer la respiración y la circulación. Se reconoce por hinchazón de labios, lengua o garganta, dificultad respiratoria, urticaria generalizada, vómitos, mareo o pérdida de conocimiento. Es una emergencia.
- **Palabras clave:** alergia grave, anafilaxia, shock anafiláctico, hinchazón de garganta, urticaria, dificultad respiratoria, adrenalina.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

La anafilaxia es una reacción alérgica grave, de aparición rápida, que puede afectar la piel, las vías respiratorias, el corazón y el aparato digestivo. Puede ser causada por alimentos, medicamentos, picaduras de insectos o látex. Requiere atención inmediata porque puede progresar a shock y poner en riesgo la vida.

#### Signos y características

- Urticaria generalizada y picazón.
- Hinchazón de labios, lengua, cara o garganta.
- Dificultad para respirar o tragar.
- Ronquera o voz apagada.
- Silbido al respirar.
- Náuseas, vómitos o dolor abdominal.
- Mareo, palidez o desmayo.
- Sensación de muerte inminente.

#### Posibles causas (orientativas, sin diagnóstico)

Alimentos (maní, frutos secos, mariscos, leche, huevo), medicamentos (antibióticos, antiinflamatorios), picaduras de abejas o avispas, látex y otras sustancias. En algunos casos no se identifica la causa.

#### Qué hacer

- Llamar de inmediato al **107** o al **911** según la jurisdicción.
- Si la persona tiene un autoinyector de adrenalina indicado, usarlo según su plan de acción.
- Acostarla con las piernas elevadas si respira con dificultad; si tiene dificultad para respirar, mantenerla sentada.
- No dejarla sola.
- Si hay pérdida de conocimiento y no respira, iniciar RCP si se tiene entrenamiento.
- Seguir las instrucciones del operador de emergencias.

#### Qué evitar

- No esperar a que los síntomas mejoren.
- No dar alimentos ni líquidos si hay dificultad para tragar.
- No administrar medicamentos que no estén indicados.
- No hacer que la persona camine o se esfuerce.
- No retirar el aguijón con pinzas si está incrustado; buscar ayuda.
- No minimizar la hinchazón de garganta.

#### Cuándo buscar atención médica

- Hinchazón de labios, lengua o garganta.
- Dificultad para respirar o tragar.
- Urticaria generalizada.
- Vómitos o dolor abdominal después de una exposición.
- Mareo o desmayo.
- Antecedente de anafilaxia.
- Reacción después de un medicamento o una picadura.

#### Signos de alarma

- Dificultad respiratoria o estridor.
- Hinchazón de la garganta.
- Pérdida de conocimiento.
- Pulso débil o rápido.
- Piel pálida, fría o moteada.
- Convulsión.
- Sensación de muerte inminente.

Ante estos signos, llamar de inmediato a emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** consultar de inmediato; la progresión puede ser rápida.
- **Embarazadas:** la anafilaxia es una emergencia materna y fetal.
- **Adultos mayores:** mayor riesgo de complicaciones cardiovasculares.
- **Personas con asma:** mayor riesgo de reacción grave.
- **Personas con antecedente de anafilaxia:** llevar su plan de acción y autoinyector si está indicado.

#### Fuentes

- MedlinePlus en español. «Reacciones alérgicas». https://medlineplus.gov/spanish/ency/article/000005.htm (consultado el 25/11/2026).
- MedlinePlus en español. «Anafilaxia». https://medlineplus.gov/spanish/anaphylaxis.html (consultado el 25/11/2026).
- MedlinePlus en español. «Alergia». https://medlineplus.gov/spanish/allergy.html (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ALA-006 -->

<!-- INICIO ARTICULO: ALA-007 -->
### ALA-007 · Otros síntomas que requieren atención urgente

- **Identificador:** `ALA-007`
- **Categoría:** Signos de alarma
- **Título:** Otros síntomas que requieren atención urgente
- **Resumen para recuperación:** Además de los signos clásicos, hay otros síntomas que requieren atención urgente: fiebre en bebés pequeños, dolor abdominal intenso, vómitos con sangre, sangrado abundante, intoxicaciones, traumatismos graves, dificultad para respirar y riesgo suicida.
- **Palabras clave:** urgencia, emergencia, síntomas graves, intoxicación, sangrado, traumatismo, fiebre en bebé, riesgo suicida.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Algunos síntomas no parecen emergencias a primera vista, pero pueden indicar una situación grave. Ante la duda, es preferible consultar. El chatbot debe priorizar la derivación a un servicio de emergencias cuando el relato incluya cualquiera de los signos de este artículo.

#### Situaciones que requieren atención urgente

- Fiebre en un bebé menor de 3 meses.
- Dolor abdominal intenso, continuo o con abdomen rígido.
- Vómitos con sangre o con aspecto de “borra de café”.
- Heces negras o con sangre abundante.
- Sangrado que no cede con presión.
- Dificultad respiratoria o labios azulados.
- Dolor de pecho opresivo.
- Pérdida de conocimiento o convulsión.
- Signos de ACV.
- Reacción alérgica grave.
- Traumatismo craneal con vómitos, confusión o somnolencia.
- Quemadura extensa, profunda o en zonas críticas.
- Intoxicación o ingestión de sustancia desconocida.
- Ahogamiento o electrocución.
- Deshidratación grave.
- Ideación suicida o riesgo para sí mismo o para terceros.

#### Qué hacer

- Llamar al **107** o al **911** según la jurisdicción.
- Informar la ubicación, el estado de la persona y qué ocurrió.
- No dejar sola a la persona.
- Seguir las instrucciones del operador.
- Si hay riesgo suicida, no dejar sola a la persona y buscar ayuda profesional inmediata.

#### Qué evitar

- No esperar a que los síntomas “pasen solos”.
- No automedicarse para enmascarar los síntomas.
- No dar alimentos ni líquidos si hay somnolencia, vómitos o dificultad para tragar.
- No mover a una persona con sospecha de lesión de columna, salvo peligro inminente.
- No minimizar un síntoma por la edad o por el contexto.

#### Cuándo buscar atención médica

- Cualquier síntoma de la lista anterior.
- Síntomas que empeoran rápidamente.
- Síntomas nuevos en una persona con enfermedad crónica.
- Síntomas en un bebé, una embarazada o un adulto mayor.
- Duda sobre la gravedad: consultar.

#### Signos de alarma

- Dificultad respiratoria.
- Pérdida de conocimiento.
- Convulsión.
- Sangrado abundante.
- Dolor intenso.
- Confusión.
- Piel pálida, fría o moteada.
- Riesgo para sí mismo o para terceros.

Ante estos signos, llamar de inmediato a emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** consultar temprano ante cualquier cambio importante.
- **Embarazadas:** consultar ante dolor, sangrado, pérdida de líquido o disminución de movimientos fetales.
- **Adultos mayores:** consultar ante confusión, caída o descompensación.
- **Personas con enfermedades crónicas:** consultar ante síntomas nuevos o empeoramiento.
- **Personas con riesgo suicida:** buscar ayuda profesional inmediata y no dejarlas solas.

#### Fuentes

- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).
- MedlinePlus en español. «Primeros auxilios». https://medlineplus.gov/spanish/firstaid.html (consultado el 25/11/2026).
- Organización Mundial de la Salud. «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ALA-007 -->

---

# Categoría 8 · Atención médica

> **Nota de categoría:** estos artículos orientan sobre cómo prepararse para una consulta o un estudio. No reemplazan las indicaciones del profesional ni del centro de salud. Si hay un signo de alarma, no se debe esperar un turno: hay que acudir a una guardia o llamar a emergencias.

<!-- INICIO ARTICULO: ATE-001 -->
### ATE-001 · Preparación para consultas

- **Identificador:** `ATE-001`
- **Categoría:** Atención médica
- **Título:** Preparación para consultas
- **Resumen para recuperación:** Preparar una consulta mejora la comunicación con el profesional. Conviene anotar síntomas, duración, medicamentos, alergias, estudios previos y preguntas. Llevar acompañante y pedir instrucciones por escrito ayuda a seguir el plan.
- **Palabras clave:** consulta médica, preparar consulta, preguntas al médico, historia clínica, medicamentos, alergias, turno.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Una consulta médica es más útil cuando la persona llega con información ordenada y preguntas claras. Esto ayuda al profesional a comprender el problema y a la persona a recordar las indicaciones. La preparación no reemplaza la evaluación ni permite anticipar un diagnóstico.

#### Qué llevar y preparar

- Documento de identidad y credencial del seguro o obra social.
- Lista de medicamentos actuales, con nombres y horarios, incluidos los de venta libre y suplementos.
- Lista de alergias conocidas.
- Estudios previos y resultados de laboratorio.
- Carnet de vacunación, si corresponde.
- Fechas de inicio y evolución de los síntomas.
- Preguntas concretas que se quieran hacer.
- Un acompañante, si se prevé que la consulta será compleja o si la persona tiene dificultad para recordar.

#### Cómo describir los síntomas

- Indicar cuándo comenzaron y si fueron súbitos o graduales.
- Describir la localización, la intensidad y el tipo de molestia.
- Mencionar qué mejora o empeora los síntomas.
- Informar si hay fiebre, pérdida de peso, cansancio u otros síntomas asociados.
- Comentar los tratamientos probados y si funcionaron.
- No ocultar el consumo de alcohol, tabaco u otras sustancias.

#### Preguntas útiles para la consulta

- ¿Qué podría estar causando estos síntomas?
- ¿Qué estudios o controles necesita?
- ¿Qué debo hacer si los síntomas empeoran?
- ¿Qué efectos adversos debo vigilar?
- ¿Cuándo debo volver?
- ¿Hay alguna restricción de alimentación, actividad o trabajo?
- ¿Cómo debo tomar la medicación indicada?

#### Qué evitar

- No automedicarse antes de la consulta para “ocultar” los síntomas.
- No omitir medicamentos, suplementos o alergias.
- No interrumpir un tratamiento crónico sin consultar.
- No asistir solo si hay riesgo de descompensación.
- No ir a una consulta programada si hay un signo de alarma: acudir a una guardia.

#### Cuándo buscar atención inmediata en lugar de esperar un turno

- Dificultad respiratoria.
- Dolor de pecho.
- Pérdida de conocimiento o convulsión.
- Signos de ACV.
- Sangrado abundante.
- Dolor abdominal intenso.
- Fiebre en un bebé menor de 3 meses.
- Reacción alérgica grave.
- Riesgo suicida.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** llevar el carnet de vacunación y el peso actualizado.
- **Embarazadas:** informar el embarazo y la semana de gestación.
- **Adultos mayores:** llevar lista de medicamentos y acompañante si es posible.
- **Personas con enfermedades crónicas:** llevar estudios recientes y el plan de tratamiento.
- **Personas que no hablan el idioma:** solicitar intérprete o acompañante.

#### Fuentes

- MedlinePlus en español. «Hablando con su doctor». https://medlineplus.gov/spanish/talkingwithyourdoctor.html (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ATE-001 -->

<!-- INICIO ARTICULO: ATE-002 -->
### ATE-002 · Preparación para estudios

- **Identificador:** `ATE-002`
- **Categoría:** Atención médica
- **Título:** Preparación para estudios
- **Resumen para recuperación:** La preparación para un estudio depende del tipo de estudio y del centro. Conviene seguir las instrucciones escritas, informar medicamentos, alergias, embarazo e implantes, y no suspender tratamientos por cuenta propia. Las indicaciones específicas deben confirmarse con el centro.
- **Palabras clave:** estudios médicos, preparación, ayuno, análisis de sangre, radiografía, resonancia, tomografía, contraste, instrucciones.
- **Estado de validación:** `pendiente` — las indicaciones varían según el estudio y el centro; requiere validación local.

#### Descripción general

Los estudios médicos incluyen análisis de laboratorio, radiografías, ecografías, tomografías, resonancias y otros procedimientos. Cada estudio tiene requisitos propios: ayuno, hidratación, suspensión temporal de medicamentos, contraste o acompañamiento. La indicación del profesional que solicita el estudio y las instrucciones del centro son las fuentes principales.

#### Recomendaciones generales

- Leer las instrucciones del centro con anticipación.
- Confirmar si se requiere ayuno y durante cuánto tiempo.
- Preguntar si se puede tomar agua y medicación habitual.
- Informar todos los medicamentos, especialmente anticoagulantes y antidiabéticos.
- Informar alergias, especialmente a contrastes.
- Informar embarazo o posibilidad de embarazo.
- Informar implantes, marcapasos, prótesis o claustrofobia.
- Llevar la orden médica, documento de identidad y estudios previos.
- Coordinar el regreso a casa si se sedará o se usará contraste.

#### Qué evitar

- No suspender medicamentos por cuenta propia.
- No romper el ayuno indicado.
- No ocultar embarazo, alergias o implantes.
- No asistir solo si el estudio puede producir mareo o sedación.
- No usar joyas o objetos metálicos si el estudio lo prohíbe.
- No asumir que todos los estudios requieren ayuno.

#### Cuándo consultar antes del estudio

- Embarazo o lactancia.
- Alergia a contraste o a medicamentos.
- Enfermedad renal o diabetes.
- Tratamiento con anticoagulantes.
- Marcapasos, implantes o cirugía reciente.
- Claustrofobia.
- Dificultad para permanecer quieto o para tolerar el estudio.
- Fiebre o infección el día del estudio.

#### Cuándo buscar atención médica

- Reacción al contraste: urticaria, dificultad respiratoria, hinchazón o mareo.
- Sangrado después de una punción.
- Dolor intenso o hinchazón en el sitio de la punción.
- Mareo o desmayo después del estudio.
- Fiebre después de un procedimiento.

#### Signos de alarma

- Dificultad respiratoria.
- Hinchazón de labios, lengua o garganta.
- Pérdida de conocimiento.
- Convulsión.
- Sangrado abundante.
- Dolor de pecho.

Ante estos signos, acudir de inmediato a un servicio de emergencias.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** pueden requerir ayuno más corto y acompañamiento; seguir las indicaciones pediátricas.
- **Embarazadas:** informar siempre; algunos estudios no se realizan durante el embarazo.
- **Adultos mayores:** coordinar transporte y acompañamiento.
- **Personas con enfermedad renal o diabetes:** consultar por preparación especial y medicamentos.
- **Personas con anticoagulantes:** consultar antes de procedimientos invasivos.

#### Fuentes

- MedlinePlus en español. «Pruebas médicas». https://medlineplus.gov/spanish/labtests.html (consultado el 25/11/2026).
- MedlinePlus en español. «Diagnóstico por imágenes». https://medlineplus.gov/spanish/diagnosticimaging.html (consultado el 25/11/2026).
- MedlinePlus en español. «Hablando con su doctor». https://medlineplus.gov/spanish/talkingwithyourdoctor.html (consultado el 25/11/2026).

#### Estado de validación médica

`pendiente` — las indicaciones concretas dependen del estudio, del centro y del profesional solicitante. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ATE-002 -->

<!-- INICIO ARTICULO: ATE-003 -->
### ATE-003 · Recomendaciones generales antes de acudir a una consulta

- **Identificador:** `ATE-003`
- **Categoría:** Atención médica
- **Título:** Recomendaciones generales antes de acudir a una consulta
- **Resumen para recuperación:** Antes de una consulta conviene organizar la información, reunir estudios y medicamentos, y decidir si se necesita acompañante. Si hay signos de alarma, no se debe esperar el turno: hay que acudir a una guardia o llamar a emergencias.
- **Palabras clave:** consulta, turno, guardia, preparación, síntomas, acompañante, emergencia.
- **Estado de validación:** `documentado` — pendiente de revisión médica local.

#### Descripción general

Acudir a una consulta de forma ordenada mejora la calidad de la atención y ayuda a que el profesional comprenda el problema. También reduce el riesgo de olvidar información importante. La consulta programada no es el lugar adecuado para una emergencia: si hay signos de alarma, se debe acudir a una guardia.

#### Recomendaciones generales

- Anotar los síntomas y su evolución.
- Reunir estudios previos y resultados.
- Llevar una lista de medicamentos y alergias.
- Preparar preguntas concretas.
- Considerar llevar un acompañante.
- Llegar con anticipación y con la documentación necesaria.
- Informar si se está embarazada, si se amamanta o si se tiene una enfermedad crónica.
- Pedir que las indicaciones importantes queden por escrito.

#### Qué evitar

- No automedicarse para “llegar mejor” a la consulta.
- No ocultar información por vergüenza o miedo.
- No suspender medicación crónica sin consultar.
- No llevar a un niño enfermo a una consulta sin pañales, alimentos o elementos necesarios.
- No esperar un turno si hay dificultad respiratoria, dolor de pecho, pérdida de conocimiento o sangrado grave.

#### Cuándo buscar atención inmediata

- Dificultad respiratoria.
- Dolor de pecho.
- Pérdida de conocimiento o convulsión.
- Signos de ACV.
- Sangrado abundante.
- Dolor abdominal intenso.
- Fiebre en un bebé menor de 3 meses.
- Reacción alérgica grave.
- Riesgo suicida.

#### Poblaciones que requieren precauciones especiales

- **Bebés y niños:** llevar carnet de vacunación, peso y pañales.
- **Embarazadas:** informar el embarazo y llevar los controles.
- **Adultos mayores:** llevar lista de medicamentos y acompañante.
- **Personas con discapacidad:** solicitar las adaptaciones necesarias.
- **Personas con enfermedad crónica:** llevar el plan de tratamiento y estudios recientes.

#### Fuentes

- MedlinePlus en español. «Hablando con su doctor». https://medlineplus.gov/spanish/talkingwithyourdoctor.html (consultado el 25/11/2026).
- Ministerio de Salud de la Nación (Argentina). «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios (consultado el 25/11/2026).
- MedlinePlus en español. «Pruebas médicas». https://medlineplus.gov/spanish/labtests.html (consultado el 25/11/2026).

#### Estado de validación médica

`documentado` — contenido educativo respaldado por las fuentes citadas. **Pendiente de revisión y aprobación por un profesional médico habilitado antes de su uso en producción.** No usar para diagnóstico ni prescripción.
<!-- FIN ARTICULO: ATE-003 -->

---

# Anexos

## Anexo A · Catálogo consolidado de fuentes

Este catálogo reúne las fuentes citadas en los artículos. Cada artículo incluye sus propias referencias para que los fragmentos recuperados conserven la trazabilidad.

### Ministerio de Salud de la Nación (Argentina)

- «Calendario Nacional de Vacunación». https://www.argentina.gob.ar/salud/vacunas
- «Vacunas: preguntas frecuentes». https://www.argentina.gob.ar/salud/vacunas/preguntas-frecuentes
- «Primeros auxilios». https://www.argentina.gob.ar/salud/primerosauxilios
- «Manual de primeros auxilios y prevención de lesiones». https://immca.conicet.gov.ar/wp-content/uploads/sites/13/2019/07/manual_1ros_auxilios_web.pdf
- «Enfermedades diarreicas». https://www.argentina.gob.ar/salud/glosario/diarrea
- «Alimentación segura». https://www.argentina.gob.ar/salud/verano/alimentacionsegura
- «Hidratación adecuada y consumo de agua segura». https://www.argentina.gob.ar/salud/verano/aguasegura
- «Olas de calor». https://www.argentina.gob.ar/salud/verano/olas-de-calor
- «Síntomas y signos de alarma - Dengue». https://www.argentina.gob.ar/sintomas-y-signos-de-alarma
- «Programa Nacional para el Diagnóstico y Tratamiento del Accidente Cerebrovascular (PRONAC-ACV)». https://www.argentina.gob.ar/salud/programa-nacional-para-el-diagnostico-y-tratamiento-del-accidente-cerebrovascular-pronac-acv-0
- «Recomendaciones del Ministerio de Salud ante la ola de calor». https://www.argentina.gob.ar/noticias/recomendaciones-del-ministerio-de-salud-ante-la-ola-de-calor

### Administración Nacional de Medicamentos, Alimentos y Tecnología Médica (ANMAT)

- «Disposición 7572/2006 - Paracetamol». https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-7572-2006-123362/texto
- «Vademécum Nacional de Medicamentos». http://anmatvademecum.servicios.pami.org.ar/
- «ANMAT informa sobre ibuprofeno». https://www.argentina.gob.ar/noticias/anmat-informa-sobre-ibuprofeno
- «Prospecto Actron Pediátrico 4% (ibuprofeno)». http://ifas.anmat.gob.ar/VerArchivo?id=4752&srnd=ec71ebb6-67f7-4a6e-aa45-837f0ab8e27a&tipo=pdf
- «Lavado de manos y alimentos». https://www.argentina.gob.ar/anmat/comunidad/informacion-de-interes-para-tu-salud/lavado-de-manos-y-alimentos
- «Agua segura y salud». https://www.argentina.gob.ar/anmat/comunidad/informacion-de-interes-para-tu-salud/agua

### Organización Mundial de la Salud (OMS)

- «Gripe (estacional)». https://www.who.int/es/news-room/fact-sheets/detail/influenza-(seasonal)
- «Neumonía». https://www.who.int/es/news-room/fact-sheets/detail/pneumonia
- «Enfermedades diarreicas». https://www.who.int/es/news-room/fact-sheets/detail/diarrhoeal-disease
- «Dengue y dengue grave». https://www.who.int/es/news-room/fact-sheets/detail/dengue-and-severe-dengue
- «Quemaduras». https://www.who.int/es/news-room/fact-sheets/detail/burns
- «Caídas». https://www.who.int/es/news-room/fact-sheets/detail/falls
- «Accidente cerebrovascular». https://www.who.int/es/news-room/fact-sheets/detail/stroke
- «Enfermedades cardiovasculares». https://www.who.int/es/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)
- «Alimentación saludable». https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet
- «Actividad física». https://www.who.int/es/news-room/fact-sheets/detail/physical-activity
- «Inmunización». https://www.who.int/es/news-room/fact-sheets/detail/immunization-coverage
- «Resistencia a los antimicrobianos». https://www.who.int/es/news-room/fact-sheets/detail/antimicrobial-resistance
- «Respuesta de primeros auxilios en la comunidad: guía de bolsillo». https://cdn.who.int/media/docs/default-source/documents/gui-a-de-bolsillo-cfar.pdf

### Organización Panamericana de la Salud (OPS)

- «Influenza». https://www.paho.org/es/temas/influenza
- «Dengue». https://www.paho.org/es/temas/dengue
- «Vacunación». https://www.paho.org/es/temas/vacunacion

### MedlinePlus en español (Biblioteca Nacional de Medicina de EE. UU.)

- «Dolor de cabeza». https://medlineplus.gov/spanish/headache.html
- «Fiebre». https://medlineplus.gov/spanish/fever.html
- «Tos». https://medlineplus.gov/spanish/cough.html
- «Dolor de garganta». https://medlineplus.gov/spanish/sorethroat.html
- «Rinorrea o congestión nasal en adultos». https://medlineplus.gov/spanish/ency/article/003049.htm
- «Rinorrea o congestión nasal en niños». https://medlineplus.gov/spanish/ency/article/003051.htm
- «Dolores musculares». https://medlineplus.gov/spanish/ency/article/003178.htm
- «Distensión muscular». https://medlineplus.gov/spanish/ency/article/000042.htm
- «Náuseas y vómitos». https://medlineplus.gov/spanish/nauseaandvomiting.html
- «Diarrea». https://medlineplus.gov/spanish/diarrhea.html
- «Dolor abdominal». https://medlineplus.gov/spanish/abdominalpain.html
- «Resfriado común». https://medlineplus.gov/spanish/commoncold.html
- «Resfriado común» (enciclopedia médica). https://medlineplus.gov/spanish/ency/article/000678.htm
- «Gripe». https://medlineplus.gov/spanish/flu.html
- «Gastroenteritis». https://medlineplus.gov/spanish/gastroenteritis.html
- «Deshidratación». https://medlineplus.gov/spanish/dehydration.html
- «Dormir bien». https://medlineplus.gov/spanish/healthysleep.html
- «Alergia». https://medlineplus.gov/spanish/allergy.html
- «Rinitis alérgica». https://medlineplus.gov/spanish/hayfever.html
- «Reacciones alérgicas». https://medlineplus.gov/spanish/ency/article/000005.htm
- «Anafilaxia». https://medlineplus.gov/spanish/anaphylaxis.html
- «Desmayo». https://medlineplus.gov/spanish/fainting.html
- «Convulsiones». https://medlineplus.gov/spanish/ency/article/003200.htm
- «Dolor de pecho». https://medlineplus.gov/spanish/chestpain.html
- «Problemas respiratorios». https://medlineplus.gov/spanish/breathingproblems.html
- «Primeros auxilios». https://medlineplus.gov/spanish/firstaid.html
- «Hablando con su doctor». https://medlineplus.gov/spanish/talkingwithyourdoctor.html
- «Pruebas médicas». https://medlineplus.gov/spanish/labtests.html
- «Diagnóstico por imágenes». https://medlineplus.gov/spanish/diagnosticimaging.html

### Ministerios de Salud provinciales

- Ministerio de Salud de la Provincia de Córdoba. «Primeros auxilios: quemaduras». https://ministeriodesalud.cba.gov.ar/prevencion-y-cuidados/primeros-auxilios-quemaduras
- Ministerio de Salud de la Provincia de Córdoba. «Cómo prevenir quemaduras y qué hacer ante este tipo de accidentes». https://ministeriodesalud.cba.gov.ar/como-prevenir-quemaduras-y-que-hacer-ante-este-tipo-de-accidentes
- Ministerio de Salud de la Provincia de Córdoba. «Consejos para evitar accidentes domésticos». https://ministeriodesalud.cba.gov.ar/consejos-para-evitar-accidentes-domesticos
- Ministerio de Salud de la Provincia de Córdoba. «Primeros auxilios: desmayo». https://ministeriodesalud.cba.gov.ar/prevencion-y-cuidados/primeros-auxilios-desmayo

## Anexo B · Checklist de validación médica

Antes de habilitar esta base para producción, un profesional médico habilitado debe revisar y firmar cada punto:

- [ ] Revisar la exactitud de todos los artículos de síntomas y enfermedades.
- [ ] Confirmar que no se presentan diagnósticos ni prescripciones.
- [ ] Confirmar que no hay dosis, frecuencias ni duraciones de medicamentos.
- [ ] Revisar las contraindicaciones y precauciones de los artículos de medicamentos.
- [ ] Verificar la adaptación de las recomendaciones a la población local y al sistema de salud municipal.
- [ ] Revisar los criterios de derivación y los números de emergencia locales.
- [ ] Confirmar la vigencia del Calendario Nacional de Vacunación.
- [ ] Revisar las recomendaciones para embarazadas, bebés, niños, adultos mayores y personas con enfermedades preexistentes.
- [ ] Verificar que cada artículo tenga fuentes citadas y verificables.
- [ ] Aprobar, corregir o bloquear cada artículo y registrar la decisión.
- [ ] Definir un responsable y una periodicidad de revisión.
- [ ] Definir el procedimiento para retirar contenido ante un error o una alerta sanitaria.

**Firma del revisor:** __________________________

**Matrícula:** __________________________

**Fecha:** __________________________

**Observaciones:** ____________________________________________________________

## Anexo C · Estrategia de chunking y metadatos para RAG

### C.1. Unidad principal de fragmentación

La unidad principal debe ser el artículo completo delimitado por `<!-- INICIO ARTICULO: ... -->` y `<!-- FIN ARTICULO: ... -->`. Cada artículo tiene un identificador único, categoría y título, y puede recuperarse sin depender de otros artículos.

### C.2. Fragmentación secundaria

Si el artículo supera el tamaño máximo definido para el modelo de embeddings, dividirlo por los subtítulos `####`:

- `Descripción general`
- `Síntomas y características`
- `Posibles causas`
- `Recomendaciones generales y cuidados`
- `Qué evitar`
- `Cuándo buscar atención médica`
- `Signos de alarma`
- `Medicamentos`
- `Poblaciones que requieren precauciones especiales`
- `Fuentes`
- `Estado de validación médica`

Cada fragmento secundario debe conservar en su texto el identificador, la categoría y el título del artículo. Por ejemplo: `SIN-002 · Fiebre · Signos de alarma`.

### C.3. Metadatos recomendados para cada fragmento

- `article_id`: por ejemplo, `SIN-002`.
- `category`: por ejemplo, `Síntomas frecuentes`.
- `title`: por ejemplo, `Fiebre`.
- `section`: por ejemplo, `Signos de alarma`.
- `validation_status`: `documentado`, `pendiente` o `bloqueado`.
- `audience`: `pacientes_adultos_y_cuidadores`.
- `language`: `es-AR`.
- `version`: `1.0.0`.
- `source_count`: cantidad de fuentes citadas.
- `has_emergency_content`: `true` para artículos de la categoría `ALA` y para cualquier artículo con signos de alarma.
- `last_reviewed`: fecha de revisión médica, cuando exista.
- `reviewed_by`: identificador del profesional revisor, cuando exista.

### C.4. Texto recomendado para embeddings

Para mejorar la recuperación, el texto que se envíe al modelo de embeddings puede comenzar con una línea de contexto:

```text
Categoría: Síntomas frecuentes. Artículo: SIN-002 · Fiebre. Sección: Signos de alarma. Público: pacientes y cuidadores. Estado: documentado, pendiente de revisión médica.
```

Luego se incluye el contenido de la sección. Esto reduce la pérdida de contexto cuando el fragmento es pequeño.

### C.5. Filtros de recuperación

- Filtrar por `language = es-AR`.
- Priorizar artículos con `has_emergency_content = true` cuando la consulta incluya términos de alarma.
- Excluir fragmentos con `validation_status = bloqueado` de las respuestas al paciente.
- Para consultas sobre medicamentos, recuperar solo las secciones de información general y nunca las secciones de dosis, que están bloqueadas.
- Para consultas sobre niños, embarazo o enfermedades crónicas, priorizar los artículos con advertencias para poblaciones especiales y derivar a evaluación profesional.

### C.6. Precauciones de implementación

- No usar el documento completo como un único chunk: se perdería precisión.
- No mezclar artículos de diferentes enfermedades en un mismo chunk.
- No eliminar los encabezados ni los metadatos: son parte del contexto.
- Mantener una versión del documento y registrar los cambios.
- Volver a generar los embeddings cuando cambie el contenido o la versión.
- Implementar un mecanismo de “respuesta segura” cuando la recuperación no alcance un umbral de confianza.

## Anexo D · Contenido pendiente y bloqueado

### Pendiente de revisión médica

- Todos los artículos, sin excepción, requieren revisión y aprobación por un profesional médico habilitado antes de su uso en producción.
- El artículo `ATE-002` requiere validación local porque las instrucciones varían según el estudio y el centro.
- Las recomendaciones sobre poblaciones especiales deben ser revisadas por pediatría, obstetricia y geriatría.
- Los criterios de derivación y los números de emergencia deben adaptarse a la jurisdicción local.

### Bloqueado

- Dosis, frecuencias, duraciones y formas de administración de cualquier medicamento.
- Indicaciones personalizadas de tratamiento.
- Interpretación de estudios o resultados.
- Confirmación de diagnósticos.
- Recomendaciones para suspender o modificar tratamientos indicados por un profesional.

## Anexo E · Registro de cambios

- **1.0.0 — 25/11/2026:** creación inicial de la base de conocimiento con 45 artículos en 8 categorías, fuentes oficiales citadas, metadatos para RAG y checklist de validación médica.

---

> **Cierre de seguridad:** esta base de conocimiento es un insumo educativo. Su uso en un chatbot de pacientes requiere revisión médica, validación local, control de versiones y mecanismos de derivación a la atención presencial. Ante cualquier signo de alarma, la respuesta debe ser siempre buscar atención de emergencia.
