"""Render course reports from the versioned implementation notes and test evidence."""
import re
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, KeepTogether
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

root = Path(__file__).resolve().parent
for regular,bold in [
    ('/System/Library/Fonts/Supplemental/Times New Roman.ttf','/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf'),
    ('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf')]:
    if Path(regular).exists() and Path(bold).exists():break
pdfmetrics.registerFont(TTFont('Course',regular))
pdfmetrics.registerFont(TTFont('CourseBold',bold))
pdfmetrics.registerFontFamily('Course',normal='Course',bold='CourseBold')
navy=colors.HexColor('#16344a')
muted=colors.HexColor('#52616b')
def style(name,size,lead,**kw):
    return ParagraphStyle(name,fontName=kw.pop('fontName','Course'),fontSize=size,leading=lead,**kw)
body=style('Body',11,14.2,spaceAfter=5)
heading=style('H',15,17,fontName='CourseBold',textColor=navy,spaceAfter=6,spaceBefore=8,keepWithNext=True)
sub=style('Sub',12,15,fontName='CourseBold',spaceBefore=5,spaceAfter=5,keepWithNext=True)
title=style('Title',22,28,alignment=TA_CENTER,fontName='CourseBold',textColor=navy)
center=style('Center',13,18,alignment=TA_CENTER)
right=style('Right',12,17,alignment=TA_RIGHT)
small=style('Small',9,12,spaceAfter=4)
cell=style('Cell',9,12)
code_style=style('Code',9,12,leftIndent=9,spaceAfter=2,textColor=navy)
W=A4[0]-44*mm
course='https://github.com/kantegory/ITMO-ACS-Backend-2026-A/blob/cf6ff89837eab1aefba01a59862af6a39dd0a603/README.md'
template='https://docs.google.com/document/d/1aAUawxv6_5k_Na7bLqrfUFANodyl89uPHXY4IKXS8WE/edit'
def par(t,st=body):
    val=escape(t)
    val=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',val)
    val=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',r'<link color="#245d83" href="\2">\1</link>',val)
    val=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'\1 (\2)',val)
    return Paragraph(val.replace('\n','<br/>'),st)
specs=[
('labs/lab4','ЛР4','Ручное развёртывание на удалённом сервере','Подготовить удалённый сервер, развернуть приложение и предоставить доступ через обратный прокси Nginx.','На Ubuntu 24.04 прошли 3/3 проверки Nginx, smoke и 29 запросов Postman со 117/117 утверждениями. Повторное развёртывание сохранило данные приложения.','Развёртывание через Nginx проверено на временной Ubuntu-ВМ. Для завершения ЛР4 требуются ручной запуск на выделенном сервере и запрос к нему с внешней машины.'),
('homeworks/hw6','ДЗ6','Автоматическое развёртывание на ВМ','Настроить автодеплой по изменению выбранной ветки репозитория.','Реальный GitHub Actions run 44517314031 по push завершён успешно: 28 HTTP-тестов, 10 сценариев RabbitMQ, 8 Compose и 3 Nginx; Postman — 117/117. npm audit: 0. Семь проверок конфигурации CI также прошли.','Пайплайн реально собирает и проверяет приложение. SSH deploy-job пропущен, поскольку учебная ВМ не настроена. Для завершения ДЗ6 остаются доставка релиза по SSH и проверка внешнего адреса.'),
('labs/lab5','ЛР5','Автоматизация настройки сервера в Ansible','Автоматизировать установку пакетов, настройку окружения и запуск сервисов на виртуальной машине.','На Ubuntu 24.04 выполнены два playbook: первый ok=25, changed=15, failed=0; второй ok=17, changed=0, failed=0. Nginx вернул status=ok и четыре внутренних сервиса. Результат зафиксирован в evidence/ansible-run.json.','Конфигурация Ansible настроила реальную временную Ubuntu-ВМ и выдержала повторное применение без изменений. Для постоянного демонстрационного стенда её нужно применить к выделенному серверу.'),
('labs/lab6','ЛР6','Мониторинг микросервисов и ресурсов ВМ','Настроить Grafana, вывести CPU, диск, RAM и сеть, доступность всех микросервисов и логи контейнеров.','На Ubuntu через Grafana получены реальные CPU, RAM, диск, RX/TX. Все пять микросервисов доступны, найдены логи семи контейнеров приложения и 21 поток Loki суммарно. Дашборд загружен автоматически.','Мониторинг настроен и проверен на работающей временной Ubuntu-ВМ. Фактические значения и запросы сохранены в evidence/monitor-evidence.json. Долговременный доступ к дашборду требует выделенного учебного сервера.'),
('homeworks/hw7','ДЗ7','Технический дизайн облачной инфраструктуры','Определить облачные ресурсы, схему сети, архитектурные решения и отказоустойчивость системы бронирования.','Сборка Kustomize дала 14 объектов. Проверены шесть сервисов, единственная внешняя точка входа, пять постоянных хранилищ и диапазон HPA 2–4. Назначения согласованы с конфигурацией приложения.','Технический дизайн выполнен. Указаны решения по сети и данным, ограничения одиночных компонентов, порядок восстановления и критерии приёмки облачного стенда.'),
('labs/lab7','ЛР7','Оркестрация приложения в облаке','Развернуть и оркестрировать микросервисы в облачной инфраструктуре по дизайну ДЗ7.','kubectl kustomize собрал манифесты. На реальных digest сборки f3712a8 проверена подстановка пяти конкретных образов в сохранённый release-f3712a8.yaml. У каждого сервиса проверена связь селектора и порта пода.','Для завершения нужны созданные облачные ресурсы, фактические digest, пять Bound PVC, готовые поды и ответ внешнего Gateway.'),
('homeworks/hw8','ДЗ8','CI/CD для облачной инфраструктуры','Реализовать непрерывную интеграцию и доставку микросервисов в целевое облако.','На Ubuntu прошли тесты и сборка всех пяти образов. Образы опубликованы в GHCR, digest сохранены в artifacts. Развёртывание ожидает подключения кластера.','Для сдачи необходим успешный GitHub Actions run с публикацией образов и доставкой в кластер.'),
('homeworks/hw9','ДЗ9','Документирование веб-приложения','Задокументировать приложение средствами Postman, OpenAPI/Swagger и MkDocs.','Собраны и разобраны два контракта: 16 публичных путей, 3 внутренних. Все локальные ссылки схем разрешаются. Проверены три страницы MkDocs и коллекция из 29 запросов. mkdocs build --strict прошёл на Ubuntu, сайт собран за 0,19 секунды.','Документация собрана. Сайт MkDocs доступен в artifact booking-mkdocs запуска 44511000128. В нём размещены контракты API, коллекция и руководство по эксплуатации.'),
('homeworks/hw10','ДЗ10','Сценарии нагрузочного тестирования','Написать сценарии и профили для ключевых запросов, задать RPS, p95/p99, допустимую долю ошибок и целевые SLO.','k6 v1.7.1 загрузил все три профиля командой inspect. Проверены имена полей каталога, авторизации и бронирования по исходникам сервисов.','Сценарии, интенсивность и критерии приёмки заданы. Экспериментальные значения производительности относятся к ЛР8 и фиксируются после нагрузочного прогона.'),
('labs/lab8','ЛР8','Нагрузочное тестирование и автоскейлинг','Нагрузить облачный стенд, проанализировать показатели Grafana, настроить HPA и подобрать requests/limits.','Локально проверены целевой Gateway, CPU-запрос, границы HPA, конфигурация дашборда и синтаксис сценария измерений.','Требуются два сравнимых прогона, результат масштабирования, графики Grafana и вывод об эффекте тюнинга. Фактические значения RPS, задержек и числа реплик пока отсутствуют.')]
extra={
'ЛР4':['Проверка готовности цепочки','Внешний клиент должен получить HTTP 200 через системный Nginx и контейнерный proxy. Для проверки сохранности данных создайте бронь, обновите версию и запросите её по тому же идентификатору. Зафиксируйте фактические результаты отдельно от сентябрьской локальной репетиции.'],
'ДЗ6':['Последовательность проверки','Изменение в semester-2-practice запускает quality, messaging и containers. В job deploy передаётся архив текущей проверенной ревизии. Релиз и ссылка current относятся к одному SHA, а пользовательская конфигурация и тома хранятся вне каталога релиза.'],
'ЛР5':['Повторный запуск','Первый прогон устанавливает систему и развертывает ревизию. Следующий проверяет ссылку current и ответ /ready. Если ревизия совпадает и API готов, блок упаковки и передачи пропускается. Перезагрузка Nginx выполняется обработчиком после проверки nginx -t.'],
'ЛР6':['Чтение показателей','CPU выводится как доля времени вне idle. RAM — разность полной и доступной памяти, диск — разность размера и доступного места корневого раздела. Для сети показаны отдельные скорости приёма и передачи. Нулевой probe_success указывает на недоступный HTTP endpoint; журнал нужного контейнера выбирается по container ID.'],
'ДЗ8':['Доказательства доставки','Хеши образов отличаются от изменяемых тегов. Сохранение images.json вместе с release.yaml позволяет повторно развернуть ту же сборку. Отчёт о выполнении должен содержать ссылку на run и внешний ответ /ready для той же ревизии.'],
'ДЗ9':['Пользовательский сценарий','Гость регистрируется, получает токен, запрашивает каталог и оформляет бронь. Защищённые маршруты принимают Bearer JWT. Отмена брони записывает новое событие. Клиент читает уведомления асинхронно. OpenAPI разделяет внешние и внутренние методы.'],
}
def scheme():
    d=Drawing(440,138)
    def box(x,y,w,label):
        d.add(Rect(x,y,w,25,rx=3,ry=3,fillColor=colors.HexColor('#eaf2f5'),strokeColor=navy))
        d.add(String(x+w/2,y+9,label,fontName='CourseBold',fontSize=9,textAnchor='middle',fillColor=navy))
    def arrow(x1,y1,x2,y2):
        d.add(Line(x1,y1,x2,y2,strokeColor=muted))
        if y1==y2:d.add(Polygon([x2,y2,x2-4,y2+2,x2-4,y2-2],fillColor=muted))
        else:d.add(Polygon([x2,y2,x2-2,y2+4,x2+2,y2+4],fillColor=muted))
    box(8,101,94,'Клиент');box(150,101,102,'Балансировщик');box(302,101,125,'Gateway (2–4)')
    arrow(102,113,150,113);arrow(252,113,302,113)
    d.add(Line(365,101,365,79,strokeColor=muted));d.add(Line(55,79,365,79,strokeColor=muted))
    for x,l in [(10,'Accounts'),(112,'Catalog'),(214,'Bookings'),(316,'Notifications')]:
        box(x,36,90,l);arrow(x+45,79,x+45,61)
    d.add(String(219,12,'Связь Bookings → RabbitMQ → Notifications асинхронная.',textAnchor='middle',fontName='Course',fontSize=10))
    return d
def read_notes(txt):
    lines=iter(txt.splitlines())
    story=[];code=False;rows=[]
    def table_rows():
        if not rows:return
        n=len(rows[0])
        widths=([.25,.42,.33] if n==3 else [.17,.34,.18,.31] if n==4 else [1/n]*n)
        t=Table([[par(v,cell) for v in row] for row in rows],colWidths=[v*(W-12) for v in widths],repeatRows=1,hAlign='LEFT')
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),'#eaf2f5'),('GRID',(0,0),(-1,-1),.35,'#a9b6bd'),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
        story.extend([t,Spacer(1,6)]);rows.clear()
    for line in lines:
        if line.startswith('|'):
            row=[v.strip() for v in line.strip('|').split('|')]
            if not all(re.fullmatch('[-: ]+',v) for v in row):rows.append(row)
            continue
        table_rows()
        if line.startswith('~~~'):code=not code;continue
        if not line or line.startswith('# '):continue
        if code:story.append(par(line,code_style))
        elif line.startswith('## '):story.append(par(line[3:],sub))
        else:story.append(par(line))
    table_rows()
    return story
def footer(canvas,doc):
    if doc.page==1:return
    canvas.setStrokeColor(colors.HexColor('#b2c3cc'));canvas.line(22*mm,17*mm,A4[0]-22*mm,17*mm)
    canvas.setFont('Course',9);canvas.setFillColor(muted)
    canvas.drawString(22*mm,12*mm,'Бэк-энд разработка  /  Прель Александр  /  БР1.1')
    canvas.drawRightString(A4[0]-22*mm,12*mm,str(doc.page))
requested=set(sys.argv[1:])
unknown=requested-{spec[1] for spec in specs}
if unknown:raise SystemExit('Unknown report: '+', '.join(sorted(unknown)))
for directory,identifier,name,task,verified,result in specs:
    if requested and identifier not in requested:continue
    folder=root/directory
    outfile=folder/(identifier+'_Прель Александр_БР1.1.pdf')
    kind='Лабораторная работа' if identifier.startswith('ЛР') else 'Практическая работа'
    number=re.search(r'\d+',identifier).group()
    story=[Spacer(1,10*mm),par('САНКТ-ПЕТЕРБУРГСКИЙ НАЦИОНАЛЬНЫЙ\nИССЛЕДОВАТЕЛЬСКИЙ УНИВЕРСИТЕТ ИТМО',center),Spacer(1,22*mm),par('Дисциплина: Бэк-энд разработка',center),Spacer(1,17*mm),par('ОТЧЁТ',title),par(kind+' № '+number,center),Spacer(1,5*mm),par(name,title),Spacer(1,21*mm),par('Выполнил:\nПрель Александр\nГруппа БР1.1',right),Spacer(1,6*mm),par('Проверил:\nДобряков Д. И.',right),Spacer(1,18*mm),par('Санкт-Петербург\n2026 г.',center),PageBreak(),par('Задача',heading),par(task),par('Ход работы',heading)]
    if identifier=='ДЗ7':story.extend([scheme(),par('Рис. 1. Публичный запрос и внутренние сервисы приложения.',small)])
    notes=(folder/'README.md').read_text()
    if identifier=='ЛР6':notes='\n'.join(line for line in notes.splitlines() if not line.startswith('Проверено на временной Ubuntu-ВМ:'))
    story.extend(read_notes(notes))
    if identifier in extra and identifier!='ЛР6':story.extend([par(extra[identifier][0],sub),par(extra[identifier][1])])
    if identifier=='ЛР6' and (root/'evidence/monitor-evidence.json').exists():
        measured=json.loads((root/'evidence/monitor-evidence.json').read_text())
        rows=['| Показатель | Фактическое значение |','| --- | --- |']
        for panel in measured['resourcePanels']:
            value=sum(float(sample['value'][1]) for sample in panel['samples'])
            label=panel['title']
            if 'node_cpu' in panel['query']:shown=f'{value:.2f} %'
            elif 'node_network' in panel['query']:
                label='Сеть RX' if 'receive' in panel['query'] else 'Сеть TX'
                shown=f'{value:.2f} байт/с'
            else:shown=f'{value / 1024**3:.3f} GiB'
            rows.append(f'| {label} | {shown} |')
        rows += [f"| Доступность сервисов | {len(measured['health'])}/5 |",f"| Контейнеры приложения с логами | {measured['applicationContainersWithLogs']}/7 |"]
        story.extend([par('Фактические измерения Grafana',sub),par('Временная Ubuntu-ВМ GitHub Actions; время '+measured['utc']+'.',small)])
        story.extend(read_notes('\n'.join(rows)))
    story.extend([KeepTogether([par('Результаты проверки',sub),par(verified)]),KeepTogether([par('Вывод',heading),par(result)]),par('Критерии и материалы',sub),par(f'[Условия задания]({course}) · [Шаблон отчёта]({template})',small),par('[Код и инструкция](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/tree/semester-2-practice/БР1.1/Прель%20Александр/'+directory.replace(' ', '%20')+') · [Протокол запусков](https://github.com/Alexander-Prel/ITMO-ACS-Backend-2026-A/blob/semester-2-practice/БР1.1/Прель%20Александр/evidence/github-actions.md)',small)])
    doc=SimpleDocTemplate(str(outfile),pagesize=A4,title=name,author='Прель Александр',leftMargin=22*mm,rightMargin=22*mm,topMargin=18*mm,bottomMargin=24*mm)
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    print(outfile.name)
