#!/bin/bash

# Перейди в репозиторий (если скрипт не в нём)

# Убедись, что ветка чистая
git checkout sync-upstream
git pull origin sync-upstream  # Обнови из твоего origin

# Fetch и merge с автоматическим ours
git fetch upstream
git merge upstream/main -X ours --allow-unrelated-histories -m "Auto-merge upstream with ours strategy"

# Если merge удался (без неразрешимых конфликтов), запушь
if [ $? -eq 0 ]; then
    git push origin feature/initial-setup
    echo "Sync completed successfully."
else
    echo "Conflicts detected! Resolve manually."
    # Здесь можно добавить уведомление, например, через email или Slack
fi