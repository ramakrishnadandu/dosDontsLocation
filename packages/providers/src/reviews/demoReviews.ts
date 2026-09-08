import type { RawReview } from "@locaguide/contracts";

function review(
  id: string,
  entityId: string,
  authorDisplayName: string,
  rating: number,
  text: string,
  daysAgo: number,
): RawReview {
  const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    entityId,
    sourceProvider: "mock",
    sourceReviewId: id,
    authorDisplayName,
    rating,
    text,
    language: "en",
    publishedAt,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Demo review corpus. Deliberately includes: mixed sentiment per aspect,
 * a near-duplicate pair, and one spam-like review, so the review-engine
 * pipeline (spam/duplicate detection, sentiment, aspect extraction) has
 * realistic signal to work with even in demo mode.
 */
export const DEMO_REVIEWS: RawReview[] = [
  review("r1", "demo-mall-1", "Asha K.", 4, "Great mall with lots of stores. Parking was really hard to find on weekends, we circled for 20 minutes.", 3),
  review("r2", "demo-mall-1", "Ravi T.", 2, "Parking is a nightmare here, always full. Otherwise the food court is decent.", 5),
  review("r3", "demo-mall-1", "Meera S.", 5, "Loved the cleanliness of this mall, staff were very helpful and polite.", 10),
  review("r4", "demo-mall-1", "John D.", 3, "It gets extremely crowded on weekends, long queues at the billing counters.", 2),
  review("r5", "demo-mall-1", "Priya N.", 1, "Waiting time at the food court was over 40 minutes. Very disappointing.", 20),
  review("r6", "demo-mall-1", "Kiran V.", 5, "Clean washrooms and courteous staff. Will visit again.", 40),
  review("r7", "demo-mall-1", "Suresh P.", 2, "Prices at the food court are quite high compared to outside.", 60),
  review("r8", "demo-mall-1", "spamuser1", 5, "BEST DEALS EVER!!! Click here www.totally-legit-deals.example to win a prize now!!!", 1),
  review(
    "r9",
    "demo-mall-1",
    "Ravi T.",
    2,
    "Parking is a nightmare here, always full. Otherwise the food court is decent.",
    5,
  ),
  review("r10", "demo-mall-1", "Lakshmi R.", 4, "Good variety of stores, but the parking area needs more space and better signage.", 15),

  review("r11", "demo-restaurant-1", "Anand M.", 5, "Excellent food and quick service, staff were attentive throughout our visit.", 4),
  review("r12", "demo-restaurant-1", "Divya K.", 2, "Food was cold when it arrived and the waiting time was too long for a weekday.", 8),
  review("r13", "demo-restaurant-1", "Farhan A.", 4, "Great value for money, prices are reasonable for the portion sizes.", 12),
  review("r14", "demo-restaurant-1", "Neha S.", 5, "Very clean restaurant, loved the ambience and the staff were friendly.", 30),
  review("r15", "demo-restaurant-1", "Vikram J.", 3, "Crowded during lunch hours, had to wait 25 minutes for a table.", 6),

  review("r16", "demo-hospital-1", "Patient A.", 4, "Staff were professional and the waiting time for the outpatient department was reasonable.", 7),
  review("r17", "demo-hospital-1", "Patient B.", 2, "Parking near the hospital entrance is very limited, had to park far away.", 14),
  review("r18", "demo-hospital-1", "Patient C.", 5, "Hospital was clean and the nursing staff were very caring.", 25),
  review("r19", "demo-hospital-1", "Patient D.", 3, "Waiting time in the emergency section was longer than expected.", 3),

  review("r20", "demo-hotel-1", "Traveler A.", 5, "Rooms were spotless and the staff were extremely helpful during check-in.", 5),
  review("r21", "demo-hotel-1", "Traveler B.", 3, "Parking is chargeable and a bit far from the main entrance.", 18),
  review("r22", "demo-hotel-1", "Traveler C.", 4, "Good value for money, breakfast included was a nice touch.", 22),
  review("r23", "demo-hotel-1", "Traveler D.", 2, "Rooms were noisy at night due to street traffic.", 9),

  review("r24", "demo-attraction-1", "Visitor A.", 5, "Must see attraction, the historical architecture is stunning.", 11),
  review("r25", "demo-attraction-1", "Visitor B.", 4, "Gets crowded in the evenings, best visited early morning.", 16),
  review("r26", "demo-attraction-1", "Visitor C.", 3, "Limited accessibility for wheelchairs on the upper levels.", 45),
];
