import { DemoSeederRegistry } from './demo-seeder.registry';
import { DemoSeeder } from './demo-seeder.interface';

class FakeSeeder implements DemoSeeder {
  public called: string[] = [];
  async seed(userId: string): Promise<void> {
    this.called.push(userId);
  }
}

describe('DemoSeederRegistry', () => {
  it('runs every registered seeder with the given userId', async () => {
    const a = new FakeSeeder();
    const b = new FakeSeeder();
    const registry = new DemoSeederRegistry([a, b]);

    await registry.seedAll('user-1');

    expect(a.called).toEqual(['user-1']);
    expect(b.called).toEqual(['user-1']);
  });

  it('invokes seeders in registration order', async () => {
    const order: string[] = [];
    const a: DemoSeeder = {
      async seed() {
        order.push('a');
      },
    };
    const b: DemoSeeder = {
      async seed() {
        order.push('b');
      },
    };
    const c: DemoSeeder = {
      async seed() {
        order.push('c');
      },
    };
    const registry = new DemoSeederRegistry([a, b, c]);

    await registry.seedAll('user-2');

    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('awaits each seeder sequentially (not in parallel)', async () => {
    const events: string[] = [];
    const makeSeeder = (name: string): DemoSeeder => ({
      async seed() {
        events.push(`${name}:start`);
        await new Promise((resolve) => setTimeout(resolve, 10));
        events.push(`${name}:end`);
      },
    });
    const registry = new DemoSeederRegistry([
      makeSeeder('a'),
      makeSeeder('b'),
    ]);

    await registry.seedAll('user-3');

    expect(events).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });

  it('no-ops when no seeders are registered', async () => {
    const registry = new DemoSeederRegistry([]);
    await expect(registry.seedAll('user-4')).resolves.toBeUndefined();
  });
});
