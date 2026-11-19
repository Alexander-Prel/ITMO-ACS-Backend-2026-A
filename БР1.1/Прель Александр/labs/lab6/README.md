# ЛР6. Метрики, доступность и логи на ВМ

Предварительно поднимите ЛР4. Скрипт start.sh читает имя существующей сети, определяет адрес моста Docker и запускает шесть компонентов мониторинга с отдельными томами. На ВМ ожидается стандартный json-file logging driver и каталог /var/lib/docker/containers. Node Exporter читает host PID, rootfs и сеть ВМ, слушает только адрес docker0. Blackbox опрашивает пять адресов каждые 10 секунд. Promtail передаёт в Loki текущие журналы всех Docker-контейнеров с json-file, включая компоненты мониторинга.

~~~bash
read -rs -p 'Grafana password: ' GRAFANA_PASSWORD; export GRAFANA_PASSWORD
./start.sh
# На клиенте:
ssh -L 3300:127.0.0.1:3300 deploy@COURSE_VM
~~~

Откройте http://127.0.0.1:3300/d/booking-vm после входа как admin. Для доказательства сохраните панель CPU, RAM, диска и сети, пять значений health и строки логов за одно время. Получить соответствие container ID и имени можно через docker ps --no-trunc. Файл grafana/dashboards/booking.json добавляется провайдером автоматически.

Проверено на временной Ubuntu-ВМ: [GitHub Actions run 44516380844](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/actions/runs/44516380844). Скрипт verify.cjs получил реальные данные всех ресурсных панелей через Grafana, 5/5 healthy, логи 7/7 контейнеров приложения и 21 поток Loki суммарно. [Измерения и запросы](../../evidence/monitor-evidence.json) сохранены 19.11.2026 в 11:39:39 UTC. Снимок сделан после настройки стенда и включает потребление всей ВМ; нагрузочный эксперимент проводится отдельно в ЛР8.
