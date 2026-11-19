# ДЗ6. Доставка новой версии на учебную ВМ

Workflow .github/workflows/backend-ci-cd.yml запускается при изменении приложения или конфигурации в semester-2-practice. На runner он проверяет TypeScript, HTTP, RabbitMQ, Compose и Postman. После успешных проверок деплой упаковывает конкретный Git SHA, передаёт архив по SSH, собирает образы и проверяет /ready. ВМ предварительно готовится средствами ЛР4 или ЛР5.

Переменная COURSE_VM_API_URL хранит адрес, доступный с runner. После деплоя workflow сохраняет внешний ready.json и revision.txt в vm-evidence. Для окружения production задаются DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH, DEPLOY_SSH_KEY, DEPLOY_KNOWN_HOSTS и при необходимости DEPLOY_PORT. Ключ сервера для known_hosts сверяют на учебной ВМ. Путь установки /opt/itmo-booking. Переменная репозитория ENABLE_REMOTE_DEPLOY=true включает job доставки. Секреты задаются через GitHub Environments.

Проверка перед публикацией: node --test tests/workflow.test.cjs. Для приёмки нужен успешный запуск по push, SHA на ВМ и внешний GET /ready. Сохранённый TEST_RESULTS.md описывает исходный локальный прогон сентября.
