# ДЗ8. Доставка в облачный Kubernetes

Пайплайн booking-cloud.yml запускает тесты, параллельно собирает пять приложений и публикует в GHCR неизменяемые ссылки на образы. Зависимость deploy от image означает, что развёртывание начнётся только после всех пяти сборок. Сборки рассчитаны на Linux amd64.

В GitHub Environment course-cloud нужен секрет KUBE_CONFIG_DATA (base64-encoded kubeconfig для учебного namespace, права только на нужные ресурсы). В переменную COURSE_API_URL записывается адрес отдельного учебного Gateway. Для включения deploy задайте ENABLE_CLOUD_DEPLOY=true на уровне репозитория. GHCR разрешает workflow публиковать пакеты, кластеру требуется доступ на чтение. Первичная настройка namespace описана в ЛР7.

Сохранить run URL, Git SHA и artifact cloud-evidence: в него входят images.json, release.yaml, cluster.txt, revision.txt и внешний ответ ready.json. Успешная сборка без deploy не подтверждает доставку. Откат: применить сохранённый release.yaml предыдущего успешного запуска и повторить проверки статуса и готовности.

Для облака с закрытым Kubernetes API или ограниченным ingress используйте выделенный runner с доступом к учебной сети либо заранее разрешённый сетевой маршрут. Стандартный GitHub-hosted runner должен иметь доступ к API кластера и к COURSE_API_URL.
