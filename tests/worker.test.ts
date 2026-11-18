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

test("weather proxy uses the current hourly forecast when the primary endpoint fails", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(String(input));
    if (requestedUrls.length === 1) throw new Error("Primary endpoint timed out");

    return new Response(JSON.stringify({
      utc_offset_seconds: 0,
      hourly: {
        time: [`${new Date().toISOString().slice(0, 13)}:00`],
        temperature_2m: [21],
        relative_humidity_2m: [63],
        wind_speed_10m: [9],
        is_day: [1],
      },
    }));
  };

  const request = new Request("https://urban-climate.tomi.workers.dev/weather?latitude=36.75&longitude=3.06&timezone=UTC");
  const response = await worker.fetch(request, {});
  const weather = await response.json();

  assert.equal(response.status, 200);
  assert.equal(weather.source, "historical-forecast");
  assert.equal(weather.current.temperature_2m, 21);
  assert.match(requestedUrls[1], /historical-forecast-api\.open-meteo\.com/);
});
