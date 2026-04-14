/**
 * Token kept for forward compatibility with potential Nest multi-provider
 * wiring, but not used for DI injection of the registry (see
 * DemoSeederRegistry, which uses a factory-based approach to collect seeders).
 */
export const DEMO_SEEDER = Symbol('DEMO_SEEDER');

/**
 * Contract implemented by each tool-specific demo seeder.
 *
 * Each seeder is responsible for populating realistic sample data scoped to
 * the given userId when a demo account is (re)created.
 */
export interface DemoSeeder {
  /**
   * Seed demo data for the given user.
   */
  seed(userId: string): Promise<void>;

  /**
   * Optional list of action identifiers this seeder considers blocked for
   * demo accounts (e.g. destructive or external-effect operations).
   */
  getBlockedActions?(): string[];
}
