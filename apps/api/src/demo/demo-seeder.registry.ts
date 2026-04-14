import { Injectable } from '@nestjs/common';
import { DemoSeeder } from './demo-seeder.interface';

/**
 * Aggregates all tool-specific DemoSeeder implementations and runs them in
 * sequence for a given user.
 *
 * Seeders are provided via constructor injection so that DemoModule can wire
 * them up through a factory provider (see Task 8). This avoids the
 * Nest multi-provider token ambiguity that arises when several providers share
 * the same DI token.
 */
@Injectable()
export class DemoSeederRegistry {
  constructor(private readonly seeders: DemoSeeder[] = []) {}

  async seedAll(userId: string): Promise<void> {
    for (const seeder of this.seeders) {
      await seeder.seed(userId);
    }
  }
}
