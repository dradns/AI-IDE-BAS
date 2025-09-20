# GitHub Repository Telemetry System

Система телеметрии для отслеживания метрик GitHub репозитория с полным набором алгоритмов анализа, прогнозирования и обнаружения аномалий.

## 🚀 Возможности

### Алгоритм 1: Отправка событий

- **Ежедневные снимки** репозитория с полями:
    - `stars_count` - количество звёзд
    - `forks_count` - количество форков
    - `watchers_count` - количество наблюдателей
    - `open_issues_count` - количество открытых issues
    - `open_pr_count` - количество открытых pull requests
    - `releases_total` - общее количество релизов

### Алгоритм 2: PostHog подсчёт

- **Дневные изменения** (Δday) для каждого показателя
- **7-дневное скользящее среднее** для сглаживания трендов
- **Индекс здоровья репозитория**: `health = α⋅stars + β⋅forks + γ⋅open_pr`

### Алгоритм 3: Верификация данных

- **Проверка целостности** - линии без "прыжков назад"
- **Аннотация всплесков** релизами или постами
- **Анализ разрыва** stars vs forks → сигнал о популярности без использования

### Алгоритм 4: Анализ и выводы

- **Корреляционный анализ**: рост open_pr_count ↔ рост stars_count через 7 дней
- **Анализ разрыва** stars ≫ forks → план улучшения DX и документации
- **Инсайты и рекомендации** на основе паттернов использования

### Алгоритм 5: Прогноз и автоматизация

- **Прогнозирование роста** на основе исторических данных
- **Автоматические оповещения** об аномалиях (≥3 стандартных отклонений)
- **ML-модель** для предсказания churn probability

## 📊 События телеметрии

### Основные события

- `GITHUB_REPO_SNAPSHOT` - ежедневный снимок репозитория
- `GITHUB_REPO_ANOMALY_DETECTED` - обнаружение аномалий
- `GITHUB_REPO_HEALTH_ALERT` - оповещения о здоровье репозитория

### Свойства событий

```typescript
interface GitHubRepoProperties {
	// Основные метрики
	stars_count: number
	forks_count: number
	watchers_count: number
	open_issues_count: number
	open_pr_count: number
	releases_total: number

	// Дневные изменения
	delta_stars?: number
	delta_forks?: number
	delta_watchers?: number
	delta_issues?: number
	delta_pr?: number
	delta_releases?: number

	// 7-дневные средние
	stars_7day_avg?: number
	forks_7day_avg?: number
	watchers_7day_avg?: number
	issues_7day_avg?: number
	pr_7day_avg?: number
	releases_7day_avg?: number

	// Аналитические показатели
	health_index?: number
	stars_forks_ratio?: number

	// Аномалии
	anomaly_detected?: boolean
	anomaly_type?: string
	anomaly_severity?: "low" | "medium" | "high"
}
```

## 🛠️ Использование

### Инициализация

```typescript
import { GitHubTelemetryService } from "@roo-code/telemetry"

const githubService = new GitHubTelemetryService(
	"dradns", // owner
	"AI-IDE-BAS", // repo
	context.globalState, // VSCode global state
	telemetryService, // TelemetryService instance
	process.env.GITHUB_TOKEN, // optional token
)
```

### Ежедневный анализ

```typescript
// Автоматически выполняется при активации расширения
await githubService.performDailyAnalysis()
```

### Получение инсайтов

```typescript
const insights = githubService.getRepositoryInsights()
console.log(`Health Score: ${insights.healthScore}/100`)
console.log("Insights:", insights.insights)
console.log("Recommendations:", insights.recommendations)
```

### Ручной анализ

```typescript
// Обнаружение аномалий
const anomaly = await githubService.detectAnomalies()

// Прогнозы роста
const predictions = githubService.getGrowthPredictions()
```

## 🎯 VSCode команды

### Доступные команды

- `ai-ide-bas.github.analyze` - Запустить анализ репозитория
- `ai-ide-bas.github.insights` - Показать детальные инсайты
- `ai-ide-bas.github.configure` - Настроить репозиторий

### Использование команд

1. Откройте Command Palette (`Ctrl+Shift+P`)
2. Введите "GitHub" для поиска команд
3. Выберите нужную команду

## ⚙️ Конфигурация

### Переменные окружения

```bash
# Обязательные
GITHUB_REPO_OWNER=dradns
GITHUB_REPO_NAME=AI-IDE-BAS

# Опциональные
GITHUB_TOKEN=ghp_... # для увеличения лимитов API
```

### Настройка через команду

```typescript
// Через VSCode команду ai-ide-bas.github.configure
// Или программно:
await githubService.configureRepository("owner", "repo", "token")
```

## 📈 Аналитические алгоритмы

### Индекс здоровья

```typescript
health_index = α⋅stars + β⋅forks + γ⋅open_pr
// где α=0.4, β=0.3, γ=0.3
```

### Обнаружение аномалий

- **Статистический анализ** с порогом 3σ
- **Типы аномалий**: stars_spike, forks_spike, issues_spike, pr_spike, releases_spike
- **Уровни серьёзности**: low, medium, high

### Прогнозирование

- **Тренд-анализ** на основе последних 7 дней
- **Коэффициент вариации** для оценки уверенности
- **Прогноз на 7 дней** для stars и forks

## 🔍 Мониторинг и алерты

### Автоматические алерты

- **Низкий индекс здоровья** (<30)
- **Высокое соотношение** stars/forks (>10:1)
- **Резкий рост issues** (>10 за день)
- **Статистические аномалии** (≥3σ)

### Рекомендации

- Улучшение developer experience
- Добавление примеров и туториалов
- Увеличение capacity для review
- Автоматизация triage issues

## 📊 Примеры данных

### Ежедневный снимок

```json
{
	"stars_count": 1250,
	"forks_count": 89,
	"watchers_count": 1250,
	"open_issues_count": 12,
	"open_pr_count": 3,
	"releases_total": 15,
	"delta_stars": 5,
	"delta_forks": 1,
	"health_index": 567.3,
	"stars_forks_ratio": 14.04,
	"anomaly_detected": false
}
```

### Инсайты

```json
{
	"healthScore": 56.7,
	"insights": [
		"High stars-to-forks ratio (14.0:1) indicates popularity but low adoption",
		"Gained 5 stars today",
		"Gained 1 forks today"
	],
	"recommendations": ["Improve developer experience and documentation", "Add more examples and tutorials"],
	"predictions": {
		"predictedStars": 1285,
		"predictedForks": 95,
		"confidence": 0.78
	}
}
```

## 🚨 Troubleshooting

### Частые проблемы

1. **"GitHub Telemetry Service not initialized"**

    - Проверьте инициализацию в extension.ts
    - Убедитесь, что сервис создан до использования

2. **"No historical data available"**

    - Запустите анализ командой `ai-ide-bas.github.analyze`
    - Проверьте конфигурацию репозитория

3. **API rate limits**
    - Добавьте GitHub token в переменные окружения
    - Проверьте лимиты в GitHub API

### Логирование

Все операции логируются в VSCode Output Channel "AI IDE BAS". Проверьте логи для диагностики проблем.

## 🔗 Интеграция с PostHog

Система автоматически отправляет события в PostHog:

- **Ежедневные снимки** для построения графиков
- **Аномалии** для алертов
- **Health alerts** для мониторинга

События содержат все необходимые свойства для анализа в PostHog dashboard.
