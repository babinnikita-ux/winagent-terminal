import React, { useState } from 'react';
import { APP_CONFIG } from '../../../shared/app-config';
import '../../styles/tutorial.css';

interface TutorialProps {
  onClose: () => void;
}

interface Step {
  title: string;
  body: string;
  shortcuts: string[];
}

const STEPS: Step[] = [
  {
    title: `Добро пожаловать в ${APP_CONFIG.productName}`,
    body: 'WinAgent Terminal — терминальный мультиплексор для параллельной работы с AI. Коротко покажем основные возможности.',
    shortcuts: [],
  },
  {
    title: 'Рабочие области',
    body: 'Слева находятся независимые рабочие области со своими терминалами и раскладками. Создайте новую через Ctrl+N, переименуйте двойным щелчком.',
    shortcuts: ['Ctrl+N', 'Ctrl+B'],
  },
  {
    title: 'Разделение панелей',
    body: 'Разделяйте терминалы по горизонтали или вертикали. Размер меняется перетаскиванием границы, выбранная панель разворачивается через Ctrl+Shift+Enter.',
    shortcuts: ['Ctrl+D', 'Ctrl+Shift+D'],
  },
  {
    title: 'Вкладки',
    body: 'В каждой панели могут быть терминалы, браузер и Markdown. Перетаскивайте вкладки между панелями и создавайте новые через Ctrl+T.',
    shortcuts: ['Ctrl+T', 'Ctrl+W'],
  },
  {
    title: 'Панель браузера',
    body: 'Справа можно открыть результат работы агента или localhost. Панель переключается сочетанием Ctrl+Shift+I и изолирована от привилегий Electron.',
    shortcuts: ['Ctrl+Shift+I'],
  },
  {
    title: 'Требует внимания',
    body: 'Когда агенту нужен ответ, рабочая область получает индикатор и уведомление Windows. К последнему непрочитанному событию ведёт Ctrl+Shift+U.',
    shortcuts: ['Ctrl+Shift+U'],
  },
  {
    title: 'Всё готово',
    body: 'Эту справку можно снова открыть кнопкой «?». Полный список сочетаний находится в настройках, глобальная палитра команд открывается через Ctrl+Shift+P.',
    shortcuts: [],
  },
];

export default function Tutorial({ onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) setCurrentStep((s) => s + 1);
  };

  const handlePrevious = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="tutorial-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="tutorial-card">
        {!isLast && (
          <button className="tutorial-skip" onClick={onClose}>
            Пропустить
          </button>
        )}

        <div className="tutorial-dots">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`tutorial-dot${idx === currentStep ? ' tutorial-dot--active' : ''}`}
            />
          ))}
        </div>

        <h2 className="tutorial-title">{step.title}</h2>
        <p className="tutorial-body">{step.body}</p>

        {step.shortcuts.length > 0 && (
          <div className="tutorial-shortcuts">
            {step.shortcuts.map((shortcut) => (
              <span key={shortcut} className="tutorial-shortcut">
                {shortcut}
              </span>
            ))}
          </div>
        )}

        <div className="tutorial-nav">
          <button
            className="tutorial-btn tutorial-btn--secondary"
            onClick={handlePrevious}
            disabled={isFirst}
          >
            Назад
          </button>

          <span className="tutorial-step-counter">
            {currentStep + 1} / {STEPS.length}
          </span>

          {isLast ? (
            <button className="tutorial-btn tutorial-btn--primary" onClick={onClose}>
              Начать работу
            </button>
          ) : (
            <button className="tutorial-btn tutorial-btn--primary" onClick={handleNext}>
              Далее
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
