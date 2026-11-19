# ЛР5. Автоматическая настройка Ubuntu 24.04

На управляющей машине нужны Git, SSH, Python и ansible-core. Создайте локальную копию inventory.example.yml за пределами Git, укажите выделенную ВМ и пользователя с sudo. Доступ к закрытому ключу остаётся через SSH-agent. Управляющая машина должна видеть полный Git checkout с зафиксированной версией семестра.

~~~bash
ansible-playbook -i /path/to/course-inventory.yml site.yml --syntax-check
ansible-playbook -i /path/to/course-inventory.yml site.yml --diff
ansible-playbook -i /path/to/course-inventory.yml site.yml --diff
~~~

Playbook устанавливает доверенный ключ и репозиторий Docker, системные пакеты, права пользователя, постоянные секреты, внешний proxy и релиз из текущего HEAD. Повторный прогон сверяет фактическую версию и готовность. Сохранить обе строки PLAY RECAP, активный Git SHA и внешний ответ /ready. Динамические значения секретов исключены из выводимых параметров.
