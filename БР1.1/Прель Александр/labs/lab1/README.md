# ЛР1: REST API сервиса бронирования столиков

Учебная реализация REST API по OpenAPI-схеме из ДЗ2. Проект использует Express, TypeScript, TypeORM и SQLite для локального запуска без отдельной настройки СУБД.

## Запуск

```bash
npm install
npm run dev
```

API стартует на `http://localhost:8080`. При первом запуске TypeORM создает SQLite-базу и наполняет ее демонстрационными ресторанами, кухнями, меню, фотографиями, отзывами и столиками.

## Проверка

```bash
npm run typecheck
npm run build
```

## Основные endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PATCH /users/me`
- `GET /restaurants`
- `GET /restaurants/{restaurantId}`
- `GET /restaurants/{restaurantId}/menu`
- `GET /restaurants/{restaurantId}/reviews`
- `POST /restaurants/{restaurantId}/reviews`
- `GET /restaurants/{restaurantId}/photos`
- `GET /cuisines`
- `GET /reservations/me`
- `POST /reservations`
- `GET /reservations/{reservationId}`
- `PATCH /reservations/{reservationId}/cancel`
