# Telegram Bot (Asterios KM)

## Быстрый старт в Docker

1. Скопируйте пример конфига и задайте реальные значения по необходимости:
   ```powershell
   Copy-Item config.example.toml config.toml
   Copy-Item env.example .env
   ```
   В `.env` укажите `TELEGRAM_TOKEN`, а `config.toml` содержит идентификаторы чатов и ссылки RSS.
2. Соберите и запустите контейнер:
   ```powershell
   docker compose build
   docker compose up -d
   ```
3. Логи:
   ```powershell
   docker compose logs -f
   ```
4. Остановка:
   ```powershell
   docker compose down
   ```

> Хотите хранить конфиг в другом месте — задайте `ASTERIOS_CONFIG_PATH` перед запуском.

## Локальный запуск (без Docker)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:TELEGRAM_TOKEN="ваш_токен"
python app.py
```

## Тестирование

```powershell
pip install -r requirements-dev.txt
pytest
```

## Что нового

- Конфигурация вынесена в `config.toml`, поддерживается выбор имени переменной окружения для токена.
- Состояние бота (текущие напоминания) сохраняется в `data/state.json`.
- Расписание формируется из таблицы правил и удобнее расширяется.
- Анекдоты хранятся в `bot/resources/jokes.txt` и подгружаются при старте.
- Добавлен модульный код (`bot/`), упрощающий тестирование и поддержку.
