"""Publish the gateway contract plus separate internal and Postman downloads for MkDocs."""
import json
import shutil
from pathlib import Path
import yaml

here = Path(__file__).resolve().parent
homeworks = here.parent
out = here / 'docs/downloads'
out.mkdir(exist_ok=True)
public = yaml.safe_load((homeworks / 'hw2/dz2.yaml').read_text())
events = yaml.safe_load((homeworks / 'hw5/openapi.yaml').read_text())
public['info']['version'] = '2.0.0'
public['servers'] = [{'url':'{baseUrl}', 'variables': {'baseUrl':{'default':'http://127.0.0.1:8080'}}, 'description':'Адрес учебного Gateway'}]
for route in ['/ready', '/notifications/me']:
    public['paths'][route] = events['paths'][route]
for category in ('schemas', 'responses', 'securitySchemes'):
    for key, value in events['components'][category].items():
        if category == 'securitySchemes' and key == 'serviceKey':
            continue
        public['components'][category].setdefault(key, value)
public['paths']['/health']={'get':{'summary':'Проверка процесса Gateway','responses':{'200':{'description':'Процесс принимает запросы','content':{'application/json':{'example':{'status':'ok','service':'gateway'}}}}}}}
(out/'openapi.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n')
internal = yaml.safe_load((homeworks/'hw4/internal-api.yaml').read_text())
internal['info']['description']='Внутренний HTTP между сервисами. Адреса ниже действуют внутри сети приложения.'
internal['servers']=[{'url':'http://accounts:3000'},{'url':'http://catalog:3000'},{'url':'http://bookings:3000'}]
for path, resource in internal['paths'].items():
    resource['servers']=[internal['servers'][0 if '/auth/' in path else 1]]
internal['paths']['/internal/messaging/status']=events['paths']['/internal/messaging/status']
internal['paths']['/internal/messaging/status']['servers']=[internal['servers'][2]]
for category,group in events['components'].items():
    for key,value in group.items():
        internal['components'].setdefault(category,{}).setdefault(key,value)
(out/'internal.json').write_text(json.dumps(internal,ensure_ascii=False,indent=2)+'\n')
for p in (homeworks/'hw3').glob('*postman*json'):
    shutil.copyfile(p,out/p.name)
