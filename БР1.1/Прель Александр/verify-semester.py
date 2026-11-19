"""Offline cross-checks on the artifacts passed between semester assignments."""
from pathlib import Path
import json
import re
import subprocess
import yaml

root = Path(__file__).resolve().parent
lab7 = root / 'labs/lab7'
files = list(yaml.safe_load_all(subprocess.check_output(['kubectl','kustomize',str(lab7)])))
objects = {(d['kind'], d['metadata']['name']): d for d in files}
services = {'gateway','accounts','catalog','bookings','notifications','rabbitmq'}
assert {n for (k,n) in objects if k=='Service'} == services
for name in sorted(services):
    service=objects['Service',name]['spec']
    workload=objects['Deployment' if name=='gateway' else 'StatefulSet', name]['spec']
    assert service['selector']==workload['selector']['matchLabels']==workload['template']['metadata']['labels']
    container=workload['template']['spec']['containers'][0]
    assert service['ports'][0]['targetPort']==container['ports'][0]['containerPort']
    assert (service.get('type')=='LoadBalancer')==(name=='gateway')
    if name!='gateway':
        assert workload['replicas']==1 and workload['volumeClaimTemplates'][0]['spec']['accessModes']==['ReadWriteOnce']
    else:
        assert container['resources']['requests']['cpu']=='100m'
hpa=objects['HorizontalPodAutoscaler','gateway']['spec']
assert hpa['scaleTargetRef']['name']=='gateway' and (hpa['minReplicas'],hpa['maxReplicas'])==(2,4)
print(f'Kubernetes: {len(files)} objects, 6 services, 5 persistent workloads, 1 public Gateway; HPA 2–4.')
blackbox=yaml.safe_load((root/'labs/lab6/prometheus.yml').read_text())['scrape_configs'][1]
targets=blackbox['static_configs'][0]['targets']
assert {t.split('/')[2].split(':')[0] for t in targets}==services-{'rabbitmq'}
dash=json.loads((root/'labs/lab6/grafana/dashboards/booking.json').read_text())
assert len(dash['panels'])==6 and dash['panels'][-1]['targets'][0]['expr']=='{job="docker"}'
cm=yaml.safe_load((root/'labs/lab8/dashboard.yaml').read_text())
assert len(json.loads(cm['data']['booking-load.json'])['panels'])==5
print('Monitoring: 5 microservice probes, 6 VM panels, 5 Kubernetes/load panels.')
downloads=root/'homeworks/hw9/docs/downloads'
def references(doc,node):
    if isinstance(node,list):
        for child in node: references(doc,child)
    elif isinstance(node,dict):
        for k,v in node.items():
            if k=='$ref':
                assert v.startswith('#/')
                value=doc
                for part in v[2:].split('/'):value=value[part]
            else: references(doc,v)
for name in ['openapi','internal']:
    doc=json.loads((downloads/(name+'.json')).read_text())
    references(doc,doc)
    print(f'{name}: {len(doc["paths"])} routes, all local references resolve.')
public=json.loads((downloads/'openapi.json').read_text())['paths']
assert not any(p.startswith('/internal') for p in public)
assert all(path in public for path in ['/health','/ready','/notifications/me','/reservations'])
site=root/'homeworks/hw9/docs'
for doc in site.glob('*.md'):
    for link in re.findall(r'\]\(([^)]+)\)',doc.read_text()):
        assert (doc.parent/link).is_file(), link
collection=json.loads(next(downloads.glob('*collection.json')).read_text())
print(f'MkDocs source: 3 pages, local links resolve. Postman: {len(collection["item"])} requests.')
