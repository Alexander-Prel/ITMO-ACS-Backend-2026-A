# Результаты проверки ДЗ6

Дата: 10.09.2026. macOS arm64, Node.js v24.14.0, npm 11.9.0, Docker Engine 29.7.2, Docker Compose 5.5.1. Репозиторий: `/Users/aleksandrprel/back/ITMO-ACS-Backend-2026-A`; ветка `codex/local-setup`; commit `922eba1d199d52bc47b3fd21547cc29a9250afac`.

Commit, push, pull request, GitHub Environment, secrets и удалённый сервер не создавались. Реальный GitHub Actions run и deployment не подтверждены.

## Статическая проверка

| Проверка | Результат |
| --- | --- |
| Ruby/Psych parse `.github/workflows/backend-ci-cd.yml` | YAML syntax OK |
| `bash -n scripts/remote-deploy.sh` | exit 0 |
| `node --check` для CJS-скриптов/теста | exit 0 |
| `npm run validate` | Workflow structure OK; remote shell syntax OK |
| `npm test` | 7/7, 0 failed, 121 мс после регрессионных исправлений |
| `git diff --check` | exit 0 |

Семь тестов подтвердили: YAML/Bash синтаксис; наличие locked install, typecheck, build, audit и всех групп тестов; порядок job; совпадение локальной последовательности с workflow; deploy только для push/main/enable-variable; environment `production`; наличие `known_hosts`; отсутствие `pull_request_target` и `StrictHostKeyChecking=no`; использование только официальных actions с 40-символьными SHA; нормализацию deploy-пути и диапазон порта 1-65535.

## Полный локальный CI

Команда: `npm run test:local-ci`. Она завершилась exit 0.

| Этап | Фактический итог |
| --- | --- |
| `npm ci --include=dev` | 247 пакетов, audit 0; lockfile не обновлялся |
| Typecheck / build | exit 0 / exit 0 |
| ЛР2 HTTP + validation + network config | 28/28, 0 failed, 4,96 с |
| Production audit | 0 известных уязвимостей |
| RabbitMQ | 10/10, 0 failed, 16,62 с |
| ЛР3 Compose | 8/8, 0 failed, 67,01 с |
| ЛР4 deployment | 3/3, 0 failed, 44,02 с |
| ЛР4 smoke | health, ready, каталог, auth, профиль, бронь, отмена, 2 уведомления |
| Newman | 29/29 запросов, 117/117 assertions, 0 failed, 0,80 с |

Основные стенды ЛР3 (`8090`) и ЛР4 (`8200`) остались работать. Тесты создавали отдельные временные Compose-проекты и удаляли только свои ресурсы.

## Регрессионные исправления

1. Тест аварийного рестарта Bookings теперь отдельно допускает только ожидаемый exit-код Docker `137` от команды, которая посылает `SIGKILL` основному Node.js-процессу. Любой другой ненулевой код остаётся ошибкой. После изменения выполнены три прямых полных прогона ЛР3 и ещё один внутри `test:local-ci`: все четыре завершились 8/8.
2. `test:local-ci` теперь запускает `npm run setup` до `config:check` для ЛР3 и ЛР4. Для ЛР4 порядок совпадает с workflow: setup, config, build, start, tests, smoke, Postman. Перед RabbitMQ job повторяется `npm ci`, как на отдельном чистом runner.
3. Remote deploy отклоняет относительные, корневые, повторно разделённые и завершающиеся пути, а также сегменты `.` и `..`. `PUBLIC_PORT` допускается только от 1 до 65535. Те же ограничения применены в workflow до SSH.

## Предупреждения и ограничения

- `npm ci` вывел нефатальные upstream-предупреждения о `prebuild-install@7.1.3` и `glob@10.5.0`; audit при этом 0.
- Локальный macOS/Docker прогон не доказывает, что GitHub Actions Ubuntu runner пройдёт без отличий.
- Без фактического SSH-сервера не проверены права, передача архива, сборка на Linux-host и readiness после deploy.
- В ЛР2 нет lint-скрипта. Этапы typecheck/build/test прошли, но lint не запускался.

Принятие работы преподавателем не подтверждено.
