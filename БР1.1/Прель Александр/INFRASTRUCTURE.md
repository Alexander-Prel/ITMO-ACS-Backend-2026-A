# Что осталось подключить для сдачи

GitHub подключён: ветка `semester-2-practice`, Actions и публикация образов GHCR работают. Учебная ВМ и облачный кластер пока не выделены. Это препятствует постоянному внешнему доступу, SSH-деплою, облачному rollout и HPA под нагрузкой. Ansible и мониторинг уже проверены на временной Ubuntu-ВМ GitHub Actions; протоколы сохранены в evidence.

## Учебная ВМ для ЛР4, ДЗ6, ЛР5 и ЛР6

- Отдельная Ubuntu 24.04 amd64 с SSH и пользователем с sudo. Проектный размер для приложения и мониторинга: 4 vCPU, 8 GiB RAM, от 20 GiB диска; фактическую квоту можно уточнить после измерений.
- Входной SSH и HTTP 8080 должны быть доступны с адресов учебного клиента и CI runner. Порты БД, RabbitMQ и Grafana наружу открывать не требуется.
- ВМ должна скачивать пакеты Ubuntu/Docker и контейнеры. Стенд создаёт собственные данные и тома, его не следует совмещать с рабочей системой.
- Первичная установка — [ЛР4](labs/lab4/README.md), автоматическая — [ЛР5](labs/lab5/README.md). Для ЛР5 нужны два PLAY RECAP и проверка повторного применения.

В GitHub Environment `production` задаются secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH=/opt/itmo-booking`, `DEPLOY_PORT`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`; variable `COURSE_VM_API_URL` указывает на внешний HTTP endpoint. После первичной проверки стенда repository variable `ENABLE_REMOTE_DEPLOY=true` включает доставку по push. Приватные ключи и пароли хранятся в Secrets, не в отчётах или Git.

## Облачный кластер для ЛР7, ДЗ8 и ЛР8

- Учебный Kubernetes с Linux amd64; проект предусматривает два worker по 2 vCPU / 4 GiB RAM. Размер — исходное предположение ДЗ7.
- Нужны default StorageClass с RWO-дисками, работающий Metrics API, поддержка Service LoadBalancer и исходящий доступ к GHCR.
- Для приложения предусмотрено 6 GiB PVC суммарно: четыре базы по 1 GiB и RabbitMQ 2 GiB. Хранение метрик и логов оценивается отдельно по доступной квоте.
- Администратор однократно готовит namespace `booking-sem2` через [init-cluster.sh](labs/lab7/init-cluster.sh). Секреты приложения не пересоздаются при обычном deploy. Для закрытых пакетов GHCR нужен imagePullSecret с правом чтения.
- В Environment `course-cloud`: secret `KUBE_CONFIG_DATA` и variable `COURSE_API_URL`. Repository variable `ENABLE_CLOUD_DEPLOY=true` включает deploy. CI должен иметь сетевой доступ к API кластера и Gateway; для закрытого API требуется runner в учебной сети.
- [images-f3712a8.json](evidence/images-f3712a8.json) и [release-f3712a8.yaml](evidence/release-f3712a8.yaml) содержат уже собранные образы. Применение и проверка описаны в [ЛР7](labs/lab7/README.md), измерения и сравнение до/после — в [ЛР8](labs/lab8/README.md).

## Сообщение преподавателю, если нужна учебная квота

> Добрый день! Для практических работ второго семестра по бэк-энд разработке подготовил проект бронирования столиков: Docker Compose, Ansible, CI/CD, Grafana, Kubernetes и сценарии k6. Своей удалённой инфраструктуры пока нет. В README курса указана возможность обратиться за вычислительными ресурсами. Можно ли получить учебную ВМ и доступ к Kubernetes либо подходящую облачную квоту для проверки деплоя, мониторинга и HPA? Технический дизайн рассчитан на Ubuntu 24.04 и два Kubernetes worker с Linux amd64; готов адаптировать размер под доступную квоту. Прель Александр, БР1.1.

Сообщение подготовлено для самостоятельной отправки; преподавателю оно не отправлялось. Платные ресурсы не создавались.
