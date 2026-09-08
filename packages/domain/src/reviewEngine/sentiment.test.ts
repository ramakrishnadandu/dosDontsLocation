import { scoreSentiment } from "./sentiment";

describe("scoreSentiment", () => {
  it("detects positive sentiment", () => {
    expect(scoreSentiment("The staff were very friendly and helpful.").sentiment).toBe("POSITIVE");
  });

  it("detects negative sentiment", () => {
    expect(scoreSentiment("Parking is a nightmare, very crowded and expensive.").sentiment).toBe("NEGATIVE");
  });

  it("detects neutral sentiment for factual text", () => {
    expect(scoreSentiment("The mall opens at 10am and closes at 10pm.").sentiment).toBe("NEUTRAL");
  });

  it("handles simple negation", () => {
    expect(scoreSentiment("The staff were not helpful.").sentiment).toBe("NEGATIVE");
  });

  it("detects negative sentiment in real-world review phrasing (regression: DMart Kushaiguda parking review)", () => {
    expect(
      scoreSentiment("Parking was a mess, staff could not manage the traffic, and trolleys were unavailable, which was frustrating.")
        .sentiment,
    ).toBe("NEGATIVE");
  });
});
