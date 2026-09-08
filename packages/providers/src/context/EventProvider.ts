export interface LocalEvent {
  id: string;
  entityId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  source: string;
  isDemoData: boolean;
}

/** Optional context provider - events are never required for a briefing to render. */
export interface EventProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  getUpcomingEventsForEntity(entityId: string): Promise<LocalEvent[]>;
}

export class MockEventProvider implements EventProvider {
  readonly name = "mock";
  readonly isConfigured = true;

  async getUpcomingEventsForEntity(_entityId: string): Promise<LocalEvent[]> {
    return [];
  }
}
