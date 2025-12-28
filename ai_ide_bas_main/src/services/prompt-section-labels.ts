const SUPPORTED_LABEL_LANGUAGES = ["en", "ru", "es", "zh", "ar", "pt"] as const;

// Normalize language code to base format, fallback to English if unsupported
function normalizeLangForLabels(lang?: string): string {
    if (!lang) {
        return "en";
    }

    const baseLang = lang.split("-")[0].toLowerCase();

    const langMap: Record<string, string> = {
        zh: "zh",
        pt: "pt",
        ar: "ar",
        es: "es",
        ru: "ru",
        en: "en",
        cn: "zh",
    };

    const normalized = langMap[baseLang] || baseLang;

    if (SUPPORTED_LABEL_LANGUAGES.includes(normalized as any)) {
        return normalized;
    }

    return "en";
}

// Localized section labels for all supported languages
const SECTION_LABELS: Record<string, Record<string, string>> = {
    en: {
        role: "Role",
        project: "Project",
        tasks: "Tasks",
        instructions: "Instructions",
        artifacts: "Artifacts",
        globalInstructions: "Global Instructions",
        languagePreference: "Language Preference",
        usersCustomInstructions: "USER'S CUSTOM INSTRUCTIONS",
        rulesFromRoo: "RULES FROM .ROO DIRECTORY",
    },
    ru: {
        role: "Роль",
        project: "Проект",
        tasks: "Задачи",
        instructions: "Инструкции",
        artifacts: "Артефакты",
        globalInstructions: "Глобальные инструкции",
        languagePreference: "Предпочтение языка",
        usersCustomInstructions: "ПОЛЬЗОВАТЕЛЬСКИЕ ИНСТРУКЦИИ",
        rulesFromRoo: "ПРАВИЛА ИЗ ДИРЕКТОРИИ .ROO",
    },
    es: {
        role: "Rol",
        project: "Proyecto",
        tasks: "Tareas",
        instructions: "Instrucciones",
        artifacts: "Artefactos",
        globalInstructions: "Instrucciones globales",
        languagePreference: "Preferencia de idioma",
        usersCustomInstructions: "INSTRUCCIONES PERSONALIZADAS DEL USUARIO",
        rulesFromRoo: "REGLAS DEL DIRECTORIO .ROO",
    },
    zh: {
        role: "角色",
        project: "项目",
        tasks: "任务",
        instructions: "说明",
        artifacts: "工件",
        globalInstructions: "全局说明",
        languagePreference: "语言偏好",
        usersCustomInstructions: "用户自定义说明",
        rulesFromRoo: ".ROO 目录规则",
    },
    ar: {
        role: "الدور",
        project: "المشروع",
        tasks: "المهام",
        instructions: "التعليمات",
        artifacts: "القطع الأثرية",
        globalInstructions: "التعليمات العامة",
        languagePreference: "تفضيل اللغة",
        usersCustomInstructions: "تعليمات المستخدم المخصصة",
        rulesFromRoo: "قواعد من دليل .ROO",
    },
    pt: {
        role: "Função",
        project: "Projeto",
        tasks: "Tarefas",
        instructions: "Instruções",
        artifacts: "Artefatos",
        globalInstructions: "Instruções globais",
        languagePreference: "Preferência de idioma",
        usersCustomInstructions: "INSTRUÇÕES PERSONALIZADAS DO USUÁRIO",
        rulesFromRoo: "REGRAS DO DIRETÓRIO .ROO",
    },
};

// Get localized section label by key and language code
export function getSectionLabel(key: string, language?: string): string {
    const normalizedLang = normalizeLangForLabels(language);
    const labels = SECTION_LABELS[normalizedLang] || SECTION_LABELS.en;
    return labels[key] || SECTION_LABELS.en[key] || key;
}

// Get localized section header with markdown format (##)
export function getSectionHeader(key: string, language?: string): string {
    return `## ${getSectionLabel(key, language)}`;
}

// Get localized section title with colon suffix
export function getSectionTitle(key: string, language?: string): string {
    return `${getSectionLabel(key, language)}:`;
}
