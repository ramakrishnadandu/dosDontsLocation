import { computeModerationSignal, decideModerationAction } from "./moderationEngine";

describe("computeModerationSignal", () => {
  it("flags obvious spam with links and promotional keywords", () => {
    const signal = computeModerationSignal({
      text: "CLICK HERE to WIN a FREE prize now!!! www.example-scam.example",
    });
    expect(signal.isSpam).toBe(true);
    expect(signal.spamScore).toBeGreaterThan(0.6);
  });

  it("does not flag an ordinary negative review as spam", () => {
    const signal = computeModerationSignal({
      text: "The service was slow and the staff were rude. I would not go back.",
    });
    expect(signal.isSpam).toBe(false);
  });

  it("detects personal information such as an email address", () => {
    const signal = computeModerationSignal({ text: "Contact me at john.doe@example.com for details." });
    expect(signal.containsPersonalInformation).toBe(true);
  });

  it("detects near-duplicate submissions from the same author", () => {
    const signal = computeModerationSignal({
      text: "This place has great food and friendly staff.",
      priorTextsBySameAuthor: ["This place has great food and friendly staff!"],
    });
    expect(signal.isDuplicate).toBe(true);
  });
});

describe("decideModerationAction", () => {
  const thresholds = { autoHideSpamScoreThreshold: 0.9, autoHideOnReportCount: 5 };

  it("never auto-hides content solely for being negative", () => {
    const signal = computeModerationSignal({ text: "Terrible experience, would not recommend." });
    expect(decideModerationAction(signal, 0, thresholds)).toBe("ALLOW");
  });

  it("auto-hides high-confidence spam", () => {
    const signal = { isSpam: true, spamScore: 0.95, isDuplicate: false, containsPersonalInformation: false, containsMaliciousLink: false, toxicityScore: 0 };
    expect(decideModerationAction(signal, 0, thresholds)).toBe("AUTO_HIDE");
  });

  it("queues content for review once report count reaches the threshold", () => {
    const signal = { isSpam: false, spamScore: 0.1, isDuplicate: false, containsPersonalInformation: false, containsMaliciousLink: false, toxicityScore: 0 };
    expect(decideModerationAction(signal, 5, thresholds)).toBe("QUEUE_FOR_REVIEW");
  });
});
