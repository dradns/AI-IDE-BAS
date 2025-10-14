### 4.3. User Stories (US, Historias)
**Instrucciones para Escribir User Stories para un Agente de IA**

#### 4.3.1. Contenido
1. [Estructura de User Story](#estructura-de-user-story)
2. [Métricas de Calidad](#métricas-de-calidad)
3. [Reglas de Validación](#reglas-de-validación)
4. [Plantillas por Roles](#plantillas-por-roles)
5. [Ejemplos de User Stories](#ejemplos-de-user-stories)
6. [Lista de Verificación de Calidad](#lista-de-verificación-de-calidad)

---

#### 4.3.2. Estructura de User Story

##### 4.3.2.1. Formato Obligatorio:

US-XXX: [Nombre breve de la funcionalidad]
Como <rol de usuario>,
quiero <acción/funcionalidad deseada>,
para que <resultado/beneficio esperado>.



---

#### 4.3.3. Métricas de Calidad

##### 4.3.3.1. Indicadores Objetivo:
- **Cumplimiento del Formato**: 100% de estructura "Como-Quiero-Para que"
- **Cohesión**: 100% de las US deben estar vinculadas a un Use Case

##### 4.3.3.2. Sistema de Puntuación:
- **Calidad Excelente**: ≥90% de cumplimiento de las métricas
- **Buena Calidad**: 70-89% de cumplimiento de las métricas
- **Requiere Mejora**: <70% de cumplimiento de las métricas

---

#### 4.3.4. Reglas de Validación

##### 4.3.4.1. Comprobaciones Automáticas:

✓ Están presentes las 3 partes: rol + acción + resultado
✓ El rol corresponde al directorio de roles del sistema
✓ La acción está formulada como un verbo
✓ El resultado contiene un beneficio medible


---

#### 4.3.5. Plantillas por Roles

##### 4.3.5.1. Roles de Negocio:
- **Business Analyst**: análisis, documentación, planificación
- **Project Manager**: tareas de gestión
- **Product Owner**: decisiones de producto

##### 4.3.5.2. Roles Técnicos:
- **System Architect**: decisiones arquitectónicas
- **Database Designer**: modelado de datos
- **Developer**: implementación técnica

##### 4.3.5.3. Plantilla Universal:

US-XXX: [Funcionalidad]
Como [rol del directorio],
quiero [acción específica del sistema],
para que [beneficio empresarial o simplificación del proceso].



---

#### 4.3.6. Ejemplos de User Stories

##### 4.3.6.1. Tarea Analítica - Gestión de Stakeholders

US-001: Recopilación de Lista de Stakeholders del Proyecto
Como Business Analyst,
quiero tener una lista preparada de stakeholders del proyecto,
para que pueda entender rápidamente la estructura de participantes y no perder tiempo en la recopilación manual.



##### 4.3.6.2. Tarea Técnica - Generación de Diagramas

US-005: Generación de ERD desde Modelo de Datos
Como Database Designer,
quiero obtener automáticamente un diagrama ERD desde una descripción textual,
para que pueda visualizar la estructura sin dibujo manual.



##### 4.3.6.3. Tarea Arquitectónica

US-004: Creación de Use Case desde Plantilla
Como System Architect,
quiero formar un Use Case según una plantilla establecida,
para que pueda describir interacciones e integrarlas en la documentación.



---

#### 4.3.7. Lista de Verificación de Calidad

##### 4.3.7.1. Comprobación Estructural:
- [ ] ✅ El nombre refleja la esencia de la funcionalidad
- [ ] ✅ El rol de usuario es del directorio del sistema
- [ ] ✅ La acción está formulada como un verbo específico
- [ ] ✅ El resultado contiene un beneficio medible


##### 4.3.7.2. Comprobación Cualitativa:
- [ ] 🎯 La US está vinculada a componentes arquitectónicos
- [ ] 🎯 La viabilidad técnica está confirmada

##### 4.3.7.3. Comprobación de Integración:
- [ ] 🔗 El rol corresponde a los actores en el Use Case
- [ ] 🔗 La funcionalidad se refleja en la arquitectura
- [ ] 🔗 Los datos corresponden al modelo ERD
- [ ] 🔗 Los métodos API están descritos en la especificación técnica

**Objetivo**: Crear User Stories listas para estimación, planificación y desarrollo sin aclaraciones adicionales.

---

#### 4.3.8. Recomendaciones de Estilo

##### 4.3.8.1. Formulaciones:
- **Comenzar con una acción**: "El sistema proporciona...", "Capacidad para agregar..."
- **Especificidad**: indicar números, formatos, restricciones
- [ ] ✅ Consistencia: usar un estilo y terminología unificados

