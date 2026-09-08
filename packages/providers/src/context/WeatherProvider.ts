import type { GeoPoint } from "@locaguide/contracts";

export interface WeatherSnapshot {
  location: GeoPoint;
  conditions: string;
  temperatureCelsius: number;
  observedAt: string;
  source: string;
  isDemoData: boolean;
}

/** Optional context provider - weather is never required for a briefing to render. */
export interface WeatherProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  getCurrentWeather(location: GeoPoint): Promise<WeatherSnapshot | null>;
}

export class MockWeatherProvider implements WeatherProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  async getCurrentWeather(location: GeoPoint): Promise<WeatherSnapshot | null> {
    return {
      location,
      conditions: "Partly cloudy",
      temperatureCelsius: 28,
      observedAt: new Date().toISOString(),
      source: "mock",
      isDemoData: true,
    };
  }
}
