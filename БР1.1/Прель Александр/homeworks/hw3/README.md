# ДЗ3: тестирование API средствами Postman

## Состав

- `restaurant-booking-dz3.postman_collection.json` - Postman-коллекция с комплексным сценарием и тестами.
- `restaurant-booking-local.postman_environment.json` - окружение для локального запуска API.
- `Прель Александр БР 1.1 ДЗ 3.pdf` - отчет по домашней работе.

## Запуск

1. Запустить API из `labs/lab1`:

```bash
npm install
npm run dev
```

2. Импортировать в Postman коллекцию и окружение.
3. Выбрать окружение `Restaurant Booking API - Local`.
4. Запустить коллекцию через Collection Runner.

Сценарий генерирует уникальный email при каждом запуске и автоматически сохраняет JWT, ID ресторана и ID бронирования в переменные коллекции.
