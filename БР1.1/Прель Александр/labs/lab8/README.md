# ЛР8. Нагрузочное испытание и HPA

Подготовьте ЛР7 и работающий kubectl top pods. Установите kube-prometheus-stack в namespace monitoring с monitoring-values.yaml и примените dashboard.yaml. Grafana загружает дашборд по метке grafana_dashboard. Источник Prometheus должен иметь UID prometheus. Убедитесь, что Metrics Server отдаёт CPU для Gateway.

~~~bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install booking-obs prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f monitoring-values.yaml
kubectl apply -f dashboard.yaml
kubectl -n monitoring get svc
~~~

Пробросьте порт 9090 сервиса Prometheus в локальную среду генератора. Для отправки статистики k6 задайте K6_PROMETHEUS_RW_SERVER_URL=http://127.0.0.1:9090/api/v1/write. Доступ к этому endpoint нужен только генератору. В другом терминале:

~~~bash
export BASE_URL=https://YOUR-COURSE-GATEWAY
export K6_PROMETHEUS_RW_SERVER_URL=http://127.0.0.1:9090/api/v1/write
PROFILE=baseline ./measure.sh COURSE_CONTEXT /tmp/booking-baseline
PROFILE=scale ./measure.sh COURSE_CONTEXT /tmp/booking-before
~~~

Сравните timestamps в replicas.csv, cpu_pct, desired и available с p95, throttling и ошибками. Если HPA сохраняет две реплики, укажите наблюдаемый CPU и проверьте API метрик; эксперимент с фактическим увеличением числа подов остаётся открытым. Для тюнинга изменяйте один параметр с указанием причины. Например, если CPU throttling подтверждён, сравните исходный предел 1 CPU и обоснованное новое значение при неизменном запросе CPU. Команда kubectl set resources deployment/gateway --requests=cpu=100m,memory=96Mi --limits=cpu=1500m,memory=256Mi -n booking-sem2 иллюстрирует такой эксперимент. Проверьте rollout, повторите профиль scale с новым каталогом результатов; лучшую конфигурацию зафиксируйте в lab7/gateway.yaml. Не выдавайте пример параметров за измеренную оптимизацию.

Для отчёта нужны до/после: окно времени, фактические RPS, p95, p99, ошибки и dropped_iterations, число реплик, скриншот Grafana, описание узкого места и вывод о влиянии изменения. Скрипт сохраняет summary k6 даже при нарушении SLO и возвращает соответствующий код завершения.
