import { isGoogleMapsShortLink, parseGoogleMapsUrl } from "./parseGoogleMapsUrl";

describe("parseGoogleMapsUrl", () => {
  it("extracts name and coordinates from a /maps/place/ URL with an @lat,lng segment", () => {
    const result = parseGoogleMapsUrl("https://www.google.com/maps/place/Riverside+Central+Mall/@17.4239,78.4738,17z");
    expect(result).toEqual({ name: "Riverside Central Mall", latitude: 17.4239, longitude: 78.4738 });
  });

  it("prefers the more precise !3d!4d coordinates over the @ segment when both are present", () => {
    const result = parseGoogleMapsUrl(
      "https://www.google.com/maps/place/Some+Place/@17.42,78.47,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d17.423901!4d78.473801",
    );
    expect(result?.latitude).toBe(17.423901);
    expect(result?.longitude).toBe(78.473801);
  });

  it("extracts coordinates from a ?q=lat,lng query parameter", () => {
    const result = parseGoogleMapsUrl("https://www.google.com/maps?q=17.4239,78.4738");
    expect(result).toEqual({ name: null, latitude: 17.4239, longitude: 78.4738 });
  });

  it("treats a non-numeric q parameter as a place name", () => {
    const result = parseGoogleMapsUrl("https://maps.google.com/?q=Springfield+Heritage+Fort");
    expect(result?.name).toBe("Springfield Heritage Fort");
    expect(result?.latitude).toBeNull();
  });

  it("returns null for a non-Google-Maps URL", () => {
    expect(parseGoogleMapsUrl("https://example.com/somewhere")).toBeNull();
  });

  it("returns null for a malformed URL", () => {
    expect(parseGoogleMapsUrl("not a url")).toBeNull();
  });

  it("ignores out-of-range coordinates rather than returning bogus data", () => {
    const result = parseGoogleMapsUrl("https://www.google.com/maps/place/X/@200.0,78.4738,17z");
    expect(result?.latitude).toBeNull();
    expect(result?.longitude).toBeNull();
  });
});

describe("isGoogleMapsShortLink", () => {
  it("identifies maps.app.goo.gl links", () => {
    expect(isGoogleMapsShortLink("https://maps.app.goo.gl/abc123")).toBe(true);
  });

  it("identifies legacy goo.gl/maps links", () => {
    expect(isGoogleMapsShortLink("https://goo.gl/maps/abc123")).toBe(true);
  });

  it("returns false for a full google.com/maps URL", () => {
    expect(isGoogleMapsShortLink("https://www.google.com/maps/place/X/@17.42,78.47,17z")).toBe(false);
  });
});
