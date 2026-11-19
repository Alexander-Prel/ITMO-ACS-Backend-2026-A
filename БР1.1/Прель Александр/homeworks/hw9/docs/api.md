# API и сценарий гостя

1. Импортируйте [коллекцию Postman](downloads/restaurant-booking-dz3.postman_collection.json) и [окружение](downloads/restaurant-booking-local.postman_environment.json). В окружении задайте фактический адрес стенда в переменной baseUrl.
2. Запустите коллекцию с первого запроса. Регистрация создаёт тестового пользователя, вход выдаёт Bearer-токен, затем сценарий находит ресторан, проверяет детали и меню, создаёт и отменяет бронь. Запускайте сценарий на учебных данных.
3. Для ручной проверки отправьте GET /restaurants?sort_by=rating&sort_order=desc. Поле items содержит рестораны, pagination — номер и размер страницы. Фильтр name ищет часть названия без учёта регистра. Для сортировки по цене задайте sort_by=price_category.
4. Для приватных запросов передавайте Authorization: Bearer с токеном из ответа входа. POST /reservations принимает restaurantId, reservationDate, startTime, endTime и guestsCount. При пересечении с занятой бронью сервис может вернуть 409. PATCH /reservations/{reservationId}/cancel отменяет собственную активную бронь.
5. GET /notifications/me возвращает события текущего пользователя. Обработка асинхронная, поэтому сразу после создания брони уведомление может ещё не появиться.

[Контракт Gateway для Swagger Editor или Swagger UI](downloads/openapi.json) · [Внутренние методы сервисов](downloads/internal.json)

**Ошибки.** 400 означает некорректные параметры, 401 — отсутствующий или просроченный токен, 403 — обращение к чужой записи, 404 — неизвестный ресурс. При 503 проверьте зависимости через GET /ready.
