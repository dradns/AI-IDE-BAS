### 4.3. Instrucciones y Guías Detalladas para AI IDE BAS mode-designer sobre la Creación de Diversos Artefactos de Arquitectura y Diseño de Aplicaciones Bancarias

Estas instrucciones garantizan la creación de wireframes de alta calidad y consistentes basados en los requisitos de User Story y Use Case.

Propósito del cumplimiento:
- Estandarización de los enfoques para la creación de wireframes
- Garantizar la calidad e integridad de los diseños
- Acelerar el proceso de desarrollo

#### 4.3.1. 🔧 Proceso de Creación de Wireframes

##### 4.3.1.1. Paso 1: Estudiar los Requisitos
- User Story
- Use Case

##### 4.3.1.2. Paso 2: Planificación de Pantallas
- Identificar las pantallas principales
- Planificar la navegación
- Selección de componentes

##### 4.3.1.3. Paso 3: Implementación
- Usar la plantilla HTML base
- Aplicar componentes CSS listos para usar
- Añadir lógica JavaScript
- Probar escenarios

##### 4.3.1.4. Paso 4: Validación
- Revisión de la lista de verificación de calidad
- Pruebas en diferentes dispositivos
- Validación de la lógica de negocio

#### 4.3.2. ⚙️ Requisitos Técnicos

Características obligatorias:
- ✅ Diseño móvil (ancho máximo: 414px)
- ✅ Responsivo para tabletas y escritorio
- ✅ Navegación interactiva
- ✅ Validación de formularios
- ✅ Simulación de API
- ✅ Manejo de errores
- ✅ Accesibilidad
- ✅ Animaciones suaves

#### 4.3.3. 🎨 Sistema de Diseño

##### 4.3.3.1. Paleta de Colores:
- **Gradiente Principal**: `#667eea → #764ba2`
- **Gradiente de Saldo**: `#ff6b6b → #ffa726`
- **Éxito**: `#28a745`
- **Error**: `#dc3545`
- **Advertencia**: `#ffc107`
- **Fondo**: `#f5f7fa`

##### 4.3.3.2. Tipografía:
- **Fuentes del Sistema**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'`
- **Tamaños**: 12px-32px
- **Pesos**: 400, 500, 600, 700

##### 4.3.3.3. Componentes:
- Radio del borde: 8px-16px
- Relleno: 8px, 12px, 16px, 20px, 24px
- Sombras: `0 4px 12px rgba(102, 126, 234, 0.15)`

#### 4.3.4. 🧪 Datos de Prueba

##### 4.3.4.1. Destinatarios Estándar:
- **Iván Ivánov** - `79123456789` (MARRIED)
- **María Petrovna** - `79111234567` (SINGLE)
- **Anna Sidorova** - `79998887766` (DIVORCED)

##### 4.3.4.2. Escenarios de Error:
- Destinatario no encontrado: `79999999999`
- Fondos insuficientes: monto > 125450
- Límite excedido: monto > 50000 para MARRIED

#### 4.3.5. ✅ Lista de Verificación de Calidad

##### 4.3.5.1. HTML:
- [ ] Marcado HTML5 válido
- [ ] Etiquetas semánticas
- [ ] Atributos de accesibilidad
- [ ] IDs únicos

##### 4.3.5.2. CSS:
- [ ] Enfoque Mobile-first
- [ ] Variables CSS
- [ ] Animaciones suaves
- [ ] Estados Hover
- [ ] Estilos Focus

##### 4.3.5.3. JavaScript:
- [ ] Manejo de todos los escenarios
- [ ] Validación de formularios
- [ ] Simulación de API
- [ ] Manejo de errores
- [ ] Historial de navegación

##### 4.3.5.4. UX/UI:
- [ ] Navegación intuitiva
- [ ] Errores informativos
- [ ] Confirmaciones de acción
- [ ] Acciones rápidas
- [ ] Autoformateo

#### 4.3.6. 🚀 Ejemplos de Uso

##### 4.3.6.1. Crear un wireframe para "Transferencia con Comentario":
1. Copiar la estructura base de la Guía Básica de Wireframes HTML
2. Agregar un componente textarea de Componentes de Wireframe
3. Modificar la pantalla de confirmación
4. Agregar validación de comentarios
5. Actualizar datos de prueba

##### 4.3.6.2. Crear un wireframe para "Plantillas de Transferencia":
1. Usar el componente de lista de transacciones
2. Agregar botones "Guardar como plantilla"
3. Crear una pantalla de selección de plantillas
4. Implementar pre-llenado de datos

#### 4.3.7. 📖 Cómo Usar

##### 4.3.7.1. Guía de Wireframes HTML
Uso: Instrucción básica para crear wireframes móviles
Incluye:
- Estructuras HTML
- Estilos CSS
- Lógica JavaScript
- Diseño responsivo
- Datos de prueba

###### 4.3.7.1.1. 🏗️ Estructura HTML

**Contenedor Principal**
html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplicación Bancaria - [Nombre de la Función]</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="app-container">
        <header class="header">
            <!-- Encabezado con navegación -->
        </header>
        <main class="main-content">
            <!-- Pantallas de la aplicación -->
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>


**Encabezado de la Aplicación**
html
<header class="header">
    <div class="header-content">
        <button class="back-btn" onclick="goBack()">←</button>
        <h1 class="header-title">Principal</h1>
        <button class="profile-btn">👤</button>
    </div>
</header>

**Estructura de Pantallas**
html
<!-- Cada pantalla en un div separado -->
<div class="screen active" id="screen-name">
    <div class="form-container">
        <h2>Título de la Pantalla</h2>
        <p class="subtitle">Subtítulo o descripción</p>
        
        <!-- Contenido de la pantalla -->
        
        <button class="btn-primary" onclick="nextAction()">
            Continuar
        </button>
    </div>
</div>


**Elementos Obligatorios por Tipo de Pantalla:**

**Pantalla Principal**
html
<div class="balance-card">
    <h2>Saldo de la Cuenta</h2>
    <div class="balance-amount">[MONTO] ₽</div>
    <p class="account-number">**** [NÚMERO]</p>
</div>

<div class="actions-grid">
    <button class="action-btn primary" onclick="showScreen('target-screen')">
        <div class="action-icon">[EMOJI]</div>
        <span>[NOMBRE]</span>
    </button>
    <!-- Otros botones de acción -->
</div>

**Pantalla de Entrada de Datos**
html
<div class="input-group">
    <label for="input-id">[NOMBRE DEL CAMPO]</label>
    <input 
        type="[TIPO]" 
        id="input-id" 
        placeholder="[SUGERENCIA]"
        class="[CLASE]-input"
        oninput="validate[Función](this)"
    >
    <div class="input-error" id="input-error"></div>
</div>

**Pantalla de Confirmación**
html
<div class="confirmation-details">
    <div class="detail-row">
        <span>[NOMBRE]:</span>
        <strong id="confirm-value">[VALOR]</strong>
    </div>
    <!-- Otros detalles -->
    <hr>
    <div class="detail-row total">
        <span>A debitar:</span>
        <strong id="total-amount">[MONTO]</strong>
    </div>
</div>

<div class="warning-message" id="warning" style="display: none;">
    ⚠️ [TEXTO DE ADVERTENCIA]
</div>


**Pantalla de Resultado**
html
<div class="result-container">
    <div class="result-icon success" id="result-icon">✅</div>
    <h2 id="result-title">[TÍTULO DEL RESULTADO]</h2>
    <p id="result-message">[DESCRIPCIÓN DEL RESULTADO]</p>
    
    <div class="transaction-details">
        <div class="detail-row">
            <span>Número de Operación:</span>
            <span id="transaction-id">[ID]</span>
        </div>
        <div class="detail-row">
            <span>Fecha y Hora:</span>
            <span id="transaction-time">[TIEMPO]</span>
        </div>
    </div>
</div>

---
###### 4.3.7.1.2. 🎨 Estilos CSS

**Variables principales y reset**
css
/* Reset y estilos base */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --balance-gradient: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
    --success-color: #28a745;
    --error-color: #dc3545;
    --warning-color: #ffc107;
    --background-color: #f5f7fa;
    --text-color: #333;
    --text-secondary: #6c757d;
    --border-color: #e9ecef;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    line-height: 1.6;
}


**Contenedor de la aplicación (móvil)**
css
.app-container {
    max-width: 414px;
    margin: 0 auto;
    background: white;
    min-height: 100vh;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    position: relative;
}


**Encabezado**
css
.header {
    background: var(--primary-gradient);
    color: white;
    padding: 44px 20px 20px; /* Considerar área segura para iOS */
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.back-btn, .profile-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.3s;
}

.back-btn:hover, .profile-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.header-title {
    font-size: 20px;
    font-weight: 600;
}


**Pantallas y animaciones**
css
.main-content {
    padding: 20px;
    min-height: calc(100vh - 104px);
}

.screen {
    display: none;
    animation: slideIn 0.3s ease-out;
}

.screen.active {
    display: block;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}


**Tarjetas y contenedores**
css
.balance-card {
    background: var(--balance-gradient);
    color: white;
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 24px;
    text-align: center;
}

.balance-amount {
    font-size: 32px;
    font-weight: 700;
    margin: 8px 0;
}

.form-container {
    max-width: 100%;
}

.form-container h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #2c3e50;
}

.subtitle {
    color: var(--text-secondary);
    margin-bottom: 24px;
    font-size: 16px;
}


**Botones**
css
.btn-primary, .btn-secondary {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
}

.btn-primary {
    background: var(--primary-gradient);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
    background: var(--border-color);
    cursor: not-allowed;
}

.btn-secondary {
    background: white;
    border: 2px solid #667eea;
    color: #667eea;
}

.btn-secondary:hover {
    background: #667eea;
    color: white;
}


**Campos de entrada**
css
.input-group {
    margin-bottom: 24px;
}

.input-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #495057;
}

.phone-input, .amount-input {
    width: 100%;
    padding: 16px;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.phone-input:focus, .amount-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}


**Cuadrículas y diseños**
css
.actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
}

.action-btn {
    background: white;
    border: 2px solid var(--border-color);
    padding: 20px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.action-btn:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.action-btn.primary {
    background: var(--primary-gradient);
    color: white;
    border-color: transparent;
}


**Estados y estados**
css
.input-error {
    color: var(--error-color);
    font-size: 14px;
    margin-top: 8px;
    display: none;
}

.input-error.show {
    display: block;
    animation: fadeIn 0.3s ease-out;
}

.warning-message {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
}

.hidden {
    display: none !important;
}


**Diseño responsivo**
css
@media (max-width: 480px) {
    .app-container {
        max-width: 100%;
    }
    
    .main-content {
        padding: 16px;
    }
    
    .balance-amount {
        font-size: 28px;
    }
    
    .amount-input {
        font-size: 20px;
    }
    
    .currency {
        font-size: 20px;
    }
}

@media (min-width: 768px) {
    .app-container {
        max-width: 414px;
        border-radius: 20px;
        margin-top: 20px;
        margin-bottom: 20px;
    }
    
    .header {
        border-radius: 20px 20px 0 0;
    }
}


---

###### 4.3.7.1.3. ⚙️ ###### 4.3.7.1.3. ⚙️ Funcionalidad JavaScript

**Estructura principal**
javascript
// Variables globales
let currentScreen = 'home-screen';
let currentData = {};
let navigationHistory = [];

// Inicialización al cargar
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Configurar estado inicial
    updateHeaderTitle(currentScreen);
    loadMockData();
}


**Navegación entre pantallas**
javascript
function showScreen(screenId) {
    // Agregar pantalla actual al historial
    if (currentScreen !== screenId) {
        navigationHistory.push(currentScreen);
    }
    
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar pantalla requerida
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // Actualizar encabezado
    updateHeaderTitle(screenId);
}

function goBack() {
    if (navigationHistory.length > 0) {
        const previousScreen = navigationHistory.pop();
        showScreen(previousScreen);
    } else {
        showScreen('home-screen');
    }
}

function updateHeaderTitle(screenId) {
    const titles = {
        'home-screen': 'Principal',
        'recipient-screen': 'Destinatario',
        'amount-screen': 'Monto',
        'confirm-screen': 'Confirmación',
        'result-screen': 'Resultado',
        'history-screen': 'Historial'
    };
    
    document.querySelector('.header-title').textContent = titles[screenId] || 'Aplicación';
}

**Validación y formato**
javascript
// Formateo de número de teléfono
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    // Agregar +7 si comienza con 8 o 7
    if (value.startsWith('8')) {
        value = '7' + value.substring(1);
    }
    if (value.startsWith('7')) {
        value = '+7' + value.substring(1);
    }
    
    // Formatear número
    if (value.startsWith('+7')) {
        let digits = value.substring(2);
        let formatted = '+7';
        
        if (digits.length > 0) formatted += ' (' + digits.substring(0, 3);
        if (digits.length > 3) formatted += ') ' + digits.substring(3, 6);
        if (digits.length > 6) formatted += '-' + digits.substring(6, 8);
        if (digits.length > 8) formatted += '-' + digits.substring(8, 10);
        
        input.value = formatted;
    }
    
    hideError('phone-error');
}

// Validación de monto
function validateAmount(input) {
    const amount = parseFloat(input.value) || 0;
    const continueBtn = document.getElementById('amount-continue-btn');
    
    hideError('amount-error');
    
    if (amount <= 0) {
        continueBtn.disabled = true;
        return;
    }
    
    if (amount > currentBalance) {
        showError('amount-error', 'Fondos insuficientes en la cuenta');
        continueBtn.disabled = true;
        return;
    }
    
    // Verificaciones de límites adicionales
    if (currentRecipient && currentRecipient.maritalStatus === 'MARRIED' && amount > 50000) {
        showError('amount-error', 'Límite de transferencia excedido para este estado');
        continueBtn.disabled = true;
        return;
    }
    
    continueBtn.disabled = false;
}


**Simulación de API**
javascript
// Simulación de búsqueda de destinatario
function findRecipient() {
    const phoneInput = document.getElementById('phone-input');
    const phone = phoneInput.value.replace(/\D/g, '');
    
    // Validación de teléfono
    if (phone.length !== 11 || !phone.startsWith('7')) {
        showError('phone-error', 'Ingrese un número de teléfono correcto');
        return;
    }
    
    // Simulación de solicitud API
    setTimeout(() => {
        const mockRecipients = {
            '79123456789': {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Iván Ivánov',
                phone: '+7 (912) 345-67-89',
                maritalStatus: 'MARRIED'
            },
            '79111234567': {
                id: '987e6543-e21b-43d2-b456-426614174111',
                name: 'María Petrovna', 
                phone: '+7 (911) 123-45-67',
                maritalStatus: 'SINGLE'
            }
            // Datos de prueba adicionales
        };
        
        const recipient = mockRecipients[phone];
        
        if (recipient) {
            currentRecipient = recipient;
            showRecipientInfo(recipient);
            hideError('phone-error');
        } else {
            showError('phone-error', 'Destinatario no encontrado');
            hideRecipientInfo();
        }
    }, 500); // Simulación de retardo API
}

// Simulación de procesamiento de transferencia
function processTransfer() {
    const randomSuccess = Math.random() > 0.1; // 90% operaciones exitosas
    
    setTimeout(() => {
        if (randomSuccess) {
            const transactionId = generateTransactionId();
            const currentTime = new Date().toLocaleString('ru-RU');
            showTransferResult(true, '¡Transferencia completada con éxito!', transactionId);
            
            // Actualizar saldo
            currentBalance -= transferAmount;
            updateBalanceDisplay();
            
            // Agregar al historial
            addToHistory({
                type: 'transfer',
                recipient: currentRecipient,
                amount: transferAmount,
                timestamp: currentTime,
                transactionId: transactionId
            });
        } else {
            showTransferResult(false, 'Error ocurrido durante la operación', null);
        }
    }, 1500);
}

**Utilidades y ayudantes**
javascript
// Mostrar y ocultar errores
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    errorElement.classList.remove('show');
}

// Formateo de moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2
    }).format(amount);
}

// Generación de ID de transacción
function generateTransactionId() {
    return Math.floor(Math.random() * 1000000000).toString();
}

// Acciones rápidas
function setAmount(amount) {
    document.getElementById('amount-input').value = amount;
    validateAmount(document.getElementById('amount-input'));
}
---

###### 4.3.7.1.4. 📱 Requisitos de Diseño Responsivo
Dispositivos móviles (enfoque principal)
Ancho: 320px - 480px
Ancho máximo del contenedor: 414px
Relleno: 16-20px en los bordes
Tamaño de fuente: mínimo 16px para campos de entrada
Altura del botón: mínimo 44px para toque

Tabletas
Ancho: 481px - 767px
Centrado del contenedor
Relleno aumentado

Escritorio
Ancho: desde 768px
Contenedor con ancho máximo 414px
Centrado con sombras
Esquinas redondeadas del contenedor

---

###### 4.3.7.1.5. 🧪 Datos de Prueba
Escenarios de prueba obligatorios:

javascript
const testData = {
    // Escenarios exitosos
    validRecipients: [
        {
            phone: '79123456789',
            name: 'Iván Ivánov',
            maritalStatus: 'MARRIED',
            limit: 50000
        },
        {
            phone: '79111234567',
            name: 'María Petrovna',
            maritalStatus: 'SINGLE',
            limit: null
        },
        {
            phone: '79998887766',
            name: 'Anna Sidorova',
            maritalStatus: 'DIVORCED',
            limit: null
        }
    ],
    
    // Escenarios de error
    errorScenarios: [
        { type: 'RECIPIENT_NOT_FOUND', phone: '79999999999' },
        { type: 'INSUFFICIENT_FUNDS', amount: 999999 },
        { type: 'LIMIT_EXCEEDED', amount: 60000, maritalStatus: 'MARRIED' },
        { type: 'TECHNICAL_ERROR', random: true }
    ],
    
    // Saldo de prueba
    initialBalance: 125450.00
};

---

###### 4.3.7.1.6. 📋 Lista de Verificación de Calidad

**HTML**
- [ ] Marcado HTML5 válido
- [ ] Etiquetas semánticas (`<header>`, `<main>`, `<section>`)
- [ ] Atributos de accesibilidad (`aria-*`, `role`)
- [ ] Tipos de input correctos (`tel`, `number`, `email`)
- [ ] IDs únicos para todos los elementos interactivos

**CSS**
- [ ] Enfoque Mobile-first
- [ ] Variables CSS para colores y tamaños
- [ ] Animaciones y transiciones suaves
- [ ] Estados Hover para elementos interactivos
- [ ] Funcionamiento correcto de estados Focus
- [ ] Diseño responsive para todas las resoluciones

**JavaScript**
- [ ] Manejo de todos los escenarios de usuario
- [ ] Validación en el lado del cliente
- [ ] Simulación de API con retardos realistas
- [ ] Manejo de errores con mensajes claros
- [ ] Historial de navegación
- [ ] Preservación de estado entre pantallas

**UX/UI**
- [ ] Navegación intuitiva
- [ ] Estados de carga claros
- [ ] Mensajes de error informativos
- [ ] Confirmaciones de acciones críticas
- [ ] Acciones rápidas (ej. botones de montos)
- [ ] Autoformateo de campos de entrada

---

###### 4.3.7.1.7. 📖 Ejemplo de Uso

**Al crear wireframe para nueva función:**

1. **Estudia los requisitos** de User Story y Use Case
2. **Identifica las pantallas principales** y transiciones entre ellas
3. **Crea estructura HTML** comenzando desde el contenedor de aplicación
4. **Añade estilos CSS** usando sistema de diseño existente
5. **Implementa lógica JavaScript** para todos los escenarios
6. **Prueba todos los caminos** incluyendo escenarios de error
7. **Crea documentación** en README.md

**Ejemplo para función "Transferencia con comentario":**
html
<!-- Campo adicional en pantalla de monto -->
<div class="input-group">
    <label for="comment-input">Comentario (opcional)</label>
    <textarea 
        id="comment-input" 
        placeholder="Comentario de transferencia"
        class="comment-input"
        maxlength="200"
        rows="3"
    ></textarea>
    <div class="char-counter">
        <span id="char-count">0</span>/200
    </div>
</div>


---


##### 4.3.7.2. Componentes Wireframe
Uso: Componentes listos para creación rápida de wireframes
Incluye:
- Encabezados de aplicación
- Tarjetas de saldo
- Campos de entrada
- Botones y navegación
- Listas de transacciones

###### 4.3.7.2.1. 🧩 Componentes listos basados en Banking wireframes

**📱 Encabezado de Aplicación**
html
<header class="header">
    <div class="header-content">
        <button class="back-btn" onclick="goBack()">←</button>
        <h1 class="header-title">Principal</h1>
        <button class="profile-btn">👤</button>
    </div>
</header>


css
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 44px 20px 20px;
    position: sticky;
    top: 0;
    z-index: 100;
}

.back-btn, .profile-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.3s;
}


**💳 Tarjeta de Saldo**
html
<div class="balance-card">
    <h2>Saldo de Cuenta</h2>
    <div class="balance-amount">125 450,00 ₽</div>
    <p class="account-number">**** 5678</p>
</div>


css
.balance-card {
    background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
    color: white;
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 24px;
    text-align: center;
}

.balance-amount {
    font-size: 32px;
    font-weight: 700;
    margin: 8px 0;
}

.account-number {
    opacity: 0.8;
    font-size: 14px;
}


**🎯 Cuadrícula de Acciones**
html
<div class="actions-grid">
    <button class="action-btn primary" onclick="showScreen('transfer-screen')">
        <div class="action-icon">💸</div>
        <span>Transferir</span>
    </button>
    <button class="action-btn" onclick="showScreen('history-screen')">
        <div class="action-icon">📋</div>
        <span>Historial</span>
    </button>
    <button class="action-btn">
        <div class="action-icon">📱</div>
        <span>Recargar</span>
    </button>
    <button class="action-btn">
        <div class="action-icon">⚙️</div>
        <span>Ajustes</span>
    </button>
</div>


css
.actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
}

.action-btn {
    background: white;
    border: 2px solid #e9ecef;
    padding: 20px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 14px;
    font-weight: 500;
}

.action-btn:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.action-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-color: transparent;
}

.action-icon {
    font-size: 24px;
}


**📝 Grupo de Campos de Entrada**
html
<div class="input-group">
    <label for="phone-input">Número de Teléfono</label>
    <input 
        type="tel" 
        id="phone-input" 
        placeholder="+7 (___) ___-__-__"
        class="phone-input"
        oninput="formatPhone(this)"
    >
    <div class="input-error" id="phone-error"></div>
</div>


css
.input-group {
    margin-bottom: 24px;
}

.input-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #495057;
}

.phone-input {
    width: 100%;
    padding: 16px;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.phone-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-error {
    color: #dc3545;
    font-size: 14px;
    margin-top: 8px;
    display: none;
}

.input-error.show {
    display: block;
    animation: fadeIn 0.3s ease-out;
}


**👤 Tarjeta de Destinatario**
html
<div class="recipient-info hidden" id="recipient-info">
    <div class="recipient-card">
        <div class="recipient-avatar">👤</div>
        <div class="recipient-details">
            <h3 id="recipient-name">Iván Ivánov</h3>
            <p id="recipient-phone">+7 (912) 345-67-89</p>
            <span class="status-badge" id="recipient-status">Casado</span>
        </div>
    </div>
</div>


css
.recipient-info {
    margin: 24px 0;
    animation: fadeIn 0.3s ease-out;
}

.recipient-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
    gap: 16px;
}

.recipient-avatar {
    width: 50px;
    height: 50px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.recipient-details h3 {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 4px;
}

.recipient-details p {
    color: #6c757d;
    font-size: 14px;
    margin-bottom: 8px;
}

.status-badge {
    background: #28a745;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}


**💰 Campo de Entrada de Monto**
html
<div class="amount-input-container">
    <input 
        type="number" 
        id="amount-input" 
        placeholder="0"
        class="amount-input"
        min="1"
        max="100000"
        oninput="validateAmount(this)"
    >
    <span class="currency">₽</span>
</div>

<div class="balance-info">
    <span>Disponible: 125 450,00 ₽</span>
</div>

<div class="quick-amounts">
    <button class="quick-amount" onclick="setAmount(1000)">1 000</button>
    <button class="quick-amount" onclick="setAmount(5000)">5 000</button>
    <button class="quick-amount" onclick="setAmount(10000)">10 000</button>
</div>


css
.amount-input-container {
    position: relative;
    margin-bottom: 16px;
}

.amount-input {
    width: 100%;
    padding: 16px 60px 16px 16px;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
}

.currency {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 24px;
    color: #6c757d;
}

.balance-info {
    color: #6c757d;
    margin-bottom: 16px;
    text-align: center;
}

.quick-amounts {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
}

.quick-amount {
    flex: 1;
    padding: 12px;
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.quick-amount:hover {
    border-color: #667eea;
    background: #f8f9ff;
}


**✅ Pantalla de Confirmación**
html
<div class="confirmation-details">
    <div class="detail-row">
        <span>Destinatario:</span>
        <strong id="confirm-name">Iván Ivánov</strong>
    </div>
    <div class="detail-row">
        <span>Teléfono:</span>
        <span id="confirm-phone">+7 (912) 345-67-89</span>
    </div>
    <div class="detail-row">
        <span>Monto:</span>
        <strong id="confirm-amount">5 000,00 ₽</strong>
    </div>
    <div class="detail-row">
        <span>Comisión:</span>
        <span>0,00 ₽</span>
    </div>
    <hr>
    <div class="detail-row total">
        <span>A debitar:</span>
        <strong id="confirm-total">5 000,00 ₽</strong>
    </div>
</div>

<div class="warning-message" id="married-warning" style="display: none;">
    ⚠️ Para destinatarios casados aplican restricciones adicionales de monto de transferencias
</div>


css
.confirmation-details {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    align-items: center;
}

.detail-row:last-child {
    margin-bottom: 0;
}

.detail-row.total {
    font-weight: 700;
    font-size: 16px;
    margin-top: 8px;
}

.confirmation-details hr {
    border: none;
    border-top: 1px solid #e9ecef;
    margin: 12px 0;
}

.warning-message {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
}


**🎉 Pantalla de Resultado**
html
<div class="result-container">
    <div class="result-icon success" id="result-icon">✅</div>
    <h2 id="result-title">¡Transferencia completada con éxito!</h2>
    <p id="result-message">Fondos transferidos al destinatario</p>
    
    <div class="transaction-details">
        <div class="detail-row">
            <span>Número de operación:</span>
            <span id="transaction-id">123456789</span>
        </div>
        <div class="detail-row">
            <span>Fecha y hora:</span>
            <span id="transaction-time">15.11.2024, 14:30</span>
        </div>
    </div>
</div>


css
.result-container {
    text-align: center;
}

.result-icon {
    font-size: 64px;
    margin-bottom: 16px;
}

.result-icon.success {
    color: #28a745;
}

.result-icon.error {
    color: #dc3545;
}

.result-container h2 {
    font-size: 24px;
    font-weight: 700;
    color: #28a745;
    margin-bottom: 8px;
}

.result-container p {
    color: #6c757d;
    margin-bottom: 24px;
}

.transaction-details {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 24px;
    text-align: left;
}


**📋 Lista de Transacciones**
html
<div class="transaction-list">
    <div class="transaction-item">
        <div class="transaction-info">
            <div class="transaction-type">Transferencia</div>
            <div class="transaction-recipient">Iván Ivánov</div>
            <div class="transaction-phone">+7 (912) 345-67-89</div>
        </div>
        <div class="transaction-amount negative">-5 000,00 ₽</div>
        <div class="transaction-date">15.11.2024 14:30</div>
    </div>
</div>


css
.transaction-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.transaction-item {
    background: white;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 8px;
}

.transaction-info {
    grid-column: 1;
    grid-row: 1;
}

.transaction-type {
    font-weight: 500;
    color: #495057;
    font-size: 14px;
}

.transaction-recipient {
    font-weight: 600;
    font-size: 16px;
    margin: 4px 0;
}

.transaction-phone {
    color: #6c757d;
    font-size: 14px;
}

.transaction-amount {
    grid-column: 2;
    grid-row: 1;
    font-weight: 600;
    font-size: 16px;
    text-align: right;
}

.transaction-amount.negative {
    color: #dc3545;
}

.transaction-amount.positive {
    color: #28a745;
}

.transaction-date {
    grid-column: 1 / 3;
    grid-row: 2;
    color: #6c757d;
    font-size: 12px;
}


###### 4.3.7.2.2. ⚙️ Funciones JavaScript

**Manejo de Errores**
javascript
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}


**Formateo de Número Telefónico**
javascript
function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.startsWith('8')) {
        value = '7' + value.substring(1);
    }
    if (value.startsWith('7')) {
        value = '+7' + value.substring(1);
    }
    
    if (value.startsWith('+7')) {
        let digits = value.substring(2);
        let formatted = '+7';
        
        if (digits.length > 0) formatted += ' (' + digits.substring(0, 3);
        if (digits.length > 3) formatted += ') ' + digits.substring(3, 6);
        if (digits.length > 6) formatted += '-' + digits.substring(6, 8);
        if (digits.length > 8) formatted += '-' + digits.substring(8, 10);
        
        input.value = formatted;
    }
    
    hideError('phone-error');
}


**Validación de Monto**
javascript
function validateAmount(input) {
    const amount = parseFloat(input.value) || 0;
    const continueBtn = document.getElementById('amount-continue-btn');
    
    hideError('amount-error');
    
    if (amount <= 0) {
        continueBtn.disabled = true;
        return false;
    }
    
    if (amount > currentBalance) {
        showError('amount-error', 'Fondos insuficientes en cuenta');
        continueBtn.disabled = true;
        return false;
    }
    
    if (currentRecipient && currentRecipient.maritalStatus === 'MARRIED' && amount > 50000) {
        showError('amount-error', 'Límite de transferencia excedido para este estado');
        continueBtn.disabled = true;
        return false;
    }
    
    continueBtn.disabled = false;
    return true;
}


**Simulación de API**
javascript
function findRecipient() {
    const phoneInput = document.getElementById('phone-input');
    const phone = phoneInput.value.replace(/\D/g, '');
    
    if (phone.length !== 11 || !phone.startsWith('7')) {
        showError('phone-error', 'Ingrese número telefónico correcto');
        return;
    }
    
    setTimeout(() => {
        const mockRecipients = {
            '79123456789': {
                name: 'Iván Ivánov',
                phone: '+7 (912) 345-67-89',
                maritalStatus: 'MARRIED'
            },
            '79111234567': {
                name: 'María Petróva',
                phone: '+7 (911) 123-45-67',
                maritalStatus: 'SINGLE'
            },
            '79998887766': {
                name: 'Anna Sidórova',
                phone: '+7 (999) 888-77-66',
                maritalStatus: 'DIVORCED'
            }
        };
        
        const recipient = mockRecipients[phone];
        
        if (recipient) {
            currentRecipient = recipient;
            showRecipientInfo(recipient);
            hideError('phone-error');
        } else {
            showError('phone-error', 'Destinatario no encontrado');
            hideRecipientInfo();
        }
    }, 500);
}

function showRecipientInfo(recipient) {
    const recipientInfo = document.getElementById('recipient-info');
    const recipientName = document.getElementById('recipient-name');
    const recipientPhone = document.getElementById('recipient-phone');
    const recipientStatus = document.getElementById('recipient-status');
    const searchBtn = document.getElementById('search-btn');
    const continueBtn = document.getElementById('continue-btn');
    
    recipientName.textContent = recipient.name;
    recipientPhone.textContent = recipient.phone;
    
    const statusTexts = {
        'MARRIED': 'Casado',
        'SINGLE': 'Soltero',
        'DIVORCED': 'Divorciado',
        'WIDOWED': 'Viudo'
    };
    recipientStatus.textContent = statusTexts[recipient.maritalStatus] || recipient.maritalStatus;
    
    recipientInfo.classList.remove('hidden');
    searchBtn.classList.add('hidden');
    continueBtn.classList.remove('hidden');
}