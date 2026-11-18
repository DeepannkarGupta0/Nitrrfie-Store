import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errors = new Rate('request_errors');
const latency = new Trend('store_latency', true);

export const options = {
  stages: [
    { duration: '1m', target: 25 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 250 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    request_errors: ['rate<0.01'],
  },
};

const base = __ENV.BASE_URL;
if (!base) throw new Error('Set BASE_URL, e.g. BASE_URL=https://staging.example.com');

export default function () {
  const paths = ['/', '/shop', '/api/inventory'];
  const path = paths[Math.floor(Math.random() * paths.length)];
  const response = http.get(`${base}${path}`, { tags: { route: path } });
  latency.add(response.timings.duration);
  const ok = check(response, {
    'status is below 500': (r) => r.status < 500,
  });
  errors.add(!ok);
  sleep(1);
}
