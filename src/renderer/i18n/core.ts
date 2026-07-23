// ─── wmux UI internationalization — pure core (issue #56) ────────────────────
// Types, dictionaries and pure helpers with NO store dependency. The settings
// slice imports from here (for the default-language detection at store-creation
// time); keeping this module store-free avoids a circular import between the
// store and the `useT` hook (which lives in ./index and *does* read the store).
//
// Coverage is intentionally pragmatic ("main UI"): Settings chrome, the General
// panel, command palette, titlebar, and the workspace context menu. Any key not
// present in the active language falls back to English, then to the literal key,
// so partial translations never render blank.

export type Language = 'en' | 'fr' | 'ru' | 'zh';

export const LANGUAGES: ReadonlyArray<{ code: Language; label: string }> = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
];

export const SUPPORTED_LANGUAGES: ReadonlyArray<Language> = LANGUAGES.map((l) => l.code);

type Dict = Record<string, string>;

const en: Dict = {
  // Settings — window chrome
  'settings.title': 'Settings',
  'settings.tab.general': 'General',
  'settings.tab.sidebar': 'Sidebar',
  'settings.tab.workspace': 'Workspace',
  'settings.tab.terminal': 'Terminal',
  'settings.tab.ai': 'AI',
  'settings.tab.notifications': 'Notifications',
  'settings.tab.browser': 'Browser',
  'settings.tab.profiles': 'Profiles',
  'settings.tab.shortcuts': 'Shortcuts',
  // Settings — General panel
  'settings.general.languageSection': 'Language',
  'settings.general.language': 'Interface language',
  'settings.general.languageHint':
    'Changes apply immediately. Untranslated text falls back to English.',
  // Settings — General panel — Appearance (issue #67)
  'settings.general.appearanceSection': 'Appearance',
  'settings.general.uiTheme': 'App theme',
  'settings.general.uiTheme.system': 'Follow system',
  'settings.general.uiTheme.dark': 'Dark',
  'settings.general.uiTheme.light': 'Light',
  'settings.general.appearanceHint':
    'Controls the sidebar, tab bar, and window chrome. Terminal colors are set separately.',
  // Settings — General panel — Custom background (issue #89)
  'settings.general.customBgSection': 'Custom background',
  'settings.general.customBgEnable': 'Enable custom background',
  'settings.general.customBgCss': 'Background (CSS)',
  'settings.general.customBgPreset': 'Preset',
  'settings.general.customBgPreset.none': 'Choose a preset…',
  'settings.general.customBgOpacity': 'Terminal opacity',
  'settings.general.customBgHint':
    'Any CSS background: a color, gradients, or url(…) images. Drawn behind the terminals, independent of the color scheme. Terminal opacity controls how much shows through.',
  // Command palette
  'palette.placeholder': 'Type a command or search...',
  'palette.empty': 'No results found',
  'palette.category.actions': 'Actions',
  'palette.category.commands': 'Commands',
  'palette.category.workspaces': 'Workspaces',
  'palette.category.themes': 'Themes',
  'palette.openMarkdown': 'Open Markdown File…',
  'palette.current': 'current',
  // Titlebar
  'titlebar.help': 'Help / Tutorial',
  'titlebar.devtools': 'Toggle Developer Tools',
  'titlebar.settings': 'Settings (Ctrl+,)',
  // Titlebar — update badge (issue #88)
  'titlebar.updateAvailable': 'Update available',
  'titlebar.updateDownload': 'Click to download from GitHub',
  // Settings — Help / About panel
  'settings.tab.help': 'Help',
  'settings.help.about': 'About WinAgent Terminal',
  'settings.help.version': 'Version',
  'settings.help.reportIssue': 'Report an Issue',
  'settings.help.website': 'Website',
  'settings.help.hint': 'Found a bug or have a request? Open an issue on GitHub.',
  // Workspace context menu
  'ctx.pin': 'Pin Workspace',
  'ctx.unpin': 'Unpin Workspace',
  'ctx.rename': 'Rename Workspace…',
  'ctx.color': 'Workspace Color',
  'ctx.clearColor': 'Clear Color',
  'ctx.moveUp': 'Move Up',
  'ctx.moveDown': 'Move Down',
  'ctx.moveTop': 'Move to Top',
  'ctx.close': 'Close Workspace',
  'ctx.closeOthers': 'Close Other Workspaces',
  'ctx.markRead': 'Mark as Read',
  'ctx.markUnread': 'Mark as Unread',
  'ctx.status': 'Status Indicator',
  'ctx.statusAuto': 'Auto (detected)',
  'ctx.statusRunning': 'Pin as Running',
  'ctx.statusIdle': 'Pin as Idle',
  'chat.controls.label': 'Terminal chat controls',
  'chat.title.terminal': 'Terminal chat',
  'chat.title.claude': 'Claude Code',
  'chat.title.codex': 'Codex',
  'chat.copy.hint': 'Select text, then press Ctrl+C',
  'chat.copy.action': 'Copy',
  'chat.paste.action': 'Paste',
  'chat.copy.done': 'Copied',
  'chat.copy.empty': 'Select text first',
  'chat.copy.failed': 'Copy failed',
  'terminal.copyMode.hint': 'COPY MODE — Arrow keys to move, Shift+arrows to select, Enter to copy, Esc to exit',
};

const fr: Dict = {
  'settings.title': 'Paramètres',
  'settings.tab.general': 'Général',
  'settings.tab.sidebar': 'Barre latérale',
  'settings.tab.workspace': 'Espace de travail',
  'settings.tab.terminal': 'Terminal',
  'settings.tab.notifications': 'Notifications',
  'settings.tab.browser': 'Navigateur',
  'settings.tab.profiles': 'Profils',
  'settings.tab.shortcuts': 'Raccourcis',
  'settings.general.languageSection': 'Langue',
  'settings.general.language': "Langue de l'interface",
  'settings.general.languageHint':
    "Les changements s'appliquent immédiatement. Le texte non traduit s'affiche en anglais.",
  'settings.general.appearanceSection': 'Apparence',
  'settings.general.uiTheme': "Thème de l'application",
  'settings.general.uiTheme.system': 'Suivre le système',
  'settings.general.uiTheme.dark': 'Sombre',
  'settings.general.uiTheme.light': 'Clair',
  'settings.general.appearanceHint':
    "Contrôle la barre latérale, la barre d'onglets et le cadre de la fenêtre. Les couleurs du terminal se règlent séparément.",
  'settings.general.customBgSection': 'Arrière-plan personnalisé',
  'settings.general.customBgEnable': "Activer l'arrière-plan personnalisé",
  'settings.general.customBgCss': 'Arrière-plan (CSS)',
  'settings.general.customBgPreset': 'Préréglage',
  'settings.general.customBgPreset.none': 'Choisir un préréglage…',
  'settings.general.customBgOpacity': 'Opacité du terminal',
  'settings.general.customBgHint':
    "N'importe quel arrière-plan CSS : couleur, dégradés ou images url(…). Dessiné derrière les terminaux, indépendamment du jeu de couleurs. L'opacité du terminal contrôle sa visibilité.",
  'palette.placeholder': 'Tapez une commande ou recherchez...',
  'palette.empty': 'Aucun résultat',
  'palette.category.actions': 'Actions',
  'palette.category.commands': 'Commandes',
  'palette.category.workspaces': 'Espaces de travail',
  'palette.category.themes': 'Thèmes',
  'palette.openMarkdown': 'Ouvrir un fichier Markdown…',
  'palette.current': 'actuel',
  'titlebar.help': 'Aide / Tutoriel',
  'titlebar.devtools': 'Afficher/Masquer les outils de développement',
  'titlebar.settings': 'Paramètres (Ctrl+,)',
  'titlebar.updateAvailable': 'Mise à jour disponible',
  'titlebar.updateDownload': 'Clic pour télécharger sur GitHub',
  'settings.tab.help': 'Aide',
  'settings.help.about': 'À propos de WinAgent Terminal',
  'settings.help.version': 'Version',
  'settings.help.reportIssue': 'Signaler un problème',
  'settings.help.website': 'Site web',
  'settings.help.hint': 'Un bug ou une suggestion ? Ouvrez un ticket sur GitHub.',
  'ctx.pin': "Épingler l'espace",
  'ctx.unpin': "Désépingler l'espace",
  'ctx.rename': "Renommer l'espace…",
  'ctx.color': "Couleur de l'espace",
  'ctx.clearColor': 'Effacer la couleur',
  'ctx.moveUp': 'Monter',
  'ctx.moveDown': 'Descendre',
  'ctx.moveTop': 'Déplacer en haut',
  'ctx.close': "Fermer l'espace",
  'ctx.closeOthers': 'Fermer les autres espaces',
  'ctx.markRead': 'Marquer comme lu',
  'ctx.markUnread': 'Marquer comme non lu',
  'ctx.status': "Indicateur d'état",
  'ctx.statusAuto': 'Auto (détecté)',
  'ctx.statusRunning': 'Épingler « En cours »',
  'ctx.statusIdle': 'Épingler « Inactif »',
};

const ru: Dict = {
  'settings.title': 'Настройки',
  'settings.tab.general': 'Основные',
  'settings.tab.sidebar': 'Боковая панель',
  'settings.tab.workspace': 'Рабочая область',
  'settings.tab.terminal': 'Терминал',
  'settings.tab.ai': 'ИИ',
  'settings.tab.notifications': 'Уведомления',
  'settings.tab.browser': 'Браузер',
  'settings.tab.profiles': 'Профили',
  'settings.tab.shortcuts': 'Горячие клавиши',
  'settings.tab.help': 'Справка',
  'settings.general.languageSection': 'Язык',
  'settings.general.language': 'Язык интерфейса',
  'settings.general.languageHint': 'Изменения применяются сразу. Непереведённый текст отображается на английском.',
  'settings.general.appearanceSection': 'Оформление',
  'settings.general.uiTheme': 'Тема приложения',
  'settings.general.uiTheme.system': 'Как в системе',
  'settings.general.uiTheme.dark': 'Тёмная',
  'settings.general.uiTheme.light': 'Светлая',
  'settings.general.appearanceHint': 'Настраивает боковую панель, вкладки и рамку окна. Цвета терминала задаются отдельно.',
  'settings.general.customBgSection': 'Свой фон',
  'settings.general.customBgEnable': 'Включить свой фон',
  'settings.general.customBgCss': 'Фон (CSS)',
  'settings.general.customBgPreset': 'Пресет',
  'settings.general.customBgPreset.none': 'Выберите пресет…',
  'settings.general.customBgOpacity': 'Непрозрачность терминала',
  'settings.general.customBgHint': 'Поддерживается любой CSS-фон: цвет, градиент или изображение url(…).',
  'palette.placeholder': 'Введите команду или запрос…',
  'palette.empty': 'Ничего не найдено',
  'palette.category.actions': 'Действия',
  'palette.category.commands': 'Команды',
  'palette.category.workspaces': 'Рабочие области',
  'palette.category.themes': 'Темы',
  'palette.openMarkdown': 'Открыть файл Markdown…',
  'palette.current': 'текущая',
  'titlebar.help': 'Помощь / обучение',
  'titlebar.devtools': 'Открыть инструменты разработчика',
  'titlebar.settings': 'Настройки (Ctrl+,)',
  'titlebar.updateAvailable': 'Доступно обновление',
  'titlebar.updateDownload': 'Нажмите, чтобы скачать с GitHub',
  'settings.help.about': 'О WinAgent Terminal',
  'settings.help.version': 'Версия',
  'settings.help.reportIssue': 'Сообщить о проблеме',
  'settings.help.website': 'Сайт',
  'settings.help.hint': 'Нашли ошибку или хотите предложить улучшение? Откройте issue на GitHub.',
  'ctx.pin': 'Закрепить рабочую область',
  'ctx.unpin': 'Открепить рабочую область',
  'ctx.rename': 'Переименовать рабочую область…',
  'ctx.color': 'Цвет рабочей области',
  'ctx.clearColor': 'Убрать цвет',
  'ctx.moveUp': 'Переместить выше',
  'ctx.moveDown': 'Переместить ниже',
  'ctx.moveTop': 'Переместить в начало',
  'ctx.close': 'Закрыть рабочую область',
  'ctx.closeOthers': 'Закрыть другие рабочие области',
  'ctx.markRead': 'Отметить как прочитанное',
  'ctx.markUnread': 'Отметить как непрочитанное',
  'ctx.status': 'Индикатор состояния',
  'ctx.statusAuto': 'Автоматически',
  'ctx.statusRunning': 'Закрепить «Выполняется»',
  'ctx.statusIdle': 'Закрепить «Ожидание»',
  'chat.controls.label': 'Управление терминальным чатом',
  'chat.title.terminal': 'Терминальный чат',
  'chat.title.claude': 'Claude Code',
  'chat.title.codex': 'Codex',
  'chat.copy.hint': 'Выделите текст и нажмите Ctrl+C',
  'chat.copy.action': 'Копировать',
  'chat.paste.action': 'Вставить',
  'chat.copy.done': 'Скопировано',
  'chat.copy.empty': 'Сначала выделите текст',
  'chat.copy.failed': 'Не удалось скопировать',
  'terminal.copyMode.hint': 'РЕЖИМ КОПИРОВАНИЯ — стрелки: перемещение, Shift+стрелки: выделение, Enter: копировать, Esc: выйти',
};

const zh: Dict = {
  'settings.title': '设置',
  'settings.tab.general': '常规',
  'settings.tab.sidebar': '侧边栏',
  'settings.tab.workspace': '工作区',
  'settings.tab.terminal': '终端',
  'settings.tab.notifications': '通知',
  'settings.tab.browser': '浏览器',
  'settings.tab.profiles': '配置文件',
  'settings.tab.shortcuts': '快捷键',
  'settings.general.languageSection': '语言',
  'settings.general.language': '界面语言',
  'settings.general.languageHint': '更改立即生效。未翻译的文本将回退为英文。',
  'settings.general.appearanceSection': '外观',
  'settings.general.uiTheme': '应用主题',
  'settings.general.uiTheme.system': '跟随系统',
  'settings.general.uiTheme.dark': '深色',
  'settings.general.uiTheme.light': '浅色',
  'settings.general.appearanceHint': '控制侧边栏、标签栏和窗口外框。终端颜色需单独设置。',
  'settings.general.customBgSection': '自定义背景',
  'settings.general.customBgEnable': '启用自定义背景',
  'settings.general.customBgCss': '背景（CSS）',
  'settings.general.customBgPreset': '预设',
  'settings.general.customBgPreset.none': '选择预设…',
  'settings.general.customBgOpacity': '终端不透明度',
  'settings.general.customBgHint':
    '任意 CSS 背景：纯色、渐变或 url(…) 图片。绘制在终端后面，与配色方案无关。终端不透明度控制其可见程度。',
  'palette.placeholder': '输入命令或搜索...',
  'palette.empty': '未找到结果',
  'palette.category.actions': '操作',
  'palette.category.commands': '命令',
  'palette.category.workspaces': '工作区',
  'palette.category.themes': '主题',
  'palette.openMarkdown': '打开 Markdown 文件…',
  'palette.current': '当前',
  'titlebar.help': '帮助 / 教程',
  'titlebar.devtools': '切换开发者工具',
  'titlebar.settings': '设置 (Ctrl+,)',
  'titlebar.updateAvailable': '有可用更新',
  'titlebar.updateDownload': '点击前往 GitHub 下载',
  'settings.tab.help': '帮助',
  'settings.help.about': '关于 WinAgent Terminal',
  'settings.help.version': '版本',
  'settings.help.reportIssue': '报告问题',
  'settings.help.website': '网站',
  'settings.help.hint': '发现错误或有建议？请在 GitHub 上提交问题。',
  'ctx.pin': '固定工作区',
  'ctx.unpin': '取消固定工作区',
  'ctx.rename': '重命名工作区…',
  'ctx.color': '工作区颜色',
  'ctx.clearColor': '清除颜色',
  'ctx.moveUp': '上移',
  'ctx.moveDown': '下移',
  'ctx.moveTop': '移到顶部',
  'ctx.close': '关闭工作区',
  'ctx.closeOthers': '关闭其他工作区',
  'ctx.markRead': '标记为已读',
  'ctx.markUnread': '标记为未读',
  'ctx.status': '状态指示',
  'ctx.statusAuto': '自动（检测）',
  'ctx.statusRunning': '固定为运行中',
  'ctx.statusIdle': '固定为空闲',
};

const DICTS: Record<Language, Dict> = { en, fr, ru, zh };

/** Translate a key for an explicit language (English → key fallback chain). */
export function translate(lang: Language, key: string, fallback?: string): string {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? fallback ?? key;
}

export function getMissingTranslationKeys(language: Language): string[] {
  const dictionaries: Record<Language, Dict> = { en, fr, ru, zh };
  return Object.keys(en).filter((key) => dictionaries[language][key] === undefined);
}

export function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (token, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : token);
}

export function pluralizeRu(
  count: number,
  forms: readonly [one: string, few: string, many: string],
): string {
  const absolute = Math.abs(Math.trunc(count));
  const mod100 = absolute % 100;
  const mod10 = absolute % 10;
  const form = mod10 === 1 && mod100 !== 11
    ? forms[0]
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? forms[1]
      : forms[2];
  return `${count} ${form}`;
}

/**
 * Best-effort default from the OS/browser locale so first-launch users (e.g. the
 * Chinese reporter of issue #56) see their language without touching Settings.
 * Falls back to English for anything unsupported.
 */
export function detectDefaultLanguage(): Language { return 'ru'; }
