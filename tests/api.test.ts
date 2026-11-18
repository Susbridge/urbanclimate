import assert from "node:assert/strict";
import test from "node:test";
import { fetchLocationByIP } from "../src/services/api";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("rejects a rate-limited IP lookup so the default city stays selected", async () => {
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: true, reason: "RateLimited" }),
    { status: 429 }
  );

  await assert.rejects(fetchLocationByIP(), /IP location request failed: 429/);
});

test("rejects a successful response without coordinates", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ city: "Sydney" }));

  await assert.rejects(fetchLocationByIP(), /invalid coordinates/);
});

test("accepts a valid IP lookup", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    city: "Sydney",
    country_name: "Australia",
    country_code: "AU",
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: "Australia/Sydney"
  }));

  const city = await fetchLocationByIP();
  assert.equal(city.name, "Sydney");
  assert.equal(city.lat, -33.8688);
  assert.equal(city.lng, 151.2093);
});
