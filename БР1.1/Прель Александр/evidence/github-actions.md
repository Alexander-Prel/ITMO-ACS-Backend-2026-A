# Подтверждённые запуски GitHub Actions

Все приведённые прогоны выполнены на GitHub-hosted Ubuntu 24.04. Временная машина удаляется после workflow. Облачный deploy-job ожидает предоставления учебного кластера, SSH deploy-job ожидает учебную ВМ.

| Проверка | Фактический результат | Прогон |
| --- | --- | --- |
| Проверка документации | MkDocs --strict, OpenAPI, ссылки страниц, Ansible --syntax-check, 7 тестов workflow прошли | [Verify semester coursework #1](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44511000128) |
| Обновление зависимостей | 28 тестов прошли; npm audit сообщил 0 уязвимостей | [Refresh coursework dependencies](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44512664471) |
| Ansible: установка и повторное применение | Первый PLAY RECAP ok=25, changed=15, failed=0; второй ok=17, changed=0, failed=0; Nginx /ready проверен | [Verify Ansible on Ubuntu VM](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44516380844) |
| Мониторинг Ubuntu через Grafana | CPU/RAM/disk/RX/TX; 5/5 healthy; логи 7/7 контейнеров приложения, 21 поток Loki | [Проверка Grafana](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44516380844/job/135533326090) |
| TypeScript и HTTP после обновления | 28/28, аудит production-зависимостей — 0 | [Backend CI/CD #2](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44512913069) |
| RabbitMQ после обновления | 10/10 сценариев с настоящим брокером, включая отказ и восстановление | [RabbitMQ job](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44512913069/job/135521659204) |
| Сборка пяти контейнеров после обновления | Accounts, Catalog, Bookings, Notifications и Gateway опубликованы в GHCR; deploy пропущен до подключения кластера | [Booking cloud delivery #2](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44512913050) |

Исходный Backend CI/CD #1 остановился на npm audit. Lockfile обновлён совместимыми версиями, затем проверки пройдены повторно. TypeORM сохранён в ветке 0.3, зависимость glob обновлена через overrides до 14.0.6. Фиксируются результаты конкретного графа зависимостей на дату запуска.

Сборка образов относится к коммиту `f3712a87cb9c01394dd52beaa8681aa7b939afa5`. Неизменяемые ссылки из шагов Record image digest сохранены в [images-f3712a8.json](images-f3712a8.json). Из них локально собран [release-f3712a8.yaml](release-f3712a8.yaml); этот файл ещё не применён к кластеру.

В Backend CI/CD #2 медленная первоначальная загрузка RabbitMQ превысила общий таймаут подготовки стенда. Восемь Compose-тестов не выполнились, этот прогон не является доказательством их успешности. В CI скачивание вынесено перед тестами; этапы сборки и проверки разделены и ограничены по времени.
