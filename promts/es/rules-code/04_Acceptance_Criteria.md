### 4.6. Criterios de Aceptación (AC) 
**Plantilla de Criterios de Aceptación**

#### 4.6.1. Importante: Formato de Salida

Todos los resultados (plantillas, ejemplos, listas de verificación) deben salir en formato markdown. Utilice marcado para listas, tablas, código y encabezados.

#### 4.6.2. Contenidos
1. [Introducción](#introducción)
2. [Estructura AC](#estructura-ac)
3. [Plantilla AC Universal](#plantilla-ac-universal)
4. [Ejemplos de Formulaciones y Llenado](#ejemplos-de-formulaciones-y-llenado)
5. [Lista de Verificación de Calidad AC](#lista-de-verificación-de-calidad-ac)
6. [Recomendaciones y Errores Típicos](#recomendaciones-y-errores-típicos)
7. [Glosario y Enlaces Útiles](#glosario-y-enlaces-útiles)

---

#### 4.6.3. Introducción
Los Criterios de Aceptación (AC) son condiciones claras y medibles que deben cumplirse para que un requisito se considere implementado y aceptado. Los AC sirven como base para pruebas, aceptación y control de calidad.

##### Características Clave de AC de Calidad:
- **Medibilidad** — indicadores específicos para verificación
- **Comprobabilidad** — posibilidad de verificación objetiva
- **Especificidad** — formulaciones claras y no ambiguas
- **Integridad** — cobertura de todos los escenarios de uso
- **Orientación al Usuario** — descripción desde la perspectiva del usuario
- **Realismo** — viabilidad dentro del alcance del proyecto

---

#### 4.6.4. Estructura AC

##### 4.6.4.1. Importancia de Precondiciones y Postcondiciones

**Precondiciones** describen qué debe cumplirse o en qué estado debe estar el sistema antes de iniciar la verificación AC. **Postcondiciones** registran qué debe cambiar o en qué estado debe estar el sistema después de la ejecución AC. Estas secciones hacen que los criterios de aceptación sean completos, no ambiguos y adecuados para la automatización de pruebas.

##### 4.6.4.2. Encabezado e Identificación
- **ID Criterio**: AC-XXX
- **Nombre Criterio**: refleja brevemente la esencia de la verificación
- **Enlace Requisito**: ID User Story, Use Case, NFR
- **Versión y Fecha de Creación**
- **Autor y Personas Responsables**

##### 4.6.4.3. Elementos Principales
- **Descripción**: descripción clara y no ambigua del resultado esperado
- **Precondiciones**: qué debe cumplirse antes de iniciar la verificación
- **Condiciones de Verificación**: condiciones específicas y medibles que deben cumplirse
- **Postcondiciones**: estado del sistema después de completar la verificación
- **Prioridad**: Crítica/Alta/Media/Baja
- **Justificación**: por qué este criterio es importante para negocio/proyecto
- **Métodos y Herramientas de Verificación**: con qué y cómo se verifica
- **Criterios de Éxito**: qué se considera una finalización exitosa

---

#### 4.6.5. Plantilla AC Universal

AC-XXX: [Nombre del Criterio]
Enlace Requisito: [ID User Story / Use Case / NFR]
Versión: [número]  Fecha: [fecha]
Autor: [Nombre Completo]  Responsable: [Nombre Completo/Roles]

Descripción: [Descripción clara y no ambigua del resultado esperado]

Precondiciones:
- [Qué debe cumplirse antes de iniciar la verificación]

Condiciones de Verificación:
- [Condición 1: condición medible específica]
- [Condición 2: condición medible específica]
- [Condición 3: condición medible específica]

Postcondiciones:
- [Estado del sistema después de completar la verificación]

Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [Por qué este criterio es importante para negocio/proyecto]

Métodos y Herramientas de Verificación:
- [Herramienta/método 1]
- [Herramienta/método 2]

Criterios de Éxito:
- [Qué se considera una finalización exitosa]
- [Criterios de fallo, valores límite]

---

#### 4.6.6. Ejemplos de Formulaciones y Llenado

##### 4.6.6.1. Ejemplo 1: Criterio Funcional (Aplicación Web)

AC-001: Creación de Usuario
Enlace Requisito: US-001
Versión: 1.0  Fecha: 2024-06-01
Autor: Ivanov I.I.  Responsable: Equipo de Desarrollo

Descripción: El sistema debe permitir crear un nuevo usuario con campos obligatorios.

Precondiciones:
- El formulario de registro está disponible para usuarios no autorizados
- La base de datos está disponible para escritura

Condiciones de Verificación:
- El usuario completa el formulario de registro (email, contraseña, nombre)
- El sistema valida el email por formato correcto
- El sistema verifica la unicidad del email en la base de datos
- Al registro exitoso, se crea un registro en la BD
- El usuario recibe confirmación por email
- En caso de error, se muestra un mensaje claro

Postcondiciones:
- Nuevo usuario creado en el sistema
- Email de confirmación enviado
- El usuario puede iniciar sesión en el sistema

Prioridad: Crítica
Justificación: El registro de usuarios es la base para el funcionamiento del sistema

Métodos y Herramientas de Verificación:
- Pruebas manuales: completar formulario, verificar email
- Automatización: Selenium para pruebas UI, pruebas API para validación

Criterios de Éxito:
- Usuario creado, email enviado, sin errores
- Error de validación, duplicación de email, indisponibilidad BD — criterios de fallo

##### 4.6.6.2. Ejemplo 2: Criterio No Funcional (Rendimiento)

AC-002: Tiempo de Carga de Página
Enlace Requisito: NFR-001
Versión: 1.0  Fecha: 2024-06-01
Autor: Petrov P.P.  Responsable: QA

Descripción: La página principal debe cargarse en el tiempo especificado bajo varios niveles de carga.

Precondiciones:
- Servidor operando en modo normal
- Conexión de red estable

Condiciones de Verificación:
- Bajo carga normal (hasta 100 usuarios): no más de 2 segundos
- Bajo carga alta (hasta 1000 usuarios): no más de 5 segundos
- Bajo carga crítica (hasta 5000 usuarios): no más de 10 segundos
- Rendimiento medido con herramienta Apache JMeter
- Tiempo medido desde solicitud hasta carga completa DOM

Postcondiciones:
- Página completamente cargada y funcional
- Todos los recursos (CSS, JS, imágenes) cargados

Prioridad: Alta
Justificación: La velocidad de carga afecta directamente la conversión y retención de usuarios

Métodos y Herramientas de Verificación:
- Apache JMeter para pruebas de carga
- Lighthouse para análisis de rendimiento
- Monitoreo en entorno de producción

Criterios de Éxito:
- Tiempo de carga dentro de los límites para todos los niveles de carga
- Exceder límites de tiempo de carga — criterio de fallo

##### 4.6.6.3. Ejemplo 3: Criterio de Integración (API)

AC-003: Endpoint REST API
Enlace Requisito: NFR-API-001
Versión: 1.0  Fecha: 2024-06-01
Autor: Sidorov S.S.  Responsable: Backend

Descripción: API debe procesar correctamente las solicitudes HTTP.

Precondiciones:
- Servidor API disponible
- Datos de prueba preparados

Condiciones de Verificación:
- Solicitud GET devuelve datos en formato JSON
- Solicitud POST crea nuevo registro y devuelve estado 201
- Solicitud PUT actualiza registro existente
- Solicitud DELETE elimina registro y devuelve estado 204
- En error, se devuelve estado HTTP apropiado (400, 404, 500)
- Respuesta contiene cabecera Content-Type: application/json
- Se admite paginación mediante parámetros page y limit
- API devuelve errores en formato unificado con código y mensaje
- Tiempo de respuesta no excede 1 segundo para solicitudes simples

Postcondiciones:
- Datos procesados correctamente
- Errores devueltos correctamente

Prioridad: Alta
Justificación: API es la base para integración con sistemas externos

Métodos y Herramientas de Verificación:
- Postman, Insomnia para pruebas manuales
- Automatización: Pruebas API en pipeline CI/CD

Criterios de Éxito:
- Todas las solicitudes y respuestas cumplen con la especificación
- Errores manejados correctamente

---

#### 4.6.7. Lista de Verificación de Calidad AC
- [ ] Criterio es medible y comprobable
- [ ] Se especifican valores y condiciones concretos
- [ ] Prioridad definida
- [ ] Criterio no contradice a otros
- [ ] Criterio es realista y alcanzable
- [ ] Justificación proporcionada
- [ ] Precondiciones y postcondiciones descritas
- [ ] Métodos y herramientas de verificación especificados
- [ ] Criterio comprensible para todos los participantes del proyecto
- [ ] Criterio cubre todos los escenarios (positivos, negativos, límite)

---

#### 4.6.8. Recomendaciones y Errores Típicos

##### 4.6.8.1. Errores Comunes:
1. **Formulaciones Indefinidas**: "rápido" en lugar de "no más de 2 segundos"
2. **Ausencia de Unidades de Medida**: "1000 usuarios" en lugar de "1000 usuarios simultáneos"
3. **Requisitos Irrealistas**: "10 milisegundos" en lugar de "100 milisegundos"
4. **Ausencia de Justificación**: AC sin indicar importancia para el negocio
5. **Cobertura Incompleta de Escenarios**: solo escenarios positivos
6. **Orientación Técnica en Lugar de Orientación al Usuario**: "El sistema guarda datos en BD" en lugar de "El usuario recibe confirmación de guardado"

##### 4.6.8.2. Recomendaciones Prácticas:
- Utilice formulaciones concretas y medibles
- Incluya escenarios negativos y límite
- Especifique métodos y herramientas de verificación
- Vincule AC con requisitos (US, UC, NFR)
- Revise y actualice AC regularmente
- Asegure coherencia con otros artefactos

**Utilice esta plantilla como estándar para escribir criterios de aceptación — es adecuada para creación automática y manual de AC, asegura cumplimiento de estándares y resultados de alta calidad.**

