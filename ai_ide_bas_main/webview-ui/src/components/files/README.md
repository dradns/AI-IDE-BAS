# AI IDE BAS — Кнопка удаления файлов

## Что сделано
- Добавлена кнопка **«Удалить»** в компонент `FilesView.tsx`. 
- При клике отправляется событие `files:delete` с `{ text: idOrName, values: { projectName? } }`. 
- Для удобства добавлены **логи в консоль** (`console.log`), чтобы отследить событие. 
- Mock-режим использовался только в черновой работе. В финальной версии он **убран**. 
- Авторизация для теста была отключена.

---

## Как собрать
```bash
nvm use 20.19.2
pnpm install
pnpm approve-builds   # выбрать все и подтвердить
pnpm -F @roo-code/vscode-webview build
cd src && pnpm run bundle
pnpm dlx @vscode/vsce package -o ai-ide-bas.vsix
