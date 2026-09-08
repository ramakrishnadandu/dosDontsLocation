import { loadAIConfig, loadEnv, loadPolicyConfig } from "@locaguide/config";
import { PolicyEngine } from "@locaguide/domain";
import {
  AIRouter,
  AmazonProductProvider,
  AnthropicProvider,
  GooglePlacesProvider,
  GoogleReviewProvider,
  MockAIProvider,
  MockDealProvider,
  MockLocationProvider,
  MockProductProvider,
  MockReviewProvider,
  OllamaProvider,
  OpenAIProvider,
  RoutingLocationProvider,
  type AIProvider,
  type DealProvider,
  type LocationProvider,
  type ProductProvider,
  type ReviewProvider,
} from "@locaguide/providers";
import { prisma } from "@locaguide/db";
import { CommunityReviewProvider } from "./CommunityReviewProvider";

/**
 * Central composition point for every provider-agnostic interface (section
 * 9 & 10). Selection logic: use the real provider only if BOTH a credential
 * is present AND the Policy Engine allow-lists it; otherwise fall back to
 * the mock provider so the product always runs in demo mode.
 */
export interface ProviderRegistry {
  locationProvider: LocationProvider;
  reviewProviders: ReviewProvider[];
  productProvider: ProductProvider;
  dealProvider: DealProvider;
  aiRouter: AIRouter;
  policyEngine: PolicyEngine;
}

let cached: ProviderRegistry | undefined;

export function buildProviderRegistry(): ProviderRegistry {
  if (cached) return cached;

  const env = loadEnv();
  const policyConfig = loadPolicyConfig(env.POLICY_CONFIG_PATH);
  const policyEngine = new PolicyEngine(policyConfig);
  const aiConfig = loadAIConfig(env.AI_CONFIG_PATH);

  const googlePlaces = new GooglePlacesProvider(env.GOOGLE_PLACES_API_KEY);
  const mockLocation = new MockLocationProvider();
  const googlePlacesEnabled = googlePlaces.isConfigured && policyEngine.isLocationProviderAllowed(googlePlaces.name);
  // A real provider AUGMENTS demo mode rather than replacing it - demo
  // entity ids ("demo-*") must stay resolvable even once a real credential
  // is configured, since community opinions/saved locations/evidence may
  // already reference them. See RoutingLocationProvider's doc comment.
  const locationProvider: LocationProvider = new RoutingLocationProvider(
    mockLocation,
    googlePlacesEnabled ? googlePlaces : null,
  );

  const reviewProviders: ReviewProvider[] = [];
  const mockReviews = new MockReviewProvider();
  if (policyEngine.isReviewProviderAllowed(mockReviews.name)) reviewProviders.push(mockReviews);
  const communityReviews = new CommunityReviewProvider(prisma);
  if (policyEngine.isReviewProviderAllowed(communityReviews.name)) reviewProviders.push(communityReviews);
  const googleReviews = new GoogleReviewProvider(env.GOOGLE_PLACES_API_KEY);
  if (googleReviews.isConfigured && policyEngine.isReviewProviderAllowed(googleReviews.name)) {
    reviewProviders.push(googleReviews);
  }

  const amazon = new AmazonProductProvider(env.AMAZON_API_KEY, env.AMAZON_API_SECRET);
  const productProvider: ProductProvider =
    amazon.isConfigured && policyEngine.isProductProviderAllowed(amazon.name) ? amazon : new MockProductProvider();

  const aiProviders: Record<string, AIProvider> = {
    mock: new MockAIProvider(),
    openai: new OpenAIProvider(env.OPENAI_API_KEY),
    anthropic: new AnthropicProvider(env.ANTHROPIC_API_KEY),
    ollama: new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL),
  };
  const aiRouter = new AIRouter(aiProviders, aiConfig);
  const dealProvider: DealProvider = new MockDealProvider();

  cached = { locationProvider, reviewProviders, productProvider, dealProvider, aiRouter, policyEngine };
  return cached;
}

export function resetProviderRegistryForTests(): void {
  cached = undefined;
}
