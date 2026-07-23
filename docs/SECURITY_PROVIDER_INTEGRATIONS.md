# Безопасность интеграций провайдеров

Renderer вызывает строго ограниченные `providerUsage.get`, `refresh` и `onUpdate`. Main process проверяет наличие CLI в дочернем процессе без shell, ограничивает проверку тремя секундами и не возвращает stdout. Bridge Claude принимает только rate-limit JSON и не читает credential stores.
