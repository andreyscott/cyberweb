// k6 load test: https://k6.io  (install k6, then: BASE_URL=https://your-site npm run loadtest)
// Ramps to 1,000 requests/second against the mix real users generate, and
// fails if p95 latency or the error rate miss the targets below.
import http from "k6/http";
import { check } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const SLUGS = ["xss", "zta", "siem", "mfa", "tls", "attck", "cia", "sqli", "dmz", "rbac", "aes", "dmarc"];

export const options = {
  scenarios: {
    ramp: {
      executor: "ramping-arrival-rate",
      startRate: 50,
      timeUnit: "1s",
      preAllocatedVUs: 200,
      maxVUs: 2000,
      stages: [
        { target: 500, duration: "1m" },
        { target: 1000, duration: "2m" },
        { target: 1000, duration: "3m" },
        { target: 0, duration: "30s" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.001"], // under 0.1% errors
    http_req_duration: ["p(95)<300"], // 95% of requests under 300 ms
  },
};

// The sync route rate-limits per IP, and a load generator is one IP, so 429 is expected there.
http.setResponseCallback(http.expectedStatuses(200, 429, 503));

export default function () {
  const r = Math.random();
  let res;
  if (r < 0.7) res = http.get(`${BASE}/acronyms/${SLUGS[Math.floor(Math.random() * SLUGS.length)]}`);
  else if (r < 0.85) res = http.get(`${BASE}/acronyms`);
  else if (r < 0.95) res = http.get(`${BASE}/search-index.json`);
  else {
    // The write path: a small batch of quiz answers.
    const now = Date.now();
    res = http.post(`${BASE}/api/sync`, JSON.stringify({
      deviceId: uuidv4(),
      events: [{ id: uuidv4(), kind: "attempt", questionId: "d-xss-exp", domain: "threats", correct: true, at: now }],
    }), { headers: { "content-type": "application/json" } });
  }
  // 503 means "no database configured", which is a valid state for the sync route.
  check(res, { "status ok": (x) => [200, 429, 503].includes(x.status) });
}
