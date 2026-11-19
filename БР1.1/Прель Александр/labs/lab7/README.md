# ЛР7. Облачная оркестрация

Целевое окружение: выделенный учебный Kubernetes с Linux amd64, default StorageClass для RWO, поддержкой LoadBalancer и Metrics Server. Облачная сеть должна разрешать вход на Gateway только от учебных клиентов. Администратор создаёт namespace и случайные секреты один раз командой ./init-cluster.sh COURSE_CONTEXT. При закрытых образах GHCR добавьте imagePullSecret для default ServiceAccount в namespace booking-sem2.

Пять образов собираются из production Dockerfile и публикуются по digest. Для ручного применения скачайте пять artifacts digest-* успешного workflow, распакуйте JSON в каталог digests и объедините командой `jq -s add digests/*.json > images.json`. Получится объект с ключами accounts, catalog, bookings, notifications, gateway и значениями registry/path@sha256:.... Проверенная сборка f3712a8 уже зафиксирована в [images-f3712a8.json](../../evidence/images-f3712a8.json) и [release-f3712a8.yaml](../../evidence/release-f3712a8.yaml). Манифест собран, но в облако пока не применён. В ЛР7 шаги можно выполнить вручную, ДЗ8 автоматизирует те же шаги.

~~~bash
./render.sh /absolute/path/images.json > /tmp/booking-release.yaml
kubectl --context COURSE_CONTEXT -n booking-sem2 apply -f /tmp/booking-release.yaml
kubectl --context COURSE_CONTEXT -n booking-sem2 get statefulsets,deployments,pods,pvc,svc,hpa
kubectl --context COURSE_CONTEXT -n booking-sem2 rollout status deployment/gateway
~~~

Дождитесь готовности пяти StatefulSet, двух Gateway, пяти PVC в Bound и внешнего адреса. Проверьте /ready и внешний Postman-сценарий регистрации и бронирования. В приложении сохраняются внутренние DNS-имена; включение enableServiceLinks=false исключает коллизию портов приложения с переменными, которые Kubernetes мог бы добавить автоматически.
