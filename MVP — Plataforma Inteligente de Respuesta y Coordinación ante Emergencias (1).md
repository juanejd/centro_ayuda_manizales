# MVP — Plataforma Inteligente de Respuesta y Coordinación ante Emergencias

## 1. Objetivo del producto

Construir una plataforma web responsiva que centralice información, necesidades, recursos, voluntarios y capacidad institucional durante una emergencia.

El sistema debe permitir que:

1. Una persona que necesita ayuda sepa rápidamente qué hacer y pueda reportar su necesidad.
2. Una persona o empresa que quiere ayudar encuentre dónde su aporte genera mayor impacto.
3. Los voluntarios puedan registrarse en **Manos Amigas** y ser conectados con necesidades específicas.
4. Las entidades responsables puedan conocer qué zonas presentan mayores afectaciones, qué necesitan y qué casos siguen pendientes.
5. Una IA organice y facilite el acceso a toda la información disponible.

### Principio central

> Conectar la necesidad correcta con la ayuda correcta, en el lugar correcto y en el momento correcto.

---

# 2. Alcance del MVP

El MVP debe poder publicarse rápidamente.

No construir inicialmente una aplicación móvil nativa. Debe ser una **web responsive / PWA**, usable desde celular.

La primera versión tendrá seis componentes:

### A. Necesito ayuda

Registro de necesidades de ciudadanos.

### B. Quiero ayudar

Registro de personas, empresas, recursos, donaciones y capacidades disponibles.

### C. Manos Amigas

Módulo de voluntariado para conectar personas con actividades concretas.

### D. Centro de información

Directorio actualizado de albergues, hospitales, donación de sangre, mascotas, donaciones, atención institucional y demás recursos.

### E. Asistente IA

Interfaz conversacional para preguntar qué hacer o dónde encontrar ayuda.

### F. Centro de comando

Dashboard destinado a coordinadores, alcaldías, Gobernación y organizaciones de respuesta.

---

# 3. Pantalla principal

La página inicial debe evitar textos largos.

Mostrar cuatro acciones principales:

## NECESITO AYUDA

“Cuéntanos qué ocurrió y te orientamos.”

## QUIERO AYUDAR

“Dinos qué puedes aportar.”

## BUSCO INFORMACIÓN

“Pregunta por albergues, sangre, mascotas, donaciones, atención o cualquier necesidad.”

## CENTRO DE COMANDO

Acceso autenticado para responsables de coordinación.

Debajo puede existir un acceso destacado:

**Manos Amigas — Quiero ser voluntario**

---

# 4. Módulo: Necesito ayuda

## Objetivo

Permitir registrar rápidamente una necesidad.

## Campos

- Tipo de necesidad.
- Descripción libre.
- Municipio.
- Sector, barrio o vereda.
- Ubicación en mapa, cuando sea posible.
- Número aproximado de personas afectadas.
- Nombre de contacto.
- Teléfono.
- Foto opcional.
- Autorización para tratamiento de datos.

## Categorías iniciales

- Salud.
- Vivienda / daños estructurales.
- Albergue.
- Alimentos.
- Agua.
- Sangre.
- Mascotas.
- Movilidad / vías.
- Servicios públicos.
- Personas desaparecidas.
- Atención psicológica.
- Transporte.
- Remoción de elementos o escombros.
- Otros.



## Al guardar el reporte

La IA debe generar automáticamente:

- Categoría definitiva sugerida.
- Subcategoría.
- Resumen de máximo 2 líneas.
- Nivel de prioridad sugerido.
- Palabras clave.
- Tipo de recurso probablemente necesario.
- Indicador de posible duplicado.
- Indicador de revisión humana necesaria.

La IA **no debe diagnosticar daños estructurales, condiciones médicas ni declarar que un lugar es seguro**.

---

# 5. Prioridad de los reportes

Los estados iniciales serán:

- Crítico.
- Alto.
- Medio.
- Bajo.

La prioridad puede utilizar variables como:

- Riesgo para personas.
- Número de afectados.
- Existencia de población vulnerable.
- Tiempo sin atención.
- Número de reportes similares en la misma zona.
- Disponibilidad de recursos.
- Afectación de servicios esenciales.

La IA propone la prioridad.

Un administrador o autoridad puede modificarla.

Para decisiones críticas, la clasificación de IA nunca debe considerarse validación oficial.

---

# 6. Módulo: Quiero ayudar

Debe permitir registrar tanto ciudadanos como organizaciones.

Primera pregunta:

**¿Cómo puedes ayudar?**

Opciones iniciales:

- Dinero.
- Alimentos.
- Agua.
- Ropa / cobijas.
- Medicamentos o insumos permitidos.
- Transporte.
- Vehículos.
- Maquinaria.
- Herramientas.
- Alojamiento.
- Alimento para mascotas.
- Servicios profesionales.
- Tiempo como voluntario.
- Otro recurso.

## Campos

- Persona / empresa / organización.
- Tipo de aporte.
- Descripción.
- Cantidad o capacidad disponible.
- Ubicación.
- Disponibilidad.
- Datos de contacto.

Inicialmente la plataforma **no debe recibir ni custodiar dinero**.

Debe dirigir las donaciones económicas hacia entidades previamente verificadas.

Para bienes físicos puede indicar puntos de recepción verificados o conectarlos con una necesidad.

---

# 7. Manos Amigas

## Objetivo

Convertir el voluntariado desorganizado en capacidad útil.

Una persona podrá indicar:

- Nombre.
- Teléfono.
- Municipio.
- Disponibilidad.
- Medio de transporte.
- Habilidades.
- Herramientas disponibles.

Ejemplos de habilidades:

- Fuerza física.
- Transporte.
- Primeros auxilios.
- Medicina.
- Enfermería.
- Ingeniería.
- Construcción.
- Veterinaria.
- Psicología.
- Logística.
- Cocina.
- Comunicaciones.
- Cuidado de niños.
- Cuidado de adultos mayores.

## Actividades

Los administradores pueden publicar necesidades como:

**“Se necesitan 15 voluntarios mañana en el punto X para organizar mercados.”**

Debe mostrar:

- Actividad.
- Ubicación.
- Horario.
- Cupos.
- Organización responsable.
- Requisitos.
- Responsable del punto.

El ciudadano selecciona:

**QUIERO PARTICIPAR**

y queda registrado.

No se deben promover actividades peligrosas para voluntarios no capacitados, como ingreso a estructuras inestables o rescates especializados.

---

# 8. Centro de información

Debe funcionar como una única fuente organizada de información.

Tipos de recurso:

- Albergues.
- Hospitales.
- Centros médicos.
- Donación de sangre.
- Puntos de donación.
- Centros de acopio.
- Atención de mascotas.
- Personas desaparecidas.
- Evaluación de viviendas.
- Servicios públicos.
- Bomberos.
- Defensa Civil.
- Cruz Roja.
- Alcaldías.
- Gobernación.
- Líneas de atención.
- Cierres viales.
- Otros.

## Cada recurso necesita

- Nombre.
- Categoría.
- Dirección.
- Municipio.
- Ubicación.
- Horario.
- Contacto.
- Descripción.
- Fuente.
- Fecha/hora de última verificación.
- Estado.

Estados:

**Verificado · Pendiente de validar · Desactualizado · Cerrado**

La fecha de actualización debe ser muy visible.

---



#
