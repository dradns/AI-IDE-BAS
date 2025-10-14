### 4.7. Glosario del Proyecto
**Instrucciones de Gestión del Glosario de Términos del Proyecto**

Este documento está destinado al agente de IA responsable de recopilar, estructurar y actualizar el glosario de terminología del proyecto. El objetivo es garantizar la consistencia terminológica en todos los artefactos del proyecto.

**Fuentes de Términos:** artefactos en el directorio de trabajo
**Ubicación de Guardado del Glosario:** `*_glossary.md` en la raíz del proyecto
**Formato de Actualización:** adición de nuevos términos y actualización de los existentes

---

#### 4.7.1. Tabla de Contenidos
1. [Principios de Gestión del Glosario](#principios-de-gestión-del-glosario)
2. [Fuentes de Términos](#fuentes-de-términos)
3. [Estructura del Glosario](#estructura-del-glosario)
4. [Procedimientos de Recopilación de Términos](#procedimientos-de-recopilación-de-términos)
5. [Categorización de Términos](#categorización-de-términos)
6. [Verificación de Consistencia](#verificación-de-consistencia)
7. [Procedimientos de Actualización](#procedimientos-de-actualización)

---

#### 4.7.2. Principios de Gestión del Glosario

##### 4.7.2.1. Principios Clave:
- **Consistencia**: un término - una definición en todo el proyecto
- **Integridad**: cobertura de todos los conceptos clave del dominio
- **Actualidad**: actualización regular de definiciones
- **Jerarquía**: relaciones entre términos y su agrupación
- **Contextualidad**: consideración de los aspectos específicos del dominio

##### 4.7.2.2. Criterios de Inclusión de Términos:
- **Términos de Negocio**: conceptos del dominio
- **Términos Técnicos**: conceptos arquitectónicos y tecnológicos
- **Acrónimos y Abreviaturas**: todas las abreviaturas del proyecto
- **Roles y Actores**: participantes del sistema
- **Procesos y Estados**: procesos de negocio clave
- **Entidades de Datos**: objetos principales del sistema

---

#### 4.7.3. Fuentes de Términos

##### 4.7.3.1. Requisitos de Negocio
**Archivos para Análisis:**
- `*_us.md` (Historias de Usuario)
- `*_uc.md` (Casos de Uso)
- `README.md` en carpetas de proyectos

**Tipos de Términos:**
- [ ] Roles de Usuario
- [ ] Procesos de Negocio
- [ ] Reglas de Negocio
- [ ] Criterios de Aceptación
- [ ] Áreas Funcionales

##### 4.7.3.2. Arquitectura del Sistema
**Archivos para Análisis:**
- `*.puml` (diagramas PlantUML)

**Tipos de Términos:**
- [ ] Componentes del Sistema
- [ ] Capas de Arquitectura
- [ ] Interfaces
- [ ] Protocolos
- [ ] Tecnologías

##### 4.7.3.3. Modelo de Datos
**Archivos para Análisis:**
- Diagramas ER
- Archivos SQL
- Especificaciones API

**Tipos de Términos:**
- [ ] Entidades
- [ ] Atributos
- [ ] Relaciones
- [ ] Restricciones
- [ ] Índices

##### 4.7.3.4. APIs e Interfaces
**Archivos para Análisis:**
- `*.yaml` (especificaciones OpenAPI)
- Diagramas de Secuencia

**Tipos de Términos:**
- [ ] Endpoints
- [ ] Métodos HTTP
- [ ] Parámetros de Solicitud
- [ ] Códigos de Respuesta
- [ ] Esquemas de Datos

---

#### 4.7.4. Estructura del Glosario
##### 4.7.4.1. Formato de Entrada de Términos:
### [Término]
**Categoría:** [Negocio/Técnica/Datos/API/Rol]  
**Sinónimos:** [nombres alternativos]  
**Abreviaturas:** [abreviaturas]  
**Definición:** [definición clara del término]  
**Contexto:** [donde se usa en el proyecto]  
**Términos Relacionados:** [enlaces a otros términos]  
**Fuente:** [archivo donde aparece por primera vez]  
**Última Actualización:** [fecha]
**Ejemplos de Uso:**- [ejemplo 1] - [ejemplo 2]

##### 4.7.4.2. Agrupación de Términos:
###### 4.7.4.2.1. Términos de Negocio
- Dominio
- Procesos de Negocio
- Roles y Participantes
- Productos y Servicios

###### 4.7.4.2.2. Términos Técnicos
- Componentes Arquitectónicos
- Tecnologías y Herramientas
- Protocolos y Estándares
- Infraestructura

###### 4.7.4.2.3. Términos de Datos
- Entidades
- Atributos
- Relaciones
- Restricciones

###### 4.7.4.2.4. Términos de API
- Endpoints
- Methods
- Parameters
- Schemas

###### 4.7.4.2.5. Acrónimos y Abreviaturas
- Abreviaturas Técnicas
- Abreviaturas de Negocio
- Abreviaturas Organizacionales

#### 4.7.5. Procedimientos de Recolección de Términos

##### 4.7.5.1. Etapa 1: Recolección Automática

**1.1. Escaneo de Archivos**
- [ ] Búsqueda de términos en User Stories (roles después de "Como")
- [ ] Extracción de actores de Use Cases
- [ ] Recolección de nombres de componentes de diagramas
- [ ] Búsqueda de entidades en ERD
- [ ] Extracción de endpoints de OpenAPI

**1.2. Patrones de Búsqueda**
- Roles: `Como [rol]`, `Actor: [rol]`
- Componentes: `component`, `interface`, `service`
- Entidades: `entity`, `table`, nombres en ERD
- API: `paths:`, `endpoints`, métodos HTTP
- Acrónimos: palabras en mayúsculas

##### 4.7.5.2. Etapa 2: Análisis de Contexto

**2.1. Determinación de Significado**
- [ ] Análisis de contexto de uso
- [ ] Búsqueda de definiciones en texto
- [ ] Identificación de sinónimos
- [ ] Determinación de alcance

**2.2. Agrupación**
- [ ] Categorización por tipos
- [ ] Identificación de jerarquía
- [ ] Vinculación de términos relacionados
- [ ] Determinación de dependencias

##### 4.7.5.3. Etapa 3: Validación y Limpieza

**3.1. Verificación de Duplicados**
- [ ] Búsqueda de términos idénticos
- [ ] Identificación de sinónimos
- [ ] Verificación de abreviaturas
- [ ] Fusión de duplicados

**3.2. Verificación de Calidad**
- [ ] Completitud de definiciones
- [ ] Corrección de categorización
- [ ] Disponibilidad de ejemplos
- [ ] Relevancia de fuentes

#### 4.7.6. Categorización de Términos

##### 4.7.6.1. Términos de Negocio
**Criterios:**
- Relacionados con el dominio
- Usados en User Stories y Use Cases
- Comprensibles para usuarios de negocio
- No requieren conocimiento técnico

**Ejemplos:**
- Cliente, Usuario, Administrador
- Pedido, Pago, Factura
- Registro, Autorización
- Producto, Servicio, Tarifa

##### 4.7.6.2. Términos Técnicos
**Criterios:**
- Relacionados con arquitectura IT
- Usados en diagramas técnicos
- Requieren conocimiento técnico
- Relacionados con implementación

**Ejemplos:**
- API Gateway, Microservice
- Base de Datos, Caché
- Load Balancer, Firewall
- REST, HTTP, JSON

##### 4.7.6.3. Términos de Datos
**Criterios:**
- Relacionados con modelo de datos
- Usados en ERD
- Describen estructura de datos
- Relacionados con almacenamiento de información

**Ejemplos:**
- Usuario, Pedido, Pago (entidades)
- user_id, email, created_at (atributos)
- uno-a-muchos, clave foránea (relaciones)

##### 4.7.6.4. Términos de API
**Criterios:**
- Relacionados con interfaces
- Usados en OpenAPI
- Describen interacción
- Relacionados con protocolos

**Ejemplos:**
- /api/users, /login, /orders
- GET, POST, PUT, DELETE
- Cabecera Authorization, Token Bearer
- 200 OK, 404 Not Found

---

#### 4.7.7. Verificación de Consistencia

##### 4.7.7.1. Análisis de Uso de Términos

**1. Verificación de Uniformidad**
- [ ] Un término = un significado
- [ ] Sin contradicciones en definiciones
- [ ] Escritura uniforme (mayúsculas, guiones)
- [ ] Consistencia en traducciones

**2. Cobertura de Términos**
- [ ] Todos los conceptos clave definidos
- [ ] Sin términos indefinidos en documentos
- [ ] Todos los dominios cubiertos
- [ ] Todos los acrónimos definidos

**3. Calidad de Definiciones**
- [ ] Definiciones claras y no ambiguas
- [ ] Sin definiciones circulares
- [ ] Definiciones sin jerga
- [ ] Ejemplos de uso disponibles

##### 4.7.7.2. Identificación de Problemas

**Tipos de Problemas:**
- **Duplicados:** términos idénticos con definiciones diferentes
- **Sinónimos:** términos diferentes con mismo significado
- **Términos indefinidos:** términos sin definiciones
- **Términos obsoletos:** términos no usados en proyecto
- **Contradicciones:** definiciones conflictivas

**Procedimiento de Resolución:**
1. Identificar todas las ocurrencias del término problemático
2. Analizar contexto de uso
3. Seleccionar definición principal
4. Actualizar todos los documentos
5. Agregar sinónimos al glosario
---

#### 4.7.8. Procedimientos de Actualización

##### 4.7.8.1. Actualizaciones Regulares

**Disparadores de Actualización:**
- [ ] Creación de nuevos artefactos de requisitos
- [ ] Cambios en documentos existentes
- [ ] Adición de nuevos diagramas
- [ ] Actualizaciones de especificaciones API
- [ ] Aparición de nuevos informes

**Frecuencia de Verificación:**
- **Después de cada cambio:** términos críticos
- **Semanalmente:** análisis completo de consistencia
- **Durante lanzamientos:** verificación integral del glosario

##### 4.7.8.2. Proceso de Actualización

**1. Recolección de Cambios**
- [ ] Escaneo de archivos modificados
- [ ] Identificación de nuevos términos
- [ ] Análisis de términos eliminados
- [ ] Verificación de definiciones actualizadas

**2. Análisis de Impacto**
- [ ] Determinación de documentos afectados
- [ ] Verificación de términos relacionados
- [ ] Evaluación de necesidad de actualización
- [ ] Planificación de cambios

**3. Actualización del Glosario**
- [ ] Adición de nuevos términos
- [ ] Actualización de definiciones existentes
- [ ] Eliminación de términos obsoletos
- [ ] Actualización de relaciones entre términos

**4. Validación de Cambios**
- [ ] Verificación de corrección de definiciones
- [ ] Prueba de enlaces
- [ ] Verificación de formato
- [ ] Validación de estructura

##### 4.7.8.3. Notificaciones de Cambios

**Registro de Cambios:**
markdown
## Historial de Cambios del Glosario

### [Fecha] - Versión X.Y
**Términos Agregados:**
- [Término 1]: [descripción breve]
- [Término 2]: [descripción breve]

**Términos Actualizados:**
- [Término 3]: [qué cambió]

**Términos Eliminados:**
- [Término 4]: [razón de eliminación]

**Documentos Afectados:**
- [lista de archivos]

---

#### 4.7.9. Integración con Procesos del Proyecto

##### 4.7.9.1. Integración con Revisión de Requisitos

**Durante revisión de requisitos:**
- [ ] Verificar uso de términos del glosario
- [ ] Identificar nuevos términos indefinidos
- [ ] Sugerir estandarización de terminología
- [ ] Actualizar glosario si es necesario

##### 4.7.9.2. Integración con Desarrollo

**Al crear nuevos artefactos:**
- [ ] Usar términos del glosario
- [ ] Agregar nuevos términos al glosario
- [ ] Mantener consistencia de nombres
- [ ] Documentar desviaciones de estándares

##### 4.7.9.3. Métricas de Calidad del Glosario

**Indicadores de Cobertura:**
- [ ] % de términos definidos del total
- [ ] Número de términos por categorías
- [ ] Frecuencia de uso de términos
- [ ] Número de sinónimos y duplicados

**Indicadores de Calidad:**
- [ ] Longitud promedio de definiciones
- [ ] % de términos con ejemplos
- [ ] % de términos con relaciones
- [ ] Número de actualizaciones por período

---

#### 4.7.10. Plantilla de Informe de Estado del Glosario

```markdown
# Informe de estado del glosario

**Fecha:** [fecha]  
**Versión del glosario:** [versión]

## Estadísticas
- **Número total de términos:** [número]
- **Términos de negocio:** [número]
- **Términos técnicos:** [número]
- **Términos de datos:** [número]
- **Términos de API:** [número]
- **Acrónimos:** [número]

## Calidad
- **Términos con definiciones completas:** [%]
- **Términos con ejemplos:** [%]
- **Términos con relaciones:** [%]
- **Términos problemáticos:** [número]

## Problemas identificados
- [descripción de problemas]

## Recomendaciones
- [recomendaciones de mejora]

## Cambios desde el último informe
- [lista de cambios]

---

**Utilice esta instrucción para mantener un glosario de terminología del proyecto actualizado y de alta calidad que garantice la coherencia terminológica en todos los artefactos.** 

