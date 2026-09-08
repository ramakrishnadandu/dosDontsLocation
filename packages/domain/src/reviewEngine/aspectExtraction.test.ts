import { extractAspects } from "./aspectExtraction";

describe("extractAspects", () => {
  it("extracts multiple distinct aspects from one review", () => {
    const mentions = extractAspects(
      "Parking was difficult to find. The staff were very friendly though. Food was excellent.",
    );
    const aspects = mentions.map((m) => m.aspect);
    expect(aspects).toContain("PARKING");
    expect(aspects).toContain("STAFF");
    expect(aspects).toContain("FOOD");
  });

  it("returns an empty array when no known aspect is mentioned", () => {
    expect(extractAspects("Went there yesterday afternoon.")).toHaveLength(0);
  });

  it("assigns sentence-level sentiment per mention", () => {
    const mentions = extractAspects("The parking was terrible. The staff were excellent.");
    const parking = mentions.find((m) => m.aspect === "PARKING");
    const staff = mentions.find((m) => m.aspect === "STAFF");
    expect(parking?.sentiment).toBe("NEGATIVE");
    expect(staff?.sentiment).toBe("POSITIVE");
  });
});
