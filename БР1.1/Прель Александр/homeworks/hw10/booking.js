import http from 'k6/http';
import { check, fail } from 'k6';
import exec from 'k6/execution';
import { Rate } from 'k6/metrics';

const api = (__ENV.BASE_URL || '').replace(/\/$/, '');
const profile = __ENV.PROFILE || 'smoke';
const rates = {
  smoke: [{ target: 1, duration: '15s' }],
  baseline: [{ target: 5, duration: '30s' }, { target: 5, duration: '2m' }],
  scale: [{ target: 5, duration: '30s' }, { target: 20, duration: '90s' },
          { target: 20, duration: '4m' }, { target: 2, duration: '2m' }],
};
if (!(profile in rates)) throw Error('PROFILE must be smoke, baseline or scale');
const businessErrors = new Rate('business_errors');
export const options = {
  scenarios: { guests: { executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '1s',
    preAllocatedVUs: profile === 'smoke' ? 2 : 10, maxVUs: profile === 'smoke' ? 5 : 40, stages: rates[profile] } },
  thresholds: { http_req_failed: ['rate<0.01'], business_errors: ['rate<0.01'], dropped_iterations: ['count==0'],
    'http_req_duration{group_name:read}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{group_name:write}': ['p(95)<1000', 'p(99)<2000'] },
  summaryTrendStats: ['avg', 'p(95)', 'p(99)', 'max'],
};
function params(name, group, token) {
  return {tags: {name, group_name: group}, headers: {'Content-Type':'application/json',
    ...(token ? {Authorization:'Bearer '+token} : {})}, timeout:'8s'};
}
function accept(res, status, label) {
  const ok = check(res, {[label]: r => r.status === status});
  businessErrors.add(!ok);
  return ok;
}
export function setup() {
  if (!/^https?:\/\//.test(api)) fail('Set BASE_URL to the dedicated course deployment');
  const email = 'load-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'@example.test';
  const password = 'Study-'+Math.random().toString(36).slice(2)+'-42';
  const reg = http.post(api+'/auth/register', JSON.stringify({firstName:'Load',lastName:'Test',email,password,phone:'+79990000000'}),params('register','setup'));
  if (reg.status!==201) fail('Registration returned '+reg.status);
  const login = http.post(api+'/auth/login', JSON.stringify({email,password}),params('login','setup'));
  if (login.status!==200) fail('Login returned '+login.status);
  const list = http.get(api+'/restaurants?limit=1',params('seed-restaurant','setup'));
  if(list.status!==200 || !list.json('items.0.restaurantId')) fail('Seed restaurant unavailable');
  return {token:login.json('accessToken'),id:list.json('items.0.restaurantId'), dateOffset:Math.floor(Math.random()*365)};
}
export default function guest(data) {
  const i=exec.scenario.iterationInTest, token=data.token;
  const catalog=http.get(api+'/restaurants?sort_by=rating&sort_order=desc',params('catalog','read'));
  accept(catalog,200,'catalog available');
  if (i%5!==0) {
    const details=http.get(api+'/restaurants/'+data.id,params('details','read'));
    accept(details,200,'details available');
    return;
  }
  const day=new Date(Date.UTC(2035,0,1+data.dateOffset+Math.floor(i/5)));
  const payload={restaurantId:data.id,reservationDate:day.toISOString().slice(0,10),startTime:'18:00:00',endTime:'19:00:00',guestsCount:2};
  const created=http.post(api+'/reservations',JSON.stringify(payload),params('reserve','write',token));
  if (!accept(created,201,'booking created')) return;
  const id=created.json('reservationId');
  const cancel=http.patch(api+'/reservations/'+id+'/cancel',JSON.stringify({reason:'course load run'}),params('cancel','write',token));
  accept(cancel,200,'booking cancelled');
}
