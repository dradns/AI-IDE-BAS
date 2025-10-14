# CHANGELOG

## Ребрендинг UI/UX (2025-09-24)

В рамках ребрендинга пользовательского интерфейса и опыта (UI/UX) выполнены следующие изменения, видимые пользователю. Бэкэнд-идентификаторы и внутренние пути/классы не изменялись.

- Текстовые упоминания:
  - Заменены все видимые упоминания «Roo Code» и «Roo» в интерфейсе на нейтральные термины. Использовалась формулировка «AI IDE BAS» (либо «наша платформа», «сервис» по контексту в локализациях).
  - Обновлены все локализации (`webview-ui/src/i18n/locales/*`), сохраняя корректную грамматику и смысл в каждом языке. Исключения: служебные пути/файлы с префиксами `.roo/*`, `@roo/*` не менялись.

- Компоненты и страницы:
  - Обновлены видимые строки в компонентах и страницах `webview-ui/src/**` и приложениях `apps/**`, не затрагивая идентификаторы кода, импорты и неймспейсы.
  - Обновлен комментарий в `webview-ui/src/components/account/AccountView.tsx` для соответствия новому нейтральному брендингу.

- Ассеты (логотипы и изображения):
  - Переименованы файлы логотипов:
    - `ai_ide_bas_main/src/assets/images/roo-logo.svg` → `product-logo.svg`
    - `ai_ide_bas_main/apps/web-roo-code/public/Roo-Code-Logo-Horiz-white.svg` → `Product-Logo-Horiz-white.svg`
    - `ai_ide_bas_main/apps/web-roo-code/public/Roo-Code-Logo-Horiz-blk.svg` → `Product-Logo-Horiz-blk.svg`
  - Обновлены все ссылки на переименованные ассеты в коде.

- Документация:
  - Создан файл `CHANGELOG.md` с подробным описанием всех изменений.

---
Отчёт о ребрендинге: "Roo" -> "AI IDE BAS"
---

Файлы ассетов (изображения и логотипы):
- Переименован: `ai_ide_bas_main/src/assets/images/roo-logo.svg` → `ai_ide_bas_main/src/assets/images/product-logo.svg`
- Переименован: `ai_ide_bas_main/apps/web-roo-code/public/Roo-Code-Logo-Horiz-white.svg` → `ai_ide_bas_main/apps/web-roo-code/public/Product-Logo-Horiz-white.svg`
- Переименован: `ai_ide_bas_main/apps/web-roo-code/public/Roo-Code-Logo-Horiz-blk.svg` → `ai_ide_bas_main/apps/web-roo-code/public/Product-Logo-Horiz-blk.svg`

Изменения в коде UI (компоненты/страницы):
- `ai_ide_bas_main/apps/web-roo-code/src/lib/hooks/use-logo-src.ts`:
  - Обновлены пути логотипов: `"/Roo-Code-Logo-Horiz-white.svg"` → `"/Product-Logo-Horiz-white.svg"`, `"/Roo-Code-Logo-Horiz-blk.svg"` → `"/Product-Logo-Horiz-blk.svg"`.
- `ai_ide_bas_main/webview-ui/src/components/account/AccountView.tsx`:
  - Обновлён комментарий к логотипу: `"/roo-logo.svg"` → `"/product-logo.svg"` (только комментарий, функционал не изменён).
- `ai_ide_bas_main/webview-ui/src/**` и `ai_ide_bas_main/apps/**` (много файлов `.tsx/.ts/.jsx/.md/.html`):
  - Заменены видимые строки `"Roo Code"` → `"AI IDE BAS"` и одиночные `"Roo"` → `"AI IDE BAS"`, без изменения идентификаторов кода, импортов и путей (`@roo/*`, `.roo/*`).

Изменения в файлах локализации (i18n):
- Каталог: `ai_ide_bas_main/webview-ui/src/i18n/locales/**` (все языки)
  - Примеры (показывают характер замен, фактические значения обновлены во всех языках):
    - `en/settings.json`: `"Allow Roo Code to create..."` → `"Allow AI IDE BAS to create..."`
    - `ru/settings.json`: `"Разрешить Roo Code создавать..."` → `"Разрешить AI IDE BAS создавать..."`
    - `zh-CN/welcome.json`: `"欢迎使用 Roo Code！"` → `"欢迎使用 AI IDE BAS！"`
    - `vi/chat.json`: заголовки релизов и описания: `"Roo Code {{version}}"` → `"AI IDE BAS {{version}}"`
    - Во всех языках сохранены служебные упоминания в путях вида `.roo/...` и `.rooignore`.

Анализ SVG файлов:
- Проверены SVG файлы на наличие текста "roo" внутри:
  - `Product-Logo-Horiz-blk.svg` и `Product-Logo-Horiz-white.svg` содержат закодированные данные изображения с упоминанием "roo", но это не влияет на функциональность.
  - Текстовые элементы и метаданные SVG не содержат видимых упоминаний "roo".
  - Файлы корректно отображаются и не препятствуют работе popup-меню.

Замечания и ограничения:
- Не изменялись внутренние идентификаторы, импорты и пути: `@roo/*`, `.roo/*`, имена контроллеров, тестовые фикстуры и т.п.
- URL-адреса и marketplace-идентификаторы, содержащие `Roo` в составе доменов/идентификаторов (например, `RooVeterinaryInc.roo-cline`, `github.com/RooCodeInc/Roo-Code`), оставлены без изменений, так как это внешние ссылки/идентификаторы, не относящиеся к пользовательскому брендингу UI.

Покрытие и проверка:
- Репозиторий просканирован в директориях `src`, `apps`, `webview-ui/src`, `apps/**/public` на остаточные видимые упоминания `"Roo"/"Roo Code"`. Остались только:
  - служебные пути `.roo/*`, файлы `.rooignore`;
  - импорт-пути/пакеты `@roo/*`;
  - внешние ссылки/идентификаторы marketplace/соцсетей.

Результат:
- Полное удаление брендинга «Roo» из пользовательского интерфейса.
- Сохранение функциональности и внутренней архитектуры.
- Готовность к использованию нейтрального брендинга «AI IDE BAS».
- SVG файлы содержат закодированные данные с "roo", но это не влияет на работу интерфейса.


Измененные файлы:

        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/extension.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/modes.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/subtasks.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/task.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/apply-diff.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/execute-command.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/insert-content.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/list-files.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/read-file.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/search-and-replace.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/search-files.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/use-mcp-tool.test.ts
        modified:   ai_ide_bas_main/apps/vscode-e2e/src/suite/tools/write-to-file.test.ts
        modified:   ai_ide_bas_main/apps/web-evals/src/app/layout.tsx
        modified:   ai_ide_bas_main/apps/web-evals/src/app/runs/new/new-run.tsx
        deleted:    ai_ide_bas_main/apps/web-roo-code/public/Roo-Code-Logo-Horiz-blk.svg
        deleted:    ai_ide_bas_main/apps/web-roo-code/public/Roo-Code-Logo-Horiz-white.svg
        modified:   ai_ide_bas_main/apps/web-roo-code/src/app/enterprise/page.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/app/evals/evals.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/app/evals/page.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/app/layout.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/app/page.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/app/privacy/page.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/app/terms/page.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/chromes/footer.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/chromes/nav-bar.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/chromes/stats-display.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/enterprise/contact-form.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/homepage/code-example.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/homepage/faq-section.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/homepage/features.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/homepage/install-section.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/homepage/testimonials.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/components/homepage/whats-new-button.tsx
        modified:   ai_ide_bas_main/apps/web-roo-code/src/lib/constants.ts
        modified:   ai_ide_bas_main/apps/web-roo-code/src/lib/hooks/use-logo-src.ts
        modified:   ai_ide_bas_main/apps/web-roo-code/src/lib/stats.ts
        modified:   ai_ide_bas_main/packages/build/src/__tests__/index.test.ts
        modified:   ai_ide_bas_main/packages/evals/ADDING-EVALS.md
        modified:   ai_ide_bas_main/packages/evals/ARCHITECTURE.md
        modified:   ai_ide_bas_main/packages/evals/README.md
        modified:   ai_ide_bas_main/packages/evals/src/cli/index.ts
        modified:   ai_ide_bas_main/packages/evals/src/cli/utils.ts
        modified:   ai_ide_bas_main/packages/types/npm/README.md
        modified:   ai_ide_bas_main/packages/types/src/mode.ts
        deleted:    ai_ide_bas_main/src/assets/images/roo-logo.svg
        modified:   ai_ide_bas_main/webview-ui/src/__tests__/ErrorBoundary.spec.tsx
        modified:   ai_ide_bas_main/webview-ui/src/components/ErrorBoundary.tsx
        modified:   ai_ide_bas_main/webview-ui/src/components/account/AccountView.tsx
        modified:   ai_ide_bas_main/webview-ui/src/components/account/__tests__/AccountView.spec.tsx
        modified:   ai_ide_bas_main/webview-ui/src/components/chat/__tests__/Announcement.spec.tsx
        modified:   ai_ide_bas_main/webview-ui/src/components/marketplace/IssueFooter.tsx
        modified:   ai_ide_bas_main/webview-ui/src/components/marketplace/MarketplaceViewStateManager.ts
        modified:   ai_ide_bas_main/webview-ui/src/components/settings/About.tsx
        modified:   ai_ide_bas_main/webview-ui/src/components/settings/__tests__/TodoListSettingsControl.spec.tsx
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ca/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ca/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ca/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ca/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ca/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ca/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/de/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/de/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/de/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/de/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/de/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/de/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/en/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/en/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/en/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/en/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/en/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/en/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/es/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/es/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/es/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/es/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/es/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/es/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/fr/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/fr/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/fr/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/fr/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/fr/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/fr/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/hi/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/hi/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/hi/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/hi/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/hi/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/hi/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/id/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/id/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/id/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/id/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/id/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/id/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/it/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/it/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/it/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/it/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/it/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/it/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ja/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ja/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ja/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ja/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ja/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ja/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ko/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ko/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ko/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ko/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ko/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ko/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/nl/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/nl/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/nl/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/nl/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/nl/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/nl/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pl/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pl/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pl/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pl/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pl/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pl/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pt-BR/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pt-BR/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pt-BR/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pt-BR/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pt-BR/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/pt-BR/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ru/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ru/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ru/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ru/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ru/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/ru/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/tr/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/tr/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/tr/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/tr/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/tr/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/tr/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/vi/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/vi/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/vi/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/vi/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/vi/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/vi/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-CN/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-CN/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-CN/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-CN/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-CN/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-CN/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-TW/chat.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-TW/marketplace.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-TW/mcp.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-TW/prompts.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-TW/settings.json
        modified:   ai_ide_bas_main/webview-ui/src/i18n/locales/zh-TW/welcome.json
        modified:   ai_ide_bas_main/webview-ui/src/utils/docLinks.ts