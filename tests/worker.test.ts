import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("weather proxy returns Open-Meteo data with browser CORS headers", async () => {
  let upstreamUrl = "";
  globalThis.fetch = async (input) => {
    upstreamUrl = String(input);
    return new Response(JSON.stringify({
      current: {
        temperature_2m: 22,
        relative_humidity_2m: 65,
        wind_speed_10m: 8,
        is_day: 1,
      },
    }));
  };

  const request = new Request("https://urban-climate.tomi.workers.dev/weather?latitude=-33.87&longitude=151.21&timezone=Australia%2FSydney", {
    headers: { Origin: "https://urbanclimate.susbridge.xyz" },
  });
  const response = await worker.fetch(request, {});

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://urbanclimate.susbridge.xyz");
  assert.equal((await response.json()).current.temperature_2m, 22);
  assert.match(upstreamUrl, /api\.open-meteo\.com\/v1\/forecast/);
});

test("weather proxy rejects invalid coordinates without calling upstream", async () => {
  globalThis.fetch = async () => { throw new Error("Unexpected upstream call"); };

  const request = new Request("https://urban-climate.tomi.workers.dev/weather?latitude=undefined&longitude=151.21");
  const response = await worker.fetch(request, {});

  assert.equal(response.status, 400);
});
