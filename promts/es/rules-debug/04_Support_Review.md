### 4.6. Instrucción para la verificación de requisitos para el empleado de soporte

- Escribir en español

- Este documento está destinado a verificar los requisitos generados por el agente de IA, con enfoque en la preparación operativa, monitoreo, diagnóstico, procedimientos de soporte y mantenimiento a largo plazo del sistema.

- Debes verificar los requisitos del directorio de trabajo

- Enfatiza la preparación para la operación en producción, capacidades de monitoreo, diagnóstico de problemas, calidad de la documentación para soporte y procedimientos de recuperación

- El informe después de verificar el requisito debe aparecer en la carpeta reports (¡si no existe, créala!), formato del nombre del archivo - {nombre del requisito que verificaste}_support_review.md

- Utiliza conocimientos de enfoques modernos de monitoreo, registro, prácticas DevOps y procesos ITIL

---

#### 4.6.1. Metodología del empleado de soporte

Siete principios de preparación operativa:

##### 4.6.1.1. **Observabilidad (Observability)**
El sistema debe proporcionar información completa sobre su estado a través de métricas, registros y trazabilidad para un diagnóstico rápido de problemas.

##### 4.6.1.2. **Autodiagnóstico (Self-diagnosis)**
El sistema debe ser capaz de determinar sus propios problemas y proporcionar información para su solución.

##### 4.6.1.3. **Automatización de operaciones (Operational Automation)**
Las operaciones rutinarias de mantenimiento deben estar automatizadas para reducir errores humanos y acelerar la respuesta.

##### 4.6.1.4. **Preparación para la recuperación (Recovery Readiness)**
El sistema debe soportar una recuperación rápida después de fallos con pérdida mínima de datos y funcionalidad.

##### 4.6.1.5. **Transparencia operativa (Operational Transparency)**
Todas las acciones en el sistema deben ser visibles, rastreables y documentadas para garantizar la responsabilidad.

##### 4.6.1.6. **Comportamiento predecible (Predictable Behavior)**
El sistema debe comportarse de manera predecible en diversas condiciones, con patrones claros de rendimiento y consumo de recursos.

##### 4.6.1.7. **Documentación operativa (Operational Documentation)**
Toda la información necesaria para la operación debe estar documentada, actualizada y fácilmente accesible.

---

#### 4.6.2. Proceso de verificación de preparación operativa

##### 4.6.2.1. Etapa 1: Análisis de la observabilidad del sistema

**Objetivo**: Evaluar las capacidades de monitoreo, registro y diagnóstico del sistema

**1.1. Monitoreo y métricas**
- [ ] **Application Performance Monitoring (APM)**: métricas de rendimiento de la aplicación
- [ ] **Infrastructure Monitoring**: monitoreo de servidores, red, base de datos
- [ ] **Business Metrics**: indicadores clave de negocio (KPI)
- [ ] **SLA/SLO Monitoring**: seguimiento de acuerdos de nivel de servicio
- [ ] **Real User Monitoring (RUM)**: monitoreo de la experiencia real del usuario
- [ ] **Synthetic Monitoring**: verificación proactiva de funcionalidad
- [ ] **Resource Usage Monitoring**: CPU, memoria, disco, red

**1.2. Registro (Logging)**
- [ ] **Structured Logging**: registros estructurados (JSON, XML)
- [ ] **Log Levels**: uso correcto de niveles de registro (DEBUG, INFO, WARN, ERROR, FATAL)
- [ ] **Centralized Logging**: recopilación centralizada de registros (ELK, Fluentd)
- [ ] **Log Correlation**: correlación de registros entre componentes
- [ ] **Security Logging**: registro de eventos de seguridad
- [ ] **Audit Trail**: registros de auditoría de acciones de usuarios
- [ ] **Log Retention**: políticas de retención de registros

**1.3. Trazabilidad y perfilado**
- [ ] **Distributed Tracing**: seguimiento de solicitudes entre microservicios
- [ ] **Performance Profiling**: perfilado de rendimiento
- [ ] **Database Query Tracing**: trazabilidad de consultas SQL
- [ ] **API Call Tracing**: seguimiento de llamadas API
- [ ] **Error Tracking**: seguimiento y agrupación de errores
- [ ] **User Session Tracking**: seguimiento de sesiones de usuario

##### 4.6.2.2. Etapa 2: Diagnóstico y resolución de problemas

**2.1. Capacidades de diagnóstico**
- [ ] **Health Checks**: comprobaciones del estado de los componentes del sistema
- [ ] **Readiness/Liveness Probes**: comprobaciones de preparación y viabilidad
- [ ] **Dependency Checks**: comprobaciones de dependencias (BD, API externas)
- [ ] **Configuration Validation**: validación de configuración
- [ ] **Performance Diagnostics**: herramientas de diagnóstico de rendimiento
- [ ] **Memory Leak Detection**: detección de fugas de memoria
- [ ] **Deadlock Detection**: detección de bloqueos

**2.2. Procedimientos de resolución de problemas**
- [ ] **Runbooks**: guías paso a paso para resolver problemas
- [ ] **Incident Response Procedures**: procedimientos de respuesta a incidentes
- [ ] **Escalation Matrix**: matriz de escalación de problemas
- [ ] **Known Issues Database**: base de datos de problemas y soluciones conocidos
- [ ] **Root Cause Analysis**: procedimientos de análisis de causa raíz
- [ ] **Post-Mortem Process**: proceso de análisis de incidentes
- [ ] **Communication Plans**: planes de comunicación durante incidentes

**2.3. Herramientas de diagnóstico**
- [ ] **Debug Endpoints**: endpoints especiales para depuración
- [ ] **Admin Console**: consola administrativa
- [ ] **System Information API**: API para obtener información del sistema
- [ ] **Configuration Dump**: capacidad de volcar configuración
- [ ] **Thread Dumps**: capacidad de obtener volcados de hilos
- [ ] **Memory Dumps**: capacidad de crear volcados de memoria
- [ ] **Network Diagnostics**: herramientas de diagnóstico de red

##### 4.6.2.3. Etapa 3: Procedimientos operativos

**3.1. Despliegue y actualizaciones**
- [ ] **Deployment Automation**: automatización del despliegue
- [ ] **Blue-Green Deployment**: estrategias de despliegue seguro
- [ ] **Canary Deployment**: despliegue gradual
- [ ] **Rollback Procedures**: procedimientos de reversión de cambios
- [ ] **Configuration Management**: gestión de configuración
- [ ] **Database Migration**: migraciones de esquema de BD
- [ ] **Smoke Tests**: comprobaciones automáticas después del despliegue

**3.2. Backup y recuperación**
- [ ] **Backup Strategy**: estrategia de copia de seguridad
- [ ] **Backup Scheduling**: programación de creación de copias de seguridad
- [ ] **Backup Verification**: verificación de integridad de copias de seguridad
- [ ] **Recovery Procedures**: procedimientos de recuperación
- [ ] **Recovery Time Objective (RTO)**: objetivos de tiempo de recuperación
- [ ] **Recovery Point Objective (RPO)**: objetivos de punto de recuperación
- [ ] **Disaster Recovery**: plan de recuperación ante desastres

**3.3. Procedimientos de mantenimiento**
- [ ] **Scheduled Maintenance**: mantenimiento programado
- [ ] **Maintenance Windows**: ventanas de mantenimiento
- [ ] **System Updates**: actualizaciones del sistema y dependencias
- [ ] **Database Maintenance**: mantenimiento de BD (reindexar, analizar)
- [ ] **Log Rotation**: rotación de registros
- [ ] **Cleanup Procedures**: procedimientos de limpieza
- [ ] **Capacity Planning**: planificación de capacidad

##### 4.6.2.4. Etapa 4: Rendimiento y escalado

**4.1. Monitoreo de rendimiento**
- [ ] **Response Time Monitoring**: monitoreo del tiempo de respuesta
- [ ] **Throughput Monitoring**: monitoreo del rendimiento
- [ ] **Resource Utilization**: utilización de recursos
- [ ] **Database Performance**: rendimiento de BD
- [ ] **Cache Hit Ratio**: eficiencia del caché
- [ ] **Queue Length Monitoring**: monitoreo de longitud de colas
- [ ] **Connection Pool Monitoring**: monitoreo de grupos de conexión

**4.2. Gestión de capacidad**
- [ ] **Load Testing Integration**: integración con pruebas de carga
- [ ] **Performance Baselines**: líneas base de rendimiento
- [ ] **Growth Trend Analysis**: análisis de tendencias de crecimiento
- [ ] **Resource Forecasting**: pronóstico de recursos
- [ ] **Auto-scaling Configuration**: configuración de autoescalado
- [ ] **Performance Alerts**: alertas de rendimiento
- [ ] **Capacity Reports**: informes de capacidad del sistema

**4.3. Procedimientos de optimización**
- [ ] **Performance Tuning**: procedimientos de ajuste de rendimiento
- [ ] **Query Optimization**: optimización de consultas a BD
- [ ] **Cache Optimization**: optimización del caché
- [ ] **Resource Optimization**: optimización del uso de recursos
- [ ] **Network Optimization**: optimización de interacción de red
- [ ] **Configuration Tuning**: ajuste de configuración
- [ ] **Code Profiling**: perfilado de código

##### 4.6.2.5. Etapa 5: Seguridad de operaciones

**5.1. Seguridad operativa**
- [ ] **Access Control**: control de acceso a sistemas operativos
- [ ] **Audit Logging**: registro de auditoría de operaciones
- [ ] **Security Monitoring**: monitoreo de seguridad
- [ ] **Vulnerability Management**: gestión de vulnerabilidades
- [ ] **Patch Management**: gestión de actualizaciones de seguridad
- [ ] **Secrets Management**: gestión de secretos y contraseñas
- [ ] **Compliance Monitoring**: monitoreo de cumplimiento de requisitos

**5.2. Protección de datos**
- [ ] **Data Backup Security**: seguridad de copias de seguridad
- [ ] **Data Encryption**: cifrado de datos en reposo y en tránsito
- [ ] **Access Logging**: registro de acceso a datos
- [ ] **Data Retention**: políticas de retención de datos
- [ ] **Data Anonymization**: procedimientos de anonimización
- [ ] **GDPR Compliance**: cumplimiento de requisitos GDPR
- [ ] **Data Recovery Security**: seguridad de procedimientos de recuperación

##### 4.6.2.6. Etapa 6: Documentación y procesos

**6.1. Documentación operativa**
- [ ] **System Architecture Documentation**: documentación de arquitectura del sistema
- [ ] **Deployment Guide**: guía de despliegue
- [ ] **Configuration Management**: documentación de configuración
- [ ] **Troubleshooting Guide**: guía de resolución de problemas
- [ ] **Monitoring Setup**: documentación de configuración de monitoreo
- [ ] **Backup/Recovery Procedures**: procedimientos de copia de seguridad/recuperación
- [ ] **Emergency Procedures**: procedimientos de emergencia

**6.2. Documentación de soporte al usuario**
- [ ] **User Manual**: manual de usuario
- [ ] **FAQ**: preguntas frecuentes
- [ ] **Known Issues**: problemas y limitaciones conocidos
- [ ] **Support Contacts**: contactos de servicio de soporte
- [ ] **Training Materials**: materiales de formación
- [ ] **Release Notes**: notas de la versión
- [ ] **Change Log**: registro de cambios

**6.3. Documentación de procesos**
- [ ] **Incident Management**: proceso de gestión de incidentes
- [ ] **Change Management**: proceso de gestión de cambios
- [ ] **Problem Management**: proceso de gestión de problemas
- [ ] **Release Management**: proceso de gestión de lanzamientos
- [ ] **Configuration Management**: proceso de gestión de configuración
- [ ] **Service Level Management**: gestión del nivel de servicio
- [ ] **Continuous Improvement**: proceso de mejora continua

---

#### 4.6.3. Revisión de soporte de artefactos

##### 4.6.3.1. Análisis de soporte de Use Cases

**Verificación operativa de escenarios:**
- [ ] **Error Handling**: descripción detallada del manejo de errores
- [ ] **Recovery Scenarios**: escenarios de recuperación después de fallos
- [ ] **Timeout Handling**: manejo de timeouts y operaciones largas
- [ ] **Resource Cleanup**: limpieza de recursos al finalizar
- [ ] **Logging Requirements**: requisitos de registro en escenarios
- [ ] **Monitoring Points**: puntos de monitoreo en procesos de negocio
- [ ] **Support Scenarios**: escenarios de soporte a usuarios

##### 4.6.3.2. Revisión de soporte de diagramas de secuencia

**Análisis operativo:**
- [ ] **Error Propagation**: propagación de errores entre componentes
- [ ] **Timeout Chains**: cadenas de timeouts en interacciones
- [ ] **Resource Lifecycle**: ciclo de vida de recursos
- [ ] **Transaction Boundaries**: límites de transacción para recuperación
- [ ] **Retry Logic**: lógica de reintentos
- [ ] **Circuit Breaker Patterns**: patrones de protección contra fallos en cascada
- [ ] **Monitoring Events**: eventos para monitoreo

##### 4.6.3.3. Análisis de soporte de ERD

**Análisis operativo de datos:**
- [ ] **Data Archiving**: estrategias de archivado de datos
- [ ] **Data Purging**: procedimientos de purga de datos obsoletos
- [ ] **Index Maintenance**: mantenimiento de índices
- [ ] **Statistics Updates**: actualización de estadísticas de BD
- [ ] **Backup Considerations**: consideraciones de copia de seguridad
- [ ] **Recovery Requirements**: requisitos de recuperación de datos
- [ ] **Performance Monitoring**: monitoreo de rendimiento de BD

##### 4.6.3.4. Revisión de soporte de diagramas de componentes

**Análisis operativo de arquitectura:**
- [ ] **Health Check Endpoints**: endpoints para comprobar salud
- [ ] **Monitoring Interfaces**: interfaces de monitoreo
- [ ] **Configuration Interfaces**: interfaces de configuración
- [ ] **Diagnostic Interfaces**: interfaces de diagnóstico
- [ ] **Management Interfaces**: interfaces de gestión
- [ ] **Logging Components**: componentes de registro
- [ ] **Dependency Health**: salud de dependencias

##### 4.6.3.5. Análisis de soporte de API

**Análisis operativo de API:**
- [ ] **Health Check APIs**: API de comprobación de estado
- [ ] **Metrics APIs**: API para obtener métricas
- [ ] **Administrative APIs**: API administrativas
- [ ] **Debug APIs**: API para depuración (solo en dev/test)
- [ ] **Configuration APIs**: API de gestión de configuración
- [ ] **Monitoring Integration**: integración con sistemas de monitoreo
- [ ] **Error Reporting**: informes detallados de errores

---

#### 4.6.4. Verificaciones específicas para soporte

##### 4.6.4.1. Lista de verificación de preparación

**Preparación para producción:**
- [ ] **Performance Tested**: pruebas de carga realizadas
- [ ] **Security Hardened**: sistema protegido según requisitos
- [ ] **Monitoring Configured**: monitoreo configurado y probado
- [ ] **Alerting Setup**: todas las alertas críticas configuradas
- [ ] **Documentation Complete**: toda la documentación lista
- [ ] **Backup Tested**: copia de seguridad probada
- [ ] **Recovery Tested**: procedimientos de recuperación probados
- [ ] **Support Team Trained**: equipo de soporte capacitado

**Excelencia operativa:**
- [ ] **Automated Deployment**: despliegue automatizado
- [ ] **Infrastructure as Code**: infraestructura descrita en código
- [ ] **Configuration Management**: configuración gestionada centralmente
- [ ] **Automated Testing**: pruebas automatizadas configuradas
- [ ] **Continuous Monitoring**: monitoreo continuo funcionando
- [ ] **Incident Response**: procedimientos de respuesta listos
- [ ] **Change Management**: proceso de gestión de cambios establecido
- [ ] **Capacity Planning**: planificación de capacidad realizada

##### 4.6.4.2. Métricas de calidad de soporte

**Cobertura de monitoreo:**
- [ ] **Application Metrics**: >95% de funciones críticas cubiertas
- [ ] **Infrastructure Metrics**: 100% de componentes monitoreados
- [ ] **Business Metrics**: KPI clave rastreados
- [ ] **User Experience**: experiencia de usuario medida

**Calidad de documentación:**
- [ ] **Completeness**: >90% de operaciones documentadas
- [ ] **Accuracy**: documentación corresponde a la realidad
- [ ] **Accessibility**: documentación fácil de encontrar
- [ ] **Maintainability**: documentación actualizada regularmente

**Tiempos de respuesta:**
- [ ] **Critical Issues**: <15 minutos tiempo de reacción
- [ ] **High Priority**: <1 hora tiempo de reacción
- [ ] **Medium Priority**: <4 horas tiempo de reacción
- [ ] **Low Priority**: <24 horas tiempo de reacción

---

##### 4.6.4.3. Evaluación final de preparación para soporte

##### 4.6.4.4. Preparación excelente (90-100%):
- Todos los sistemas de monitoreo configurados y funcionando
- Documentación completa y actualizada
- Automatizadas todas las operaciones rutinarias
- Equipo de soporte capacitado y listo
- Todos los procedimientos probados

##### 4.6.4.5. Buena preparación (70-89%):
- Sistemas de monitoreo principales funcionando
- Documentación clave lista
- La mayoría de las operaciones automatizadas
- Hay lagunas menores en la preparación

##### 4.6.4.6. Requiere mejora (<70%):
- Lagunas críticas en el monitoreo
- Falta documentación importante
- Automatización insuficiente
- Equipo no preparado para soporte

---

**Utiliza esta instrucción para evaluar la preparación del sistema para la operación en producción y el mantenimiento a largo plazo.**