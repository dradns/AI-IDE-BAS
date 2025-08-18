# 📊 PostHog Insights - Быстрый справочник

## 🎯 Топ-10 приоритетных метрик

### 1. Активные пользователи по дням

- **Событие:** `$pageview`
- **Тип:** Trends
- **Цель:** Мониторинг роста пользовательской базы

### 2. Количество сборок VSIX

- **Событие:** `VSIX Build Completed`
- **Тип:** Trends
- **Цель:** Отслеживание активности разработки

### 3. Популярность режимов

- **Событие:** `Mode Selected`
- **Тип:** Funnel
- **Breakdown:** По `modeName`
- **Цель:** Приоритизация режимов

### 4. Retention пользователей

- **Событие:** `$pageview`
- **Тип:** Retention
- **Периоды:** 1, 7, 30 дней
- **Цель:** Измерение лояльности

### 5. Ошибки и проблемы

- **Событие:** `SCHEMA_VALIDATION_ERROR`, `DIFF_APPLICATION_ERROR`, `SHELL_INTEGRATION_ERROR`
- **Тип:** Trends
- **Цель:** Обеспечение стабильности

### 6. Популярность кнопок навигации

- **Событие:** `Navigation Button Clicked`
- **Тип:** Funnel
- **Breakdown:** По `buttonType`
- **Цель:** Оптимизация навигации

### 7. Использование горячих клавиш

- **Событие:** `Mode Selected` с `selectionMethod: "keyboard_shortcut"`
- **Тип:** Trends
- **Цель:** Оценка эффективности UX

### 8. Путь пользователя

- **Событие:** `$pageview` и пользовательские события
- **Тип:** Paths
- **Цель:** Оптимизация пользовательского пути

### 9. Использование AI функций

- **Событие:** `LLM_COMPLETION`, `TASK_CREATED`, `TASK_COMPLETED`
- **Тип:** Funnel
- **Цель:** Оценка эффективности AI

### 10. Время в каждом режиме

- **Событие:** `Mode Selected`
- **Тип:** Trends
- **Цель:** Понимание глубины использования

---

## 🔧 Быстрая настройка

### Основные события:

```javascript
"$pageview" // Просмотры страниц
"VSIX Build Completed" // Завершение сборки
"Mode Selected" // Выбор режима
"Navigation Button Clicked" // Клики по кнопкам
"Title Button Clicked" // Клики по заголовкам
"Mode Selector Opened" // Открытие селектора режимов
```

### Ключевые свойства:

```javascript
// Режимы
modeName: "BA" | "Architect" | "SA" | "Review" | "Designer" | "Helper"
selectionMethod: "click" | "keyboard_shortcut"

// Кнопки
buttonType: "youtube_video" | "instructions"
buttonPosition: "top" | "bottom"
```

---

## 📊 Примеры Insights

### Популярность режимов

```
Событие: Mode Selected
Breakdown: modeName
Тип: Funnel
```

### Retention пользователей

```
Событие: $pageview
Тип: Retention
Периоды: 1, 7, 30 дней
```

### Путь пользователя

```
Начальное событие: $pageview
Конечное событие: Mode Selected
Тип: Paths
```

---

## 🎯 KPI цели

- **Рост активных пользователей:** +20% в месяц
- **Retention 7 дней:** >40%
- **Retention 30 дней:** >20%
- **Снижение ошибок:** -50% в месяц
- **Увеличение времени в продукте:** +30% в месяц

---

_Полная версия: [POSTHOG_INSIGHTS.md](./POSTHOG_INSIGHTS.md)_
