### 4.3. Criação de Wireframes
**Instruções para Criar Wireframes para um Agente de IA**

#### 4.3.1. Conteúdo
1. [Requisitos Gerais](#requisitos-gerais)
2. [Stack Técnica](#stack-técnica)
3. [Estrutura do Arquivo](#estrutura-do-arquivo)
4. [Sistema de Design](#sistema-de-design)
5. [Componentes de UI](#componentes-de-ui)
6. [Padrões de Interação](#padrões-de-interação)
7. [Checklist de Qualidade](#checklist-de-qualidade)

---

#### 4.3.2. Requisitos Gerais

##### 4.3.2.1. Propósito do Wireframe:
- Visualização de requisitos de negócio
- Validação de fluxo de usuário
- Base para discussão com stakeholders
- Prototipagem rápida de funcionalidades

##### 4.3.2.2. Fontes para Criação:
- User Stories (US)
- Use Cases (UC)
- Requisitos de interface
- Fluxos de usuário

---

#### 4.3.3. Stack Técnica

##### 4.3.3.1. Tecnologias Base:
- **HTML5** - estrutura semântica
- **CSS3** - estilização e layout
- **JavaScript** - interatividade

##### 4.3.3.2. Frameworks e Bibliotecas:
- Bootstrap 5.x ou Tailwind CSS para layout responsivo
- Font Awesome para ícones
- Google Fonts para tipografia

##### 4.3.3.3. Requisitos de Compatibilidade:
- Browsers modernos (Chrome, Firefox, Safari, Edge)
- Design responsivo (mobile-first)
- Acessibilidade básica (ARIA labels)

---

#### 4.3.4. Estrutura do Arquivo

##### 4.3.4.1. Template Base HTML:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Nome da Funcionalidade] - Wireframe</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <style>
        /* Estilos customizados aqui */
        :root {
            --primary-color: #0d6efd;
            --secondary-color: #6c757d;
            --background-color: #f8f9fa;
            --text-color: #212529;
        }
        
        body {
            background-color: var(--background-color);
            color: var(--text-color);
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        
        /* Wireframe styling - cores sutis para protótipo */
        .wireframe-placeholder {
            background-color: #e9ecef;
            border: 2px dashed #adb5bd;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="bg-white shadow-sm">
        <nav class="navbar navbar-expand-lg navbar-light">
            <div class="container">
                <a class="navbar-brand" href="#">Logo</a>
                <!-- Navigation items -->
            </div>
        </nav>
    </header>
    
    <!-- Main Content -->
    <main class="container py-4">
        <!-- Conteúdo do wireframe aqui -->
    </main>
    
    <!-- Footer -->
    <footer class="bg-dark text-white py-3 mt-auto">
        <div class="container text-center">
            <p class="mb-0">&copy; 2024 - Wireframe</p>
        </div>
    </footer>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // JavaScript para interatividade
    </script>
</body>
</html>
```

---

#### 4.3.5. Sistema de Design

##### 4.3.5.1. Paleta de Cores:

| Uso | Variável | Cor |
|-----|----------|-----|
| Primária | --primary-color | #0d6efd |
| Secundária | --secondary-color | #6c757d |
| Sucesso | --success-color | #198754 |
| Perigo | --danger-color | #dc3545 |
| Aviso | --warning-color | #ffc107 |
| Info | --info-color | #0dcaf0 |
| Fundo | --background-color | #f8f9fa |
| Texto | --text-color | #212529 |

##### 4.3.5.2. Tipografia:

| Elemento | Tamanho | Peso |
|----------|---------|------|
| H1 | 2.5rem | 700 |
| H2 | 2rem | 600 |
| H3 | 1.75rem | 600 |
| H4 | 1.5rem | 500 |
| Body | 1rem | 400 |
| Small | 0.875rem | 400 |

##### 4.3.5.3. Espaçamento:
- Uso de sistema de grid 12 colunas
- Espaçamentos padrão: 0.25rem, 0.5rem, 1rem, 1.5rem, 3rem
- Classes Bootstrap: p-1, p-2, p-3, m-1, m-2, m-3

---

#### 4.3.6. Componentes de UI

##### 4.3.6.1. Formulários:

```html
<!-- Campo de entrada padrão -->
<div class="mb-3">
    <label for="inputField" class="form-label">Label do Campo</label>
    <input type="text" class="form-control" id="inputField" 
           placeholder="Placeholder" aria-describedby="inputHelp">
    <div id="inputHelp" class="form-text">Texto de ajuda opcional.</div>
</div>

<!-- Select -->
<div class="mb-3">
    <label for="selectField" class="form-label">Selecione uma opção</label>
    <select class="form-select" id="selectField">
        <option selected>Escolha...</option>
        <option value="1">Opção 1</option>
        <option value="2">Opção 2</option>
    </select>
</div>

<!-- Checkbox -->
<div class="form-check mb-3">
    <input class="form-check-input" type="checkbox" id="checkField">
    <label class="form-check-label" for="checkField">
        Concordo com os termos
    </label>
</div>
```

##### 4.3.6.2. Botões:

```html
<!-- Botão primário -->
<button type="button" class="btn btn-primary">
    <i class="fas fa-check me-2"></i>Confirmar
</button>

<!-- Botão secundário -->
<button type="button" class="btn btn-secondary">Cancelar</button>

<!-- Botão de perigo -->
<button type="button" class="btn btn-danger">
    <i class="fas fa-trash me-2"></i>Excluir
</button>

<!-- Botão outline -->
<button type="button" class="btn btn-outline-primary">Saiba Mais</button>
```

##### 4.3.6.3. Cards:

```html
<div class="card">
    <div class="card-header">
        <h5 class="card-title mb-0">Título do Card</h5>
    </div>
    <div class="card-body">
        <p class="card-text">Conteúdo do card...</p>
    </div>
    <div class="card-footer">
        <button class="btn btn-primary btn-sm">Ação</button>
    </div>
</div>
```

##### 4.3.6.4. Tabelas:

```html
<div class="table-responsive">
    <table class="table table-hover">
        <thead class="table-light">
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Ações</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>001</td>
                <td>Item 1</td>
                <td><span class="badge bg-success">Ativo</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

##### 4.3.6.5. Modais:

```html
<!-- Botão para abrir modal -->
<button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
    Abrir Modal
</button>

<!-- Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Título do Modal</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <div class="modal-body">
                Conteúdo do modal...
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary">Confirmar</button>
            </div>
        </div>
    </div>
</div>
```

---

#### 4.3.7. Padrões de Interação

##### 4.3.7.1. Validação de Formulário:

```javascript
// Validação Bootstrap
(function () {
    'use strict'
    
    var forms = document.querySelectorAll('.needs-validation')
    
    Array.prototype.slice.call(forms).forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        }, false)
    })
})()
```

##### 4.3.7.2. Feedback Visual:

```html
<!-- Mensagem de sucesso -->
<div class="alert alert-success alert-dismissible fade show" role="alert">
    <i class="fas fa-check-circle me-2"></i>
    Operação realizada com sucesso!
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
</div>

<!-- Mensagem de erro -->
<div class="alert alert-danger alert-dismissible fade show" role="alert">
    <i class="fas fa-exclamation-circle me-2"></i>
    Erro ao processar a solicitação.
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
</div>
```

##### 4.3.7.3. Estados de Loading:

```html
<!-- Spinner -->
<div class="d-flex justify-content-center">
    <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Carregando...</span>
    </div>
</div>

<!-- Botão com loading -->
<button class="btn btn-primary" type="button" disabled>
    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
    Processando...
</button>
```

---

#### 4.3.8. Checklist de Qualidade

##### 4.3.8.1. Estrutura:
- [ ] Arquivo HTML válido (DOCTYPE, meta tags)
- [ ] Estrutura semântica (header, main, footer)
- [ ] Título descritivo da página
- [ ] CSS e JS carregados corretamente

##### 4.3.8.2. Design:
- [ ] Layout responsivo (funciona em mobile e desktop)
- [ ] Cores consistentes com sistema de design
- [ ] Tipografia legível
- [ ] Espaçamento adequado entre elementos

##### 4.3.8.3. Funcionalidade:
- [ ] Formulários com validação básica
- [ ] Botões com estados (hover, active, disabled)
- [ ] Modais funcionando
- [ ] Feedback visual para ações

##### 4.3.8.4. Acessibilidade:
- [ ] Labels em todos os campos de formulário
- [ ] ARIA labels onde necessário
- [ ] Contraste adequado de cores
- [ ] Navegação por teclado funcional

##### 4.3.8.5. Integração:
- [ ] Correspondência com User Story
- [ ] Cobertura de cenários do Use Case
- [ ] Elementos interativos para todos os fluxos

---

#### 4.3.9. Boas Práticas

##### 4.3.9.1. Wireframe vs Protótipo de Alta Fidelidade:
- **Wireframe**: foco em estrutura e funcionalidade
- Cores neutras (cinzas, azuis sutis)
- Sem imagens reais, usar placeholders
- Texto pode ser "Lorem ipsum" para conteúdo não crítico

##### 4.3.9.2. Anotações:
- Incluir comentários no HTML explicando a funcionalidade
- Marcar elementos interativos claramente
- Indicar estados alternativos (erro, sucesso, loading)

##### 4.3.9.3. Organização:
- Um wireframe por funcionalidade principal
- Nomear arquivos de forma descritiva
- Manter consistência visual entre wireframes relacionados
