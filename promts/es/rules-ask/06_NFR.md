### 4.8. Requisitos No Funcionales

**Plantilla de Requisitos No Funcionales (NFR)**

#### 4.8.1. Contenido
1. [Introducción](#introducción)
2. [Estructura NFR](#estructura-nfr)
3. [Categorías Principales NFR](#categorías-principales-nfr)
4. [Plantillas por Categorías](#plantillas-por-categorías)
5. [Métricas y Mediciones](#métricas-y-mediciones)
6. [Herramientas y Métodos](#herramientas-y-métodos)
7. [Listas de Verificación](#listas-de-verificación)
8. [Ejemplos de Cumplimentación](#ejemplos-de-cumplimentación)

#### 4.8.2. Introducción

Los Requisitos No Funcionales (NFR) definen las características cualitativas del sistema que afectan al rendimiento, seguridad, fiabilidad y usabilidad. A diferencia de los requisitos funcionales, los NFR describen no *qué* hace el sistema, sino *cómo* lo hace.

##### Características clave de NFR cualitativos:
1.  **Medibilidad** - indicadores numéricos específicos
2.  **Testabilidad** - verificación objetiva
3.  **Realismo** - alcanzabilidad dentro del proyecto
4.  **Priorización** - prioridad definida
5.  **Justificación** - importancia para el negocio

#### 4.8.3. Estructura NFR

##### 4.8.3.1. Elementos Obligatorios:
1.  **Identificador Único** - formato: NFR-XXX
2.  **Nombre de Categoría** - tipo de requisito (Rendimiento, Seguridad, etc.)
3.  **Descripción** - descripción clara de lo que el sistema debe proporcionar
4.  **Criterios de Medición** - indicadores medibles específicos con unidades de medida
5.  **Prioridad** - Crítica/Alta/Media/Baja
6.  **Justificación** - importancia para el negocio

##### 4.8.3.2. Plantilla NFR Universal:

NFR-XXX: [Nombre del Requisito]
Descripción: [Descripción clara de lo que el sistema debe proporcionar]
Criterios de Medición:
- [Criterio 1 con valores específicos y unidades de medida]
- [Criterio 2 con valores específicos y unidades de medida]
- [Condiciones de medición y prueba]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [Por qué este requisito es importante para el negocio]


#### 4.8.4. Categorías Principales NFR

##### 4.8.4.1. Rendimiento (Performance)
- **Tiempo de Respuesta**: no más de 2 segundos bajo carga hasta 1000 usuarios
- **Rendimiento**: al menos 500 transacciones por segundo
- **Uso de Recursos**: CPU no más del 70%, memoria no más de 2 GB

##### 4.8.4.2. Seguridad (Security)
- **Autenticación**: multifactor, bloqueo después de 5 intentos fallidos
- **Protección de Datos**: cifrado AES-256, TLS 1.3
- **Autorización**: verificación de roles para cada solicitud

##### 4.8.4.3. Fiabilidad (Reliability)
- **Disponibilidad**: al menos 99.9% por mes
- **Tiempo de Recuperación**: no más de 15 minutos después de fallo
- **Tolerancia a Fallos**: redundancia de componentes críticos

##### 4.8.4.4. Escalabilidad (Scalability)
- **Horizontal**: aumento lineal al añadir servidores
- **Vertical**: aumento de recursos da ganancia de rendimiento proporcional
- **Escalado Automático**: dependiendo de la carga

##### 4.8.4.5. Usabilidad (Usability)
- **Tiempo de Aprendizaje**: no más de 2 horas para un usuario nuevo
- **Número de Clics**: no más de 3 para operaciones principales
- **Accesibilidad**: cumplimiento de WCAG 2.1 AA

##### 4.8.4.6. Compatibilidad (Compatibility)
- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Integración**: REST API, JSON/XML, SSO
- **Plataformas**: Windows Server 2019+, Linux Ubuntu 20.04+

##### 4.8.4.7. Portabilidad (Portability)
- **Multiplataforma**: Windows, Linux, Docker, Kubernetes
- **Despliegue en Nube**: AWS, Azure, GCP

##### 4.8.4.8. Mantenibilidad (Maintainability)
- **Modularidad**: límites claros de componentes
- **Documentación**: API, cobertura de pruebas al menos 80%
- **Despliegue**: no más de 30 minutos para nueva versión

#### 4.8.5. Plantillas por Categorías

##### 4.8.5.1. Rendimiento (Performance)

###### 4.8.5.1.1. Plantilla NFR para Rendimiento:

NFR-PERF-XXX: [Nombre del Requisito de Rendimiento]
Descripción: [Descripción del rendimiento requerido del sistema]
Criterios de Medición:
- Tiempo de Respuesta: [valor] [unidad] bajo [condiciones de carga]
- Rendimiento: [valor] [unidad]
- Uso de Recursos: CPU no más de [%], memoria no más de [GB]
- Tiempo de Carga de Página: no más de [segundos]
Condiciones de Medición:
- Entorno: [características del entorno de prueba]
- Carga: [número de usuarios/solicitudes]
- Duración: [tiempo de prueba]
Herramientas: [lista de herramientas de medición]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.1.2. Ejemplo NFR de Rendimiento:

NFR-PERF-001: Rendimiento de Búsqueda de Productos
Descripción: El sistema de búsqueda de productos debe proporcionar respuesta rápida bajo carga alta
Criterios de Medición:
- Tiempo de Búsqueda: no más de 1 segundo bajo 1000 solicitudes simultáneas
- Rendimiento: 2000 consultas de búsqueda por segundo
- Tiempo de Carga de Resultados: no más de 500 ms (percentil 95)
- Uso de CPU: no más del 60% bajo carga máxima
Condiciones de Medición:
- Entorno: 8 CPU, 16 GB RAM, SSD, red 100 Mbps
- Carga: 1000 usuarios simultáneos
- Datos: 1,000,000 productos, 10,000 categorías
Herramientas: Apache JMeter, Gatling, Prometheus
Prioridad: Crítica
Justificación: La velocidad de búsqueda es crítica para la conversión de ventas


##### 4.8.5.2. Seguridad (Security)

###### 4.8.5.2.1. Plantilla NFR para Seguridad:

NFR-SEC-XXX: [Nombre del Requisito de Seguridad]
Descripción: [Descripción de las medidas de seguridad requeridas]
Criterios de Medición:
- Autenticación: [métodos y parámetros]
- Autorización: [mecanismos de control de acceso]
- Protección de Datos: [métodos de cifrado y protección]
- Auditoría: [registro y monitorización]
Condiciones de Prueba:
- Escenarios: [lista de escenarios de prueba]
- Herramientas: [herramientas de prueba de seguridad]
- Estándares: [cumplimiento de estándares]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.2.2. Ejemplo NFR de Seguridad:

NFR-SEC-001: Autenticación de Usuarios
Descripción: El sistema debe proporcionar autenticación segura de usuarios
Criterios de Medición:
- Autenticación Multifactor: obligatoria para administradores
- Bloqueo de Cuenta: después de 5 intentos fallidos durante 30 minutos
- Complejidad de Contraseña: mínimo 8 caracteres, letras+números+caracteres especiales
- Tiempo de Sesión: no más de 8 horas de inactividad
- Cifrado de Contraseñas: bcrypt con salt, mínimo 12 rondas
Condiciones de Prueba:
- Escenarios: ataques de fuerza bruta, descifrado de contraseñas, inyecciones SQL
- Herramientas: OWASP ZAP, Burp Suite, Metasploit
- Estándares: OWASP Top 10, NIST Cybersecurity Framework
Prioridad: Crítica
Justificación: Protección de datos personales de usuarios


##### 4.8.5.3. Fiabilidad (Reliability)

###### 4.8.5.3.1. Plantilla NFR para Fiabilidad:

NFR-REL-XXX: [Nombre del Requisito de Fiabilidad]
Descripción: [Descripción de la fiabilidad requerida del sistema]
Criterios de Medición:
- Disponibilidad: [porcentaje de tiempo activo] en [periodo]
- Tiempo de Recuperación (MTTR): no más de [tiempo]
- Tiempo Medio Entre Fallos (MTBF): al menos [tiempo]
- Tolerancia a Fallos: [descripción de mecanismos]
Condiciones de Prueba:
- Escenarios de Fallo: [lista de escenarios de prueba]
- Planes de Recuperación: [procedimientos de recuperación]
- Monitorización: [métricas y alertas]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.3.2. Ejemplo NFR de Fiabilidad:

NFR-REL-001: Disponibilidad del Sistema
Descripción: El sistema debe proporcionar alta disponibilidad para los usuarios
Criterios de Medición:
- Disponibilidad: al menos 99.9% por mes (máximo 43 minutos de inactividad)
- Tiempo de Recuperación (MTTR): no más de 15 minutos después del fallo
- Tiempo Medio Entre Fallos (MTBF): al menos 720 horas (30 días)
- Mantenimiento Programado: no más de 4 horas por mes en horario no laboral
- Monitorización: 24/7 con alertas si no disponible por más de 1 minuto
Condiciones de Prueba:
- Escenarios: fallo de servidor, fallo de base de datos, fallo de red
- Planes de Recuperación: failover automático, copias de seguridad
- Monitorización: Pingdom, New Relic, comprobaciones de salud personalizadas
Prioridad: Crítica
Justificación: La indisponibilidad del sistema conduce a pérdida de ventas


##### 4.8.5.4. Escalabilidad (Scalability)

###### 4.8.5.4.1. Plantilla NFR para Escalabilidad:

NFR-SCAL-XXX: [Nombre del Requisito de Escalabilidad]
Descripción: [Descripción de la escalabilidad requerida del sistema]
Criterios de Medición:
- Escalabilidad Horizontal: [número de nodos] con [eficiencia]
- Escalabilidad Vertical: [aumento de recursos] da [ganancia de rendimiento]
- Escalado Automático: [condiciones y límites]
- Rendimiento bajo Escalado: [métricas]
Condiciones de Prueba:
- Escenarios de Carga: [escenarios de prueba de escalado]
- Decisiones Arquitectónicas: [descripción de arquitectura]
- Monitorización: [métricas de escalado]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.4.2. Ejemplo NFR de Escalabilidad:

NFR-SCAL-001: Escalabilidad Horizontal de Servidores Web
Descripción: El sistema debe escalar linealmente al añadir servidores
Criterios de Medición:
- Escalado Lineal: duplicar servidores da ganancia de rendimiento de 1.8-2.0 veces
- Número Máximo de Servidores: hasta 20 servidores en clúster
- Escalado Automático: añadir servidores cuando CPU > 70% por más de 5 minutos
- Eliminación de Servidores: cuando CPU < 30% por más de 10 minutos
- Balanceo de Carga: distribución uniforme con desviación no mayor al 10%
Condiciones de Prueba:
- Escenarios: aumento gradual de carga, cargas máximas
- Arquitectura: aplicación sin estado (stateless), base de datos compartida, balanceador de carga
- Monitorización: CPU, memoria, número de servidores, tiempo de respuesta
Prioridad: Alta
Justificación: Soporte al crecimiento de usuarios sin degradación


##### 4.8.5.5. Usabilidad (Usability)

###### 4.8.5.5.1. Plantilla NFR para Usabilidad:

NFR-USAB-XXX: [Nombre del Requisito de Usabilidad]
Descripción: [Descripción de la usabilidad requerida]
Criterios de Medición:
- Tiempo de Aprendizaje: no más de [tiempo] para [tipo de usuario]
- Número de Clics: no más de [número] para [operación]
- Accesibilidad: cumplimiento de [estándar] nivel [nivel]
- Facilidad de Navegación: [métricas de navegación]
Condiciones de Prueba:
- Usuarios: [tipos de usuarios de prueba]
- Escenarios: [escenarios de prueba de uso]
- Herramientas: [herramientas de prueba UX]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.5.2. Ejemplo NFR de Usabilidad:

NFR-USAB-001: Usabilidad de Búsqueda de Productos
Descripción: La búsqueda de productos debe ser intuitiva y rápida
Criterios de Medición:
- Tiempo de Búsqueda: no más de 3 clics desde página principal hasta resultado
- Autocompletado: sugerencias aparecen después de ingresar 2 caracteres
- Filtros: no más de 5 filtros principales en la página
- Ordenación: mínimo 3 opciones de ordenación (precio, popularidad, novedad)
- Versión Móvil: diseño responsive para pantallas desde 320px
- Accesibilidad: cumplimiento de WCAG 2.1 AA
Condiciones de Prueba:
- Usuarios: 20 usuarios de diferentes edades y experiencia
- Escenarios: búsqueda por nombre, categoría, filtros
- Herramientas: UserTesting, Hotjar, Google Analytics
Prioridad: Alta
Justificación: La facilidad de búsqueda afecta a la conversión


##### 4.8.5.6. Compatibilidad (Compatibility)

###### 4.8.5.6.1. Plantilla NFR para Compatibilidad:

NFR-COMP-XXX: [Nombre del Requisito de Compatibilidad]
Descripción: [Descripción de la compatibilidad requerida]
Criterios de Medición:
- Compatibilidad de Navegadores: [lista de navegadores y versiones]
- Compatibilidad de Plataformas: [sistemas operativos]
- Compatibilidad de Integración: [APIs y protocolos]
- Compatibilidad con Versiones Anteriores: [versiones y migraciones]
Condiciones de Prueba:
- Entorno de Prueba: [lista de entornos de prueba]
- Herramientas: [herramientas de prueba de compatibilidad]
- Automatización: [pruebas de compatibilidad automatizadas]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.6.2. Ejemplo NFR de Compatibilidad:

NFR-COMP-001: Compatibilidad de Navegadores
Descripción: La interfaz web debe funcionar en todos los navegadores modernos
Criterios de Medición:
- Chrome: versiones 90+ (soporte 95% de usuarios)
- Firefox: versiones 88+ (soporte 90% de usuarios)
- Safari: versiones 14+ en macOS e iOS (soporte 85% de usuarios)
- Edge: versiones 90+ (soporte 80% de usuarios)
- Funcionalidad: 100% de funciones funcionan en todos los navegadores soportados
- Rendimiento: desviación del tiempo de carga no mayor al 20% entre navegadores
- Diseño Responsive: visualización correcta en pantallas de 320px-1920px
Condiciones de Prueba:
- Entorno: BrowserStack, Sauce Labs, dispositivos reales
- Herramientas: Selenium, Playwright, Herramientas de Desarrollo del Navegador
- Automatización: pruebas cross-browser en CI/CD
Prioridad: Alta
Justificación: Alcance de la máxima audiencia de usuarios


##### 4.8.5.7. Portabilidad (Portability)

###### 4.8.5.7.1. Plantilla NFR para Portabilidad:

NFR-PORT-XXX: [Nombre del Requisito de Portabilidad]
Descripción: [Descripción de la portabilidad requerida del sistema]
Criterios de Medición:
- Multiplataforma: [lista de plataformas soportadas]
- Portabilidad en la Nube: [proveedores de nube soportados]
- Contenerización: [requisitos de contenerización]
- Despliegue: [tiempo y procedimientos de despliegue]
Condiciones de Prueba:
- Entorno de Despliegue: [lista de entornos de prueba]
- Herramientas: [herramientas de prueba de portabilidad]
- Automatización: [procedimientos de despliegue automatizados]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.7.2. Ejemplo NFR de Portabilidad:

NFR-PORT-001: Portabilidad en la Nube
Descripción: El sistema debe ser portable entre proveedores de nube
Criterios de Medición:
- Proveedores Soportados: AWS, Azure, GCP, DigitalOcean
- Contenerización: contenedores Docker para todos los componentes
- Orquestación: Kubernetes para gestión de contenedores
- Infraestructura como Código: Terraform para todos los recursos en la nube
- Tiempo de Despliegue: no más de 30 minutos a un nuevo entorno
- Configuración: variables de entorno para todas las configuraciones
- Base de Datos: soporte para PostgreSQL, MySQL, MongoDB
Condiciones de Prueba:
- Entorno: prueba en todos los proveedores soportados
- Herramientas: Terraform, Docker, Kubernetes, Helm
- Automatización: pipeline CI/CD para todos los proveedores
Prioridad: Media
Justificación: Flexibilidad en la elección del proveedor de nube


##### 4.8.5.8. Mantenibilidad (Maintainability)

###### 4.8.5.8.1. Plantilla NFR para Mantenibilidad:

NFR-MAINT-XXX: [Nombre del Requisito de Mantenibilidad]
Descripción: [Descripción de la mantenibilidad requerida del sistema]
Criterios de Medición:
- Modularidad: [estructura y límites de módulos]
- Documentación: [requisitos de documentación]
- Pruebas: [cobertura de pruebas y sus tipos]
- Despliegue: [tiempo y procedimientos de actualizaciones]
Condiciones de Prueba:
- Métricas de Calidad de Código: [herramientas y valores umbral]
- Procedimientos: [procedimientos de soporte y actualización]
- Monitorización: [métricas de mantenibilidad]
Prioridad: [Crítica/Alta/Media/Baja]
Justificación: [importancia para el negocio]


###### 4.8.5.8.2. Ejemplo NFR de Mantenibilidad:

NFR-MAINT-001: Calidad de Código y Pruebas
Descripción: El código debe ser de alta calidad y bien probado
Criterios de Medición:
- Cobertura de Pruebas: al menos 80% para pruebas unitarias, 60% para pruebas de integración
- Calidad de Código: puntuación SonarQube al menos A (0 deuda técnica)
- Documentación: README para cada módulo, documentación API
- Modularidad: límites claros entre componentes, bajo acoplamiento
- Estándares de Codificación: ESLint/Prettier para JavaScript, Pylint para Python
- Tiempo de Compilación: no más de 10 minutos para compilación completa
- Tiempo de Pruebas: no más de 15 minutos para todas las pruebas
Condiciones de Prueba:
- Métricas: SonarQube, cobertura Jest, ESLint
- Procedimientos: revisión de código, programación en pareja, pruebas automatizadas
- Monitorización: informes regulares de calidad de código
Prioridad: Alta
Justificación: La calidad del código afecta a la velocidad de desarrollo


#### 4.8.6. Métricas y Mediciones

##### 4.8.6.1. Reglas para Describir Métricas

###### 4.8.6.1.1  ✅ Correcto:

- Tiempo de Carga: no más de 2 segundos bajo carga hasta 1000 usuarios
- Disponibilidad: al menos 99.9% por mes
- Rendimiento: 1000 solicitudes por segundo
- Seguridad: bloqueo después de 5 intentos fallidos durante 30 minutos


###### 4.8.6.1.2 ❌ Incorrecto:

- Tiempo de Carga: rápido
- Disponibilidad: alta
- Rendimiento: muchas solicitudes
- Seguridad: sistema seguro


##### 4.8.6.2. Condiciones de Prueba

Condiciones de Medición:
- Entorno: Similar a Producción (8 CPU, 16 GB RAM, SSD)
- Carga: 1000 usuarios simultáneos
- Duración: 1 hora
- Datos: 100,000 registros
- Red: 100 Mbps, latencia 50 ms


#### 4.8.7. Herramientas y Métodos

##### 4.8.7.1. Herramientas Clave por Categorías:
- **Rendimiento**: Apache JMeter, Lighthouse, New Relic
- **Seguridad**: OWASP ZAP, SonarQube, Burp Suite
- **Fiabilidad**: Nagios, Zabbix, Prometheus
- **Usabilidad**: Google Analytics, Hotjar, UserTesting

##### 4.8.7.2. Métodos de Medición:
- **Pruebas de Carga**: Apache JMeter, Gatling
- **Monitorización**: Prometheus + Grafana, New Relic
- **Análisis de Seguridad**: OWASP ZAP, Nessus
- **Pruebas de Usabilidad**: pruebas A/B, grabaciones de sesiones

#### 4.8.8. Listas de Verificación

##### 4.8.8.1. Lista de Verificación General NFR:
- [ ] El requisito es medible y comprobable
- [ ] Se especifican valores numéricos específicos con unidades de medida
- [ ] Se define la prioridad del requisito
- [ ] El requisito no contradice otros NFR
- [ ] El requisito es realista para el proyecto
- [ ] Se proporciona justificación de importancia para el negocio
- [ ] Se definen condiciones de medición y prueba
- [ ] Se especifican herramientas de medición

##### 4.8.8.2. Listas de Verificación por Categorías:

###### 4.8.8.2.1. Rendimiento
- [ ] Se especifican valores objetivo y umbral de tiempo de respuesta
- [ ] Se describen condiciones de carga y prueba
- [ ] Se proporcionan herramientas de medición

###### 4.8.8.2.2. Seguridad
- [ ] Se describen métodos de protección y herramientas
- [ ] Se especifican estándares y cumplimiento
- [ ] Se proporcionan escenarios de prueba

###### 4.8.8.2.3. Fiabilidad
- [ ] Se especifican métricas de disponibilidad y recuperación
- [ ] Se describen planes de redundancia
- [ ] Se proporcionan escenarios de fallo

###### 4.8.8.2.4. Escalabilidad
- [ ] Se describen estrategias de escalado
- [ ] Se especifican valores umbral
- [ ] Se proporcionan decisiones arquitectónicas

##### 4.8.8.3. Errores Comunes:
1.  **Formulaciones Indefinidas**: "rápido" en lugar de "no más de 2 segundos"
2.  **Falta de Unidades de Medida**: "1000 usuarios" en lugar de "1000 usuarios simultáneos"
3.  **Requisitos Irrealistas**: "10 milisegundos" en lugar de "100 milisegundos"
4.  **Falta de Justificación**: NFR sin especificar importancia para el negocio
5.  **Requisitos Contradictorios**: NFR que se contradicen entre sí

##### 4.8.8.4. Recomendaciones Prácticas:
- Incluir métodos y herramientas de medición para cada NFR
- Especificar condiciones de prueba y entorno
- Definir valores umbral y escenarios de degradación
- Documentar conflictos y compromisos
- Usar control de versiones y cambios
- Vincular NFR con decisiones arquitectónicas
- Actualizar documentación regularmente

#### 4.8.9. Ejemplos de Cumplimentación

##### 4.8.9.1. Ejemplo 1: Aplicación Web de Comercio Electrónico


NFR-PERF-001: Rendimiento de Página Principal
Descripción: La página principal debe cargarse rápidamente para todos los usuarios
Criterios de Medición:
- Tiempo de Carga: no más de 2 segundos bajo carga hasta 1000 usuarios
- Tamaño de Página: no más de 2 MB
- Número de Solicitudes HTTP: no más de 50
- Tiempo de Respuesta a Acciones: no más de 1 segundo (percentil 95)
Condiciones de Medición:
- Entorno: 4 CPU, 8 GB RAM, red 100 Mbps
- Navegador: Chrome 90+
- Caché: desactivado
Herramientas: Lighthouse, WebPageTest, Apache JMeter
Prioridad: Alta
Justificación: La velocidad de carga afecta a la tasa de rebote y conversión



NFR-SEC-001: Protección de Datos Personales
Descripción: El sistema debe garantizar la seguridad de los datos personales de los usuarios
Criterios de Medición:
- Cifrado de Datos: AES-256 para datos en reposo, TLS 1.3 para datos en tránsito
- Autenticación: multifactor para administradores, 2FA para usuarios
- Bloqueo de Cuenta: después de 5 intentos fallidos durante 30 minutos
- Auditoría: registro de todas las operaciones con datos personales
- Cumplimiento: GDPR, PCI DSS para datos de pago
Condiciones de Prueba:
- Escenarios: pruebas de penetración, evaluación de vulnerabilidades
- Herramientas: OWASP ZAP, Burp Suite, Nessus
- Estándares: OWASP Top 10, NIST Cybersecurity Framework
Prioridad: Crítica
Justificación: Cumplimiento de requisitos regulatorios y protección de reputación


##### 4.8.9.2. Ejemplo 2: Aplicación Móvil


NFR-USAB-001: Usabilidad de Aplicación Móvil
Descripción: La aplicación móvil debe ser intuitiva para los usuarios
Criterios de Medición:
- Tiempo de Aprendizaje: no más de 30 minutos para un usuario nuevo
- Número de Pasos: no más de 3 para operaciones principales
- Tamaño de Botones: mínimo 44x44 píxeles para pulsación fácil
- Soporte de Gestos: deslizar, pellizcar-zoom, pulsación larga
- Modo Sin Conexión: funcionamiento sin internet para funciones principales
- Accesibilidad: cumplimiento de WCAG 2.1 AA
Condiciones de Prueba:
- Dispositivos: iOS 14+, Android 10+, varios tamaños de pantalla
- Usuarios: prueba con usuarios reales
- Herramientas: Firebase Analytics, Crashlytics, UserTesting
Prioridad: Alta
Justificación: La usabilidad es crítica para la retención de usuarios



NFR-COMP-001: Compatibilidad de Plataformas Móviles
Descripción: La aplicación debe funcionar en todas las plataformas móviles soportadas
Criterios de Medición:
- iOS: versiones 14+ (soporte 95% de usuarios iOS)
- Android: versiones 10+ (soporte 90% de usuarios Android)
- Tamaños de Pantalla: desde 320px hasta 428px de ancho
- Densidad de Píxeles: desde 1x hasta 3x
- Orientación: vertical y horizontal
- Rendimiento: desviación del tiempo de respuesta no mayor al 15% entre plataformas
Condiciones de Prueba:
- Dispositivos: dispositivos reales y emuladores
- Herramientas: Firebase Test Lab, Appium, XCTest
- Automatización: pruebas cross-platform en CI/CD
Prioridad: Alta
Justificación: Alcance de la máxima audiencia de usuarios móviles


##### 4.8.9.3. Ejemplo 3: Servicio API


NFR-PERF-002: Rendimiento de REST API
Descripción: REST API debe proporcionar alto rendimiento
Criterios de Medición:
- Tiempo de Respuesta: no más de 200 ms (percentil 99)
- Rendimiento: 5000 solicitudes por segundo
- Latencia: no más de 50 ms bajo carga normal
- Límite de Tasa (Rate Limiting): 1000 solicitudes por minuto por API Key
- Caché: TTL 5 minutos para datos solicitados frecuentemente
Condiciones de Medición:
- Entorno: 4 CPU, 8 GB RAM, red 1 Gbps
- Carga: 1000 RPS durante 1 hora
- Datos: 1,000,000 registros en base de datos
Herramientas: Artillery, k6, New Relic, Prometheus
Prioridad: Alta
Justificación: API es utilizado por aplicaciones móviles y socios



NFR-SCAL-002: Escalabilidad de API
Descripción: API debe escalar para soportar crecimiento de carga
Criterios de Medición:
- Escalado Horizontal: aumento lineal hasta 20 servidores
- Escalado Automático: añadir servidores cuando CPU > 70%
- Balanceo de Carga: distribución uniforme con desviación no mayor al 5%
- Base de Datos: réplicas de lectura (read replicas) para lectura, agrupación de conexiones (connection pooling)
- Caché: clúster Redis para caché distribuido
Condiciones de Prueba:
- Escenarios: aumento gradual de carga, pruebas de estrés
- Arquitectura: microservicios, API Gateway, malla de servicios (service mesh)
- Monitorización: métricas de rendimiento y escalado
Prioridad: Alta
Justificación: Soporte al crecimiento de usuarios e integraciones de socios


Utiliza estos ejemplos como referencia para crear requisitos no funcionales de alta calidad.