# Подтверждённые запуски GitHub Actions

Все прогоны выполнены на GitHub-hosted Ubuntu 24.04. Временная машина удаляется после workflow. SSH и cloud deploy-jobs пропущены до подключения учебной ВМ и кластера. Успешный CI не подтверждает внешний SSH-деплой или облачный rollout.

| Проверка | Фактический результат | Источник |
| --- | --- | --- |
| Полный Backend CI/CD | TypeScript/build, 28/28 HTTP, npm audit production: 0 | [run 44517314031](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44517314031) |
| RabbitMQ | 10/10 сценариев с настоящим брокером, отказом и восстановлением | [job](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44517314031/job/135536821224) |
| Docker Compose | 8/8: изоляция, конкурентное бронирование, перезапуск процессов, сохранность БД, outbox и брокер | [job](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44517314031/job/135537121183) |
| Nginx и Postman | 3/3 теста, smoke, 29 запросов и 117/117 утверждений | [job](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44517314031/job/135537121183) |
| Ansible и повторный запуск | Первый PLAY RECAP ok=25, changed=15, failed=0; второй ok=17, changed=0, failed=0; Nginx /ready проверен | [повтор после исправления сборки](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44517314412); [сохранённый протокол](ansible-run.json) |
| Grafana на Ubuntu | Реальные CPU/RAM/disk/RX/TX; 5/5 healthy; логи 7/7 контейнеров приложения | [измерения для PDF](monitor-evidence.json); [исходный run измерений](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44516380844); повторён также в полном Backend CI/CD |
| Документация и конфигурации | MkDocs --strict, OpenAPI, ссылки, Ansible --syntax-check, 7 тестов workflow | [Verify semester coursework](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44516380838) |
| Сборка и публикация образов | Accounts, Catalog, Bookings, Notifications и Gateway опубликованы в GHCR; deploy пропущен | [Booking cloud delivery](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44512913050) |

Итоговая проверенная ревизия конфигурации VM/CI: `ba82a4af2d7af4e792435a1ba7ff5a377f361c83`. Машиночитаемый [backend-final.json](backend-final.json) и выдержка [backend-ci.txt](backend-ci.txt) сохраняют результаты после истечения срока хранения artifacts.

В отчёте ЛР6 приведён снимок 19.11.2026 11:39:39 UTC из run 44516380844, revision `13dc98f96fc2453bc1c5f62e956e5ba92df878f1`. Повторные прогоны 44517314412 и 44517314031 также успешно проверили те же панели, health и логи. Значения относятся ко всей временной ВМ после установки; нагрузочный эксперимент ЛР8 ещё не проведён.

Образы относятся к коммиту `f3712a87cb9c01394dd52beaa8681aa7b939afa5`. После него код сервисов и Dockerfile не менялся. Неизменяемые ссылки из шагов Record image digest сохранены в [images-f3712a8.json](images-f3712a8.json). Из них собран [release-f3712a8.yaml](release-f3712a8.yaml); он ещё не применён к кластеру.

До итогового успешного прогона исправлены устаревшие зависимости, загрузка RabbitMQ внутри таймаута подготовки тестов и рабочий каталог сборки общих Dockerfile. Ранние неуспешные/отменённые runs не являются доказательством сдачи; используйте ссылки из таблицы. TypeORM сохранён в ветке 0.3, glob обновлён через overrides до 14.0.6.
