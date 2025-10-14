### 4.4. Use Cases (UC, Casos de Uso, CU, use cases)
**Instrucciones para Escribir Use Cases para un Agente de IA**

#### 4.4.1. Contenido
1. [Plantilla de Use Case](#plantilla-de-use-case)
2. [Métricas de Calidad](#métricas-de-calidad)
3. [Reglas de Validación](#reglas-de-validación)
4. [Ejemplos de Use Case](#ejemplos-de-use-case)
5. [Criterios de Calidad](#criterios-de-calidad)

---

#### 4.4.2. Plantilla de Use Case

##### 4.4.2.1. Estructura Obligatoria (9 elementos):

| № | Elemento | Descripción | Ejemplo |
|---|---------|----------|---------|
| 1 | **Nombre** | Verbo + Sustantivo + Contexto | "Creación de Pedido por Cliente" |
| 2 | **User Story (US)** | "Como [rol], quiero [funcionalidad], para que [valor]" | US-1: Como cliente, quiero crear un pedido... |
| 3 | **Participantes** | Actor principal + actores secundarios | Cliente, Sistema, CRM, Servicio de Email |
| 4 | **Precondiciones** | Qué debe completarse antes de iniciar | Usuario está autorizado |
| 5 | **Restricciones** | Restricciones de sistema/negocio | Máximo 10 artículos por pedido |
| 6 | **Disparador** | Evento que inicia el escenario | Clic en botón "Realizar Pedido" |
| 7 | **Escenario Principal** | Happy path - secuencia de pasos | 1. Usuario selecciona artículos... |
| 8 | **Escenarios Alternativos** | Ramificaciones del flujo principal | Paso 3: Si artículo sin stock... |
| 9 | **Postcondiciones** | Resultado de ejecución del escenario | Pedido creado y guardado en BD |

---

#### 4.4.3. Métricas de Calidad

##### 4.4.3.1. Indicadores Objetivo:
- **Completitud Estructural**: 9/9 elementos obligatorios = 100%
- **Cobertura de Escenarios**: Principal + mínimo 2 alternativos = calidad excelente
- **Detalle de Pasos**: 5-15 pasos en escenario principal = óptimo
- **Cohesión Arquitectónica**: 100% de actores deben estar en arquitectura del sistema

##### 4.4.3.2. Sistema de Puntuación:
- **Calidad Excelente**: 90-100% cumplimiento de métricas
- **Buena Calidad**: 70-89% cumplimiento de métricas
- **Requiere Mejora**: <70% cumplimiento de métricas

---

#### 4.4.4. Reglas de Validación

##### 4.4.4.1. Comprobaciones Automáticas:

###### 4.4.4.1.1. Validación Estructural

✓ Todos los 9 elementos obligatorios presentes
✓ Nombre contiene verbo de acción
✓ User Story cumple formato "Como-Quiero-Para que"
✓ Mínimo 1 actor principal especificado


###### 4.4.4.1.2. Validación Lógica

✓ Disparador conectado lógicamente al escenario principal
✓ Escenarios alternativos referencian pasos del principal
✓ Postcondiciones alcanzables mediante escenario principal
✓ Precondiciones no contradicen lógica de negocio


###### 4.4.4.1.3. Validación de Integración

✓ Actores corresponden a roles de User Stories
✓ Componentes del sistema están en diagrama de arquitectura
✓ Métodos API especificados en especificación técnica


---

#### 4.4.5. Ejemplos de Use Case

##### 4.4.5.1. Ejemplo 1: Solicitud Rápida de Comentarios

| **Elemento** | **Descripción** |
|-------------|--------------|
| **Nombre** | UC-1. Envío de Solicitud Rápida mediante Formulario de Comentarios |
| **User Story** | US-1: Como usuario del sistema, quiero enviar una solicitud rápidamente para ahorrar tiempo completando el formulario |
| **Participantes** | • Principal: Usuario del Sistema<br>• Secundarios: Interfaz Web, Backend API, Sistema CRM |
| **Precondiciones** | • Usuario autorizado<br>• Formulario de envío abierto<br>• Feature toggle de acceso rápido activado |
| **Restricciones** | • Drawer disponible solo al crear solicitud<br>• Máximo 5 plantillas para elegir |
| **Disparador** | Usuario hace clic en elemento de acceso rápido en formulario |
| **Escenario Principal** | 1. Usuario abre formulario de envío de solicitud<br>2. Sistema muestra formulario con elemento de acceso rápido<br>3. Usuario hace clic en elemento de acceso rápido<br>4. Sistema abre drawer con botones-enlace a plantillas<br>5. Usuario selecciona plantilla adecuada<br>6. Sistema redirige a formulario prellenado<br>7. Usuario complementa datos faltantes<br>8. Sistema guarda solicitud |
| **Escenarios Alternativos** | **Paso 3**: Si usuario nuevo → mostrar notificación "Soporte"<br>**Paso 4**: Al cargar plantillas → mostrar loader<br>**Paso 5**: Error 4XX/5XX → mensaje "Error de carga, intente más tarde"<br>**Paso 6**: Cerrar drawer mediante "X" o clic externo → volver a formulario principal |
| **Postcondiciones** | • Solicitud creada y guardada en CRM<br>• Usuario recibió confirmación<br>• Métricas de uso de función enviadas |

##### 4.4.5.2. Ejemplo 2: Registro de Usuario

| **Elemento** | **Descripción** |
|-------------|--------------|
| **Nombre** | UC-2. Registro de Nuevo Usuario en Sistema |
| **User Story** | US-2: Como nuevo usuario, quiero registrarme en el sistema para acceder a funciones personales |
| **Participantes** | • Principal: Usuario No Registrado<br>• Secundarios: Formulario Web, API de Registro, Servicio de Email, Base de Datos |
| **Precondiciones** | • Usuario en página de registro<br>• Servicio de email disponible<br>• Base de datos disponible |
| **Restricciones** | • Email debe ser único<br>• Contraseña mínimo 8 caracteres<br>• Registro solo con email confirmado |
| **Disparador** | Usuario hace clic en botón "Registrarse" |
| **Escenario Principal** | 1. Usuario completa formulario (nombre, email, contraseña)<br>2. Sistema valida datos ingresados<br>3. Sistema verifica unicidad de email<br>4. Sistema crea cuenta con estado "no confirmado"<br>5. Sistema envía email de confirmación<br>6. Usuario hace clic en enlace del email<br>7. Sistema activa cuenta<br>8. Sistema muestra mensaje de registro exitoso |
| **Escenarios Alternativos** | **Paso 2**: Datos inválidos → mostrar errores de validación<br>**Paso 3**: Email ya existe → ofrecer recuperación de contraseña<br>**Paso 5**: Error envío email → guardar cuenta, mostrar instrucciones<br>**Paso 6**: Enlace expirado → ofrecer reenvío |
| **Postcondiciones** | • Cuenta creada y activada<br>• Usuario puede iniciar sesión<br>• Email de bienvenida enviado |

---

#### 4.4.6. Criterios de Calidad para IA

##### 4.4.6.1. Requisitos Estructurales
- **Completitud**: Todos los 9 elementos deben estar completos
- **Detalle**: Escenario principal 5-15 pasos
- **Cobertura**: Mínimo 2-3 escenarios alternativos

##### 4.4.6.2. Requisitos Lógicos
- **Secuencia**: Pasos lógicamente conectados
- **Realismo**: Escenarios factibles dentro del sistema
- **Completitud de Ramas**: Casos principales de error cubiertos

##### 4.4.6.3. Requisitos de Integración
- **Cohesión**: Actores corresponden a arquitectura
- **Trazabilidad**: Use Case vinculado a User Story
- **Factibilidad Técnica**: Restricciones del sistema consideradas

##### 4.4.6.4. Requisitos Especiales
- **Feature Toggles**: Considerar funciones condicionales (test:true)
- **Plataforma**: Diferencias web/mobile indicadas explícitamente
- **Manejo de Errores**: Comportamiento para 4XX/5XX descrito
- **UX**: Loaders, notificaciones, cierre de formularios considerados

---

#### 4.4.7. Lista de Validación de Use Case

##### 4.4.7.1. Verificación Obligatoria:
- [ ] ✅ Nombre contiene acción y contexto
- [ ] ✅ User Story en formato "Como-Quiero-Para que"
- [ ] ✅ Todos los participantes especificados (principal + secundarios)
- [ ] ✅ Precondiciones alcanzables
- [ ] ✅ Restricciones realistas
- [ ] ✅ Disparador claramente definido
- [ ] ✅ Escenario principal 5-15 pasos
- [ ] ✅ Escenarios alternativos referencian al principal
- [ ] ✅ Postcondiciones alcanzables

##### 4.4.7.2. Verificación Cualitativa:
- [ ] 🎯 Escenarios cubren 80%+ de casos reales
- [ ] 🎯 Actores están en arquitectura del sistema
- [ ] 🎯 Factibilidad técnica confirmada
- [ ] 🎯 Manejo de errores detallado

**Objetivo**: Crear Use Cases listos para pasar a desarrollo sin aclaraciones adicionales.

