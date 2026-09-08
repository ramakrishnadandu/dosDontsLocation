import request from "supertest";
import { prisma } from "@locaguide/db";
import { createApp } from "./app";
import { getRedis } from "./cache/redis";

const app = createApp();

describe("health endpoints", () => {
  it("GET /livez returns ok", async () => {
    const res = await request(app).get("/livez");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /readyz reports database and redis connectivity", async () => {
    const res = await request(app).get("/readyz");
    expect([200, 503]).toContain(res.status);
    expect(res.body.checks).toHaveProperty("database");
    expect(res.body.checks).toHaveProperty("redis");
  });
});

describe("error envelope", () => {
  it("returns the standard error envelope for an unknown route", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({ code: "ROUTE_NOT_FOUND" });
    expect(res.body.error.request_id).toBeTruthy();
  });

  it("returns a validation error envelope for a bad query", async () => {
    const res = await request(app).get("/api/v1/locations/nearby").query({ lat: "not-a-number", lng: 10 });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("locations (demo/mock provider)", () => {
  it("GET /api/v1/locations/nearby returns demo entities near the seeded coordinates", async () => {
    const res = await request(app).get("/api/v1/locations/nearby").query({ lat: 17.4239, lng: 78.4738, radiusMeters: 5000 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty("isDemoData", true);
  });

  it("GET /api/v1/locations/search finds the demo mall by name", async () => {
    const res = await request(app).get("/api/v1/locations/search").query({ q: "Riverside" });
    expect(res.status).toBe(200);
    expect(res.body.items.some((e: { id: string }) => e.id === "demo-mall-1")).toBe(true);
  });

  it("GET /api/v1/locations/:id returns 404 with the standard envelope for an unknown id", async () => {
    const res = await request(app).get("/api/v1/locations/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("LOCATION_NOT_FOUND");
  });

  it("GET /api/v1/locations/:id/intelligence returns an evidence-backed briefing", async () => {
    const res = await request(app).get("/api/v1/locations/demo-mall-1/intelligence");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.evidence)).toBe(true);
    for (const item of res.body.evidence) {
      expect(item).toHaveProperty("type");
      expect(["FACT", "REVIEW_SIGNAL", "COMMUNITY_OPINION", "AI_INTERPRETATION"]).toContain(item.type);
      expect(item.sources.length).toBeGreaterThan(0);
    }
  }, 20000);
});

describe("auth + community opinion flow", () => {
  const email = `test-${Date.now()}@example.com`;

  it("registers, logs a user in, and lets them submit + read back a community opinion", async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: "correct-horse-battery-staple", displayName: "Test User" });
    expect(registerRes.status).toBe(201);
    const { accessToken } = registerRes.body;
    expect(accessToken).toBeTruthy();

    // ensure the entity is cached before submitting an opinion against it
    await request(app).get("/api/v1/locations/demo-restaurant-1");

    const submitRes = await request(app)
      .post("/api/v1/community/opinions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ entityId: "demo-restaurant-1", rating: 5, title: "Great food", body: "Loved the ambience and staff." });
    expect(submitRes.status).toBe(201);
    expect(submitRes.body.status).toBe("ACTIVE");

    const listRes = await request(app).get("/api/v1/locations/demo-restaurant-1/community");
    expect(listRes.status).toBe(200);
    expect(listRes.body.items.some((o: { id: string }) => o.id === submitRes.body.id)).toBe(true);
  });

  it("rejects community opinion submission without auth", async () => {
    const res = await request(app)
      .post("/api/v1/community/opinions")
      .send({ entityId: "demo-restaurant-1", rating: 5 });
    expect(res.status).toBe(401);
  });
});

describe("saved locations (section 48)", () => {
  let accessToken: string;

  beforeAll(async () => {
    const registerRes = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: `saved-${Date.now()}@example.com`, password: "correct-horse-battery-staple", displayName: "Saver" });
    accessToken = registerRes.body.accessToken;
  });

  it("saves a known entity as an interested location", async () => {
    await request(app).get("/api/v1/locations/demo-attraction-1");
    const res = await request(app)
      .post("/api/v1/users/me/saved-locations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ entityId: "demo-attraction-1" });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe("Springfield Heritage Fort");
    expect(res.body.latitude).toBeCloseTo(17.43, 1);
  });

  it("parses a pasted Google Maps link into a name and coordinates", async () => {
    const res = await request(app)
      .post("/api/v1/users/me/saved-locations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ sourceUrl: "https://www.google.com/maps/place/Charminar/@17.3616,78.4747,17z" });
    expect(res.status).toBe(201);
    expect(res.body.label).toBe("Charminar");
    expect(res.body.latitude).toBeCloseTo(17.3616, 3);
    expect(res.body.longitude).toBeCloseTo(78.4747, 3);
  });

  it("lists and then deletes a saved location", async () => {
    const listRes = await request(app).get("/api/v1/users/me/saved-locations").set("Authorization", `Bearer ${accessToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBeGreaterThanOrEqual(2);

    const idToDelete = listRes.body.items[0].id;
    const deleteRes = await request(app)
      .delete(`/api/v1/users/me/saved-locations/${idToDelete}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteRes.status).toBe(204);
  });

  it("rejects an empty saved-location payload", async () => {
    const res = await request(app)
      .post("/api/v1/users/me/saved-locations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it("requires auth", async () => {
    const res = await request(app).get("/api/v1/users/me/saved-locations");
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  getRedis().disconnect();
});
