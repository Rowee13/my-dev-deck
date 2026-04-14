# Demo Account Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an ephemeral "Try Demo" flow to My Dev Deck — one-click passwordless demo account with 1-hour TTL, seeded DevInbox data, and extensible seeder interface for future tools.

**Architecture:** Add `isDemo` flag to `User`. New `DemoModule` in the API owns: the passwordless `/api/auth/demo` endpoint, a `DemoSeeder` interface that each tool module implements, a `@BlockDemo()` decorator + guard, cap-enforcement helpers, and a 5-minute cron that cascade-deletes expired demo users. The web app adds a "Try Demo" button, a live countdown banner, cap indicators, and an "Inject test email" button.

**Tech Stack:** NestJS 11, Prisma 6, Postgres, `@nestjs/schedule` (new dep), `@nestjs/throttler`, passport-jwt, Next.js 16, React 19.

**Design doc:** `docs/plans/2026-04-15-demo-account-design.md`

**Reference design decisions (do not re-litigate):**
- TTL: 1 hour hard from `createdAt`
- Capability: L2 (sandbox writes, no real SMTP)
- Caps: 2 projects per demo user, 5 seeded + 20 injected emails per project
- Rate limit: 2 demo creations per IP per hour
- Env flag: `DEMO_MODE_ENABLED` (default `false`)
- Blocked routes (initial): `change-password`

**Conventions observed in this repo:**
- Tests are `*.spec.ts`, colocated with source, run via `pnpm --filter api test`
- Service errors use NestJS exceptions (`ForbiddenException`, `ConflictException`, etc.)
- Logging uses `Logger` from `@nestjs/common`
- Prisma models use `snake_case` `@map` for columns, `camelCase` in TS
- Web app pages live in `apps/web/app/`, dashboard in `apps/web/app/dashboard/`

---

## Phase 1 — Schema change

### Task 1: Add `isDemo` to User model

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (User model, around line 18–31)
- Create (generated): `apps/api/prisma/migrations/<timestamp>_add_is_demo_to_users/migration.sql`

**Step 1: Edit schema**

In `apps/api/prisma/schema.prisma`, add to the `User` model (right before the blank line that precedes `// Relations`):

```prisma
  isDemo    Boolean  @default(false) @map("is_demo")
```

Add an index so cleanup queries are fast:

```prisma
  @@map("users")
  @@index([isDemo, createdAt])
```

**Step 2: Create migration**

Run: `pnpm --filter api exec prisma migrate dev --name add_is_demo_to_users`

Expected: migration applied, Prisma Client regenerated, new folder under `apps/api/prisma/migrations/`.

**Step 3: Verify**

Run: `pnpm --filter api exec prisma format` then `pnpm --filter api check-types` (or `pnpm check-types`).
Expected: no errors.

**Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): add isDemo flag to users"
```

---

### Task 2: Expose `isDemo` from JWT strategies

The existing JWT strategies return `{ id, email, name }`. The `@BlockDemo` guard will read `req.user.isDemo`, so the strategies must surface it.

**Files:**
- Modify: `apps/api/src/auth/strategies/jwt.strategy.ts:20-30`
- Modify: `apps/api/src/auth/strategies/jwt-cookie.strategy.ts` (analogous `validate` method)
- Modify: `apps/api/src/auth/guards/jwt-auth.guard.ts:44-46` (update TUser default type)

**Step 1: Write the failing test**

Create `apps/api/src/auth/strategies/jwt.strategy.spec.ts` (if it doesn't exist) and add:

```ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => 'secret' } },
      ],
    }).compile();
    strategy = module.get(JwtStrategy);
  });

  it('returns isDemo on the authenticated user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'a@b.c', name: 'A', isDemo: true,
    });
    const result = await strategy.validate({ userId: 'u1', email: 'a@b.c' });
    expect(result).toEqual({ id: 'u1', email: 'a@b.c', name: 'A', isDemo: true });
  });
});
```

**Step 2: Run it to confirm it fails**

Run: `pnpm --filter api test -- jwt.strategy`
Expected: FAIL (current strategy does not select `isDemo`).

**Step 3: Update `jwt.strategy.ts` validate()**

Change the `select` to include `isDemo`:

```ts
select: { id: true, email: true, name: true, isDemo: true },
```

**Step 4: Apply the same change to `jwt-cookie.strategy.ts`** (mirror the `select` and any return typing).

**Step 5: Update the `TUser` default in `jwt-auth.guard.ts:44`**

```ts
handleRequest<TUser = { id: string; email: string; name: string | null; isDemo: boolean }>(
```

**Step 6: Run tests**

Run: `pnpm --filter api test`
Expected: all green.

**Step 7: Commit**

```bash
git add apps/api/src/auth
git commit -m "feat(api): expose isDemo on authenticated user"
```

---

## Phase 2 — Demo module core

### Task 3: Scaffold `DemoModule` and install `@nestjs/schedule`

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/demo/demo.module.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Install the scheduler**

Run: `pnpm --filter api add @nestjs/schedule`

**Step 2: Create `apps/api/src/demo/demo.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AuthModule],
  providers: [],
  controllers: [],
})
export class DemoModule {}
```

(Providers/controllers are added in later tasks.)

**Step 3: Register in `app.module.ts`**

Add `DemoModule` to the `imports` array.

**Step 4: Verify boot**

Run: `pnpm --filter api build`
Expected: no errors.

**Step 5: Commit**

```bash
git add apps/api/package.json apps/api/src/demo/demo.module.ts apps/api/src/app.module.ts pnpm-lock.yaml
git commit -m "feat(api): scaffold demo module"
```

---

### Task 4: Environment flag + config

**Files:**
- Modify: `apps/api/.env.example`
- Create: `apps/api/src/demo/demo.config.ts`

**Step 1: Add to `.env.example`**

```
# Demo mode (opt-in). When true, exposes POST /api/auth/demo and runs cleanup cron.
DEMO_MODE_ENABLED=false
# Demo account TTL in minutes
DEMO_TTL_MINUTES=60
# Max demo account creations per IP per hour
DEMO_RATE_LIMIT_PER_HOUR=2
```

**Step 2: Create `demo.config.ts`**

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DemoConfig {
  constructor(private config: ConfigService) {}

  get enabled(): boolean {
    return this.config.get('DEMO_MODE_ENABLED') === 'true';
  }

  get ttlMinutes(): number {
    return parseInt(this.config.get('DEMO_TTL_MINUTES') || '60', 10);
  }

  get rateLimitPerHour(): number {
    return parseInt(this.config.get('DEMO_RATE_LIMIT_PER_HOUR') || '2', 10);
  }
}
```

**Step 3: Add `DemoConfig` to `DemoModule` providers and exports.**

**Step 4: Commit**

```bash
git add apps/api/.env.example apps/api/src/demo
git commit -m "feat(api): add demo mode config"
```

---

### Task 5: `DemoSeeder` interface + registry

**Files:**
- Create: `apps/api/src/demo/demo-seeder.interface.ts`
- Create: `apps/api/src/demo/demo-seeder.registry.ts`
- Create: `apps/api/src/demo/demo-seeder.registry.spec.ts`

**Step 1: Write the failing test**

```ts
// demo-seeder.registry.spec.ts
import { Test } from '@nestjs/testing';
import { DemoSeederRegistry } from './demo-seeder.registry';
import { DemoSeeder, DEMO_SEEDER } from './demo-seeder.interface';

class FakeSeeder implements DemoSeeder {
  public called: string[] = [];
  async seed(userId: string) { this.called.push(userId); }
}

describe('DemoSeederRegistry', () => {
  it('runs every registered seeder in order', async () => {
    const a = new FakeSeeder();
    const b = new FakeSeeder();
    const module = await Test.createTestingModule({
      providers: [
        DemoSeederRegistry,
        { provide: DEMO_SEEDER, useValue: a },
        { provide: DEMO_SEEDER, useValue: b },
      ],
    }).compile();
    const reg = module.get(DemoSeederRegistry);
    await reg.seedAll('user-1');
    expect(a.called).toEqual(['user-1']);
    expect(b.called).toEqual(['user-1']);
  });
});
```

**Step 2: Run to confirm failure**

Run: `pnpm --filter api test -- demo-seeder.registry`
Expected: FAIL (files do not exist).

**Step 3: Implement interface**

`demo-seeder.interface.ts`:

```ts
export const DEMO_SEEDER = Symbol('DEMO_SEEDER');

export interface DemoSeeder {
  seed(userId: string): Promise<void>;
  getBlockedActions?(): string[];
}
```

**Step 4: Implement registry**

`demo-seeder.registry.ts`:

```ts
import { Inject, Injectable, Optional } from '@nestjs/common';
import { DEMO_SEEDER, DemoSeeder } from './demo-seeder.interface';

@Injectable()
export class DemoSeederRegistry {
  constructor(
    @Optional() @Inject(DEMO_SEEDER) private readonly seeders: DemoSeeder[] = [],
  ) {}

  async seedAll(userId: string): Promise<void> {
    for (const seeder of this.seeders) {
      await seeder.seed(userId);
    }
  }
}
```

> **Note:** NestJS multi-provider registration via `@Inject()` with a shared token. In `DemoModule` each seeder will be registered as `{ provide: DEMO_SEEDER, useClass: ..., multi: true }` style — for DI injection of arrays, use Nest's multi-inject pattern (`{ provide: DEMO_SEEDER, useExisting: ... }` and collect via a factory). If the simpler pattern fails, switch to the factory approach below in Task 8.

**Step 5: Register in `DemoModule`**

Add `DemoSeederRegistry` to providers and exports.

**Step 6: Run tests**

Run: `pnpm --filter api test -- demo-seeder`
Expected: PASS.

**Step 7: Commit**

```bash
git add apps/api/src/demo
git commit -m "feat(api): add demo seeder registry"
```

---

### Task 6: `@BlockDemo()` decorator + guard

**Files:**
- Create: `apps/api/src/demo/decorators/block-demo.decorator.ts`
- Create: `apps/api/src/demo/guards/block-demo.guard.ts`
- Create: `apps/api/src/demo/guards/block-demo.guard.spec.ts`

**Step 1: Write the failing test**

```ts
// block-demo.guard.spec.ts
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { BlockDemoGuard } from './block-demo.guard';
import { BLOCK_DEMO_KEY } from '../decorators/block-demo.decorator';

function ctx(user: any, blocked: boolean) {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(blocked);
  const guard = new BlockDemoGuard(reflector);
  const exec: any = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
  return { guard, exec };
}

describe('BlockDemoGuard', () => {
  it('allows non-demo users on blocked routes', () => {
    const { guard, exec } = ctx({ id: 'u', isDemo: false }, true);
    expect(guard.canActivate(exec)).toBe(true);
  });
  it('blocks demo users on blocked routes', () => {
    const { guard, exec } = ctx({ id: 'u', isDemo: true }, true);
    expect(() => guard.canActivate(exec)).toThrow(ForbiddenException);
  });
  it('allows demo users on non-blocked routes', () => {
    const { guard, exec } = ctx({ id: 'u', isDemo: true }, false);
    expect(guard.canActivate(exec)).toBe(true);
  });
});
```

**Step 2: Run to confirm failure**

Run: `pnpm --filter api test -- block-demo`
Expected: FAIL.

**Step 3: Implement decorator**

```ts
// block-demo.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const BLOCK_DEMO_KEY = 'blockDemo';
export const BlockDemo = () => SetMetadata(BLOCK_DEMO_KEY, true);
```

**Step 4: Implement guard**

```ts
// block-demo.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BLOCK_DEMO_KEY } from '../decorators/block-demo.decorator';

@Injectable()
export class BlockDemoGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const blocked = this.reflector.getAllAndOverride<boolean>(BLOCK_DEMO_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!blocked) return true;
    const req = context.switchToHttp().getRequest();
    if (req.user?.isDemo) {
      throw new ForbiddenException('Not available in demo mode');
    }
    return true;
  }
}
```

**Step 5: Register the guard globally via `APP_GUARD` in `DemoModule`**

```ts
import { APP_GUARD } from '@nestjs/core';
// in providers:
{ provide: APP_GUARD, useClass: BlockDemoGuard },
```

**Step 6: Apply `@BlockDemo()` to `change-password`**

Modify `apps/api/src/auth/auth.controller.ts:162` (the `changePassword` handler) — import `BlockDemo` and add the decorator above `@Post('change-password')`.

**Step 7: Run tests**

Run: `pnpm --filter api test`
Expected: all green.

**Step 8: Commit**

```bash
git add apps/api/src/demo apps/api/src/auth/auth.controller.ts
git commit -m "feat(api): add BlockDemo decorator and guard"
```

---

### Task 7: Passwordless demo creation endpoint

**Files:**
- Create: `apps/api/src/demo/demo.service.ts`
- Create: `apps/api/src/demo/demo.service.spec.ts`
- Create: `apps/api/src/demo/demo.controller.ts`

**Step 1: Write the failing service test**

```ts
// demo.service.spec.ts — minimum shape, expand as you implement
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoConfig } from './demo.config';
import { DemoSeederRegistry } from './demo-seeder.registry';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('DemoService', () => {
  const makeModule = async (enabled: boolean) => {
    const prisma = {
      user: { create: jest.fn().mockResolvedValue({ id: 'u1', email: 'demo-x@demo.local', name: 'Demo User', isDemo: true }) },
    };
    const auth = {
      hashPassword: jest.fn().mockResolvedValue('hashed'),
      login: jest.fn(),
    };
    const registry = { seedAll: jest.fn() };
    const config = { enabled, ttlMinutes: 60 };
    const module = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: auth },
        { provide: DemoSeederRegistry, useValue: registry },
        { provide: DemoConfig, useValue: config },
      ],
    }).compile();
    return { svc: module.get(DemoService), prisma, auth, registry };
  };

  it('throws NotFound when demo mode disabled', async () => {
    const { svc } = await makeModule(false);
    await expect(svc.createDemoUser()).rejects.toThrow(NotFoundException);
  });

  it('creates a demo user with unusable password, isDemo=true, then seeds', async () => {
    const { svc, prisma, registry } = await makeModule(true);
    await svc.createDemoUser();
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isDemo: true }),
    }));
    expect(registry.seedAll).toHaveBeenCalledWith('u1');
  });
});
```

**Step 2: Run to confirm failure**

Run: `pnpm --filter api test -- demo.service`
Expected: FAIL.

**Step 3: Implement `DemoService`**

```ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DemoConfig } from './demo.config';
import { DemoSeederRegistry } from './demo-seeder.registry';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private config: DemoConfig,
    private seeders: DemoSeederRegistry,
  ) {}

  async createDemoUser() {
    if (!this.config.enabled) {
      throw new NotFoundException();
    }

    // Random 32-byte password that is never returned or usable for login.
    const unusablePassword = randomBytes(32).toString('hex');
    const hashed = await this.auth.hashPassword(unusablePassword);

    const user = await this.prisma.user.create({
      data: {
        email: `demo-${randomUUID().slice(0, 8)}@demo.local`,
        password: hashed,
        name: 'Demo User',
        isDemo: true,
      },
      select: { id: true, email: true, name: true, isDemo: true, createdAt: true },
    });

    await this.seeders.seedAll(user.id);

    this.logger.log(`Demo user created: ${user.id}`);
    return user;
  }
}
```

**Step 4: Add `issueTokens` helper to `AuthService`** (or reuse existing private methods)

`AuthService` currently only issues tokens via `login(dto)`. We need a method that issues tokens for a known user without validating a password. In `auth.service.ts`, add:

```ts
async issueTokensForUser(user: { id: string; email: string; name: string | null }) {
  const accessToken = await this['generateAccessToken'](user.id, user.email);
  const refreshToken = await this['generateRefreshToken'](user.id);
  this.logger.log(`Tokens issued for user: ${user.email}`);
  return { accessToken, refreshToken, user };
}
```

(Or make `generateAccessToken`/`generateRefreshToken` non-private if cleaner — pick one approach.)

**Step 5: Implement `DemoController`**

```ts
import { Controller, Post, HttpCode, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { DemoService } from './demo.service';
import { DemoConfig } from './demo.config';

@ApiTags('auth')
@Controller('api/auth')
export class DemoController {
  constructor(
    private demo: DemoService,
    private auth: AuthService,
    private config: DemoConfig,
  ) {}

  @Public()
  @Post('demo')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 2, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: 'Create a passwordless demo account' })
  async createDemo(@Res({ passthrough: true }) res: Response) {
    const user = await this.demo.createDemoUser();
    const tokens = await this.auth.issueTokensForUser({
      id: user.id, email: user.email, name: user.name,
    });
    this.auth.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    const ttlMinutes = this.config.ttlMinutes;
    const expiresAt = new Date(user.createdAt.getTime() + ttlMinutes * 60_000);
    return {
      user: { ...user, expiresAt },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
```

**Step 6: Register controller + service in `DemoModule`**

Add `DemoService` to providers, `DemoController` to controllers.

**Step 7: Run tests**

Run: `pnpm --filter api test`
Expected: all green.

**Step 8: Manual smoke**

```bash
DEMO_MODE_ENABLED=true pnpm --filter api start:dev
# in another shell:
curl -X POST http://localhost:4000/api/auth/demo -i
```

Expected: 201 with cookies set and body containing `user.isDemo: true`.

**Step 9: Commit**

```bash
git add apps/api/src
git commit -m "feat(api): add passwordless demo account endpoint"
```

---

### Task 8: DevInbox demo seeder

**Files:**
- Create: `apps/api/src/demo/seeders/devinbox-demo.seeder.ts`
- Create: `apps/api/src/demo/seeders/devinbox-demo.seeder.spec.ts`
- Create: `apps/api/src/demo/seeders/sample-emails.ts`

**Step 1: Create sample email fixtures**

`sample-emails.ts` — export an array of 5 sample emails with clearly-fake content (welcome, password-reset, receipt, newsletter, attachment). Every `from` address should be `noreply@example.com` or similar fake domain; every `href` should be `#`; no real URLs, no tracking pixels, no PII.

**Step 2: Write the failing seeder test**

```ts
// devinbox-demo.seeder.spec.ts
import { Test } from '@nestjs/testing';
import { DevInboxDemoSeeder } from './devinbox-demo.seeder';
import { PrismaService } from '../../prisma/prisma.service';

describe('DevInboxDemoSeeder', () => {
  it('creates the demo-inbox project and 5 emails', async () => {
    const prisma = {
      project: { create: jest.fn().mockResolvedValue({ id: 'p1', slug: 'demo-inbox' }) },
      email: { createMany: jest.fn().mockResolvedValue({ count: 5 }) },
    };
    const module = await Test.createTestingModule({
      providers: [
        DevInboxDemoSeeder,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    await module.get(DevInboxDemoSeeder).seed('user-1');
    expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'user-1', slug: expect.stringContaining('demo-inbox') }),
    }));
    expect(prisma.email.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([expect.any(Object)]),
    }));
    const createManyCall = prisma.email.createMany.mock.calls[0][0];
    expect(createManyCall.data).toHaveLength(5);
  });
});
```

> **Note:** `slug` is globally `@unique` in the schema, so per-user seed slug must be unique per demo user. Use `demo-inbox-<short>` where `<short>` is 6 chars from `randomUUID()`.

**Step 3: Run to confirm failure**

Run: `pnpm --filter api test -- devinbox-demo.seeder`
Expected: FAIL.

**Step 4: Implement seeder**

```ts
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DemoSeeder } from '../demo-seeder.interface';
import { SAMPLE_EMAILS } from './sample-emails';

@Injectable()
export class DevInboxDemoSeeder implements DemoSeeder {
  constructor(private prisma: PrismaService) {}

  async seed(userId: string): Promise<void> {
    const suffix = randomUUID().slice(0, 6);
    const project = await this.prisma.project.create({
      data: {
        userId,
        slug: `demo-inbox-${suffix}`,
        name: 'Demo Inbox',
        description: 'Your personal demo project. Explore — this is temporary.',
      },
    });

    await this.prisma.email.createMany({
      data: SAMPLE_EMAILS.map((sample) => ({
        projectId: project.id,
        from: sample.from,
        to: sample.to,
        subject: sample.subject,
        bodyText: sample.bodyText,
        bodyHtml: sample.bodyHtml,
        headers: sample.headers,
      })),
    });
  }
}
```

**Step 5: Register in `DemoModule`**

Add to providers:

```ts
{ provide: DEMO_SEEDER, useClass: DevInboxDemoSeeder },
```

And adjust `DemoSeederRegistry` to collect all providers registered under this token. Because NestJS does not natively support "inject all providers sharing a token" the clean pattern is:

```ts
// In DemoModule:
{
  provide: 'DEMO_SEEDERS_ARRAY',
  useFactory: (...seeders: DemoSeeder[]) => seeders,
  inject: [DevInboxDemoSeeder /* , FutureToolSeeder, ... */],
},
```

Then update `DemoSeederRegistry` to inject `'DEMO_SEEDERS_ARRAY'` instead of the `DEMO_SEEDER` symbol. Update Task 5's test accordingly if you need to (pass a concrete array via the factory token). If you already implemented Task 5 with the symbol pattern and it works, keep it.

**Step 6: Run tests**

Run: `pnpm --filter api test`
Expected: all green.

**Step 7: Smoke check**

Restart API (`DEMO_MODE_ENABLED=true`), call `/api/auth/demo`, verify the demo-inbox project and 5 emails exist for the new user.

**Step 8: Commit**

```bash
git add apps/api/src/demo
git commit -m "feat(api): add DevInbox demo seeder"
```

---

### Task 9: Resource caps in `ProjectsService`

**Files:**
- Modify: `apps/api/src/projects/projects.service.ts:15-38` (`create` method)
- Modify: `apps/api/src/projects/projects.controller.ts` (pass `isDemo` through)
- Create: `apps/api/src/projects/projects.service.spec.ts` (if absent — add a targeted test)

**Step 1: Write the failing test**

Add a test that verifies: when `isDemo=true` and the user already has 2 projects, `create()` throws `ForbiddenException` with a demo-aware message.

**Step 2: Run to confirm failure**

Run: `pnpm --filter api test -- projects.service`
Expected: FAIL.

**Step 3: Update `ProjectsService.create` signature**

Change:

```ts
async create(userId: string, dto: CreateProjectDto, isDemo = false)
```

Before attempting the Prisma create, if `isDemo`:

```ts
if (isDemo) {
  const count = await this.prisma.project.count({ where: { userId } });
  if (count >= 2) {
    throw new ForbiddenException('Demo accounts are limited to 2 projects. Sign up to create more.');
  }
}
```

**Step 4: Update the controller to pass `req.user.isDemo`**

In `projects.controller.ts` the `create` handler, pass `req.user.isDemo` as the third argument.

**Step 5: Run tests**

Run: `pnpm --filter api test`
Expected: all green.

**Step 6: Commit**

```bash
git add apps/api/src/projects
git commit -m "feat(api): enforce 2-project cap for demo accounts"
```

---

### Task 10: Inject-test-email endpoint

**Files:**
- Create: `apps/api/src/demo/demo-emails.controller.ts`
- Modify: `apps/api/src/demo/demo.service.ts` (add `injectTestEmail`)
- Modify: `apps/api/src/demo/demo.service.spec.ts`
- Create: `apps/api/src/demo/seeders/injectable-emails.ts` (pool of ~10 fake emails)

**Step 1: Write the failing service test**

Service test covers:
- Non-demo user → `ForbiddenException`
- Project not owned by user → `NotFoundException`
- Cap reached (20 injected) → `ForbiddenException`
- Happy path → one email row created

**Step 2: Run to confirm failure**

Run: `pnpm --filter api test -- demo.service`
Expected: FAIL.

**Step 3: Implement `injectTestEmail(userId, isDemo, projectId)`**

Enforce: `isDemo` required; verify project ownership; count existing emails for the project; if count – seededCount ≥ 20, throw; else pick a random template from the pool and insert a new row.

> For cap accounting, the simplest rule is: *any* email row with `from` in a special "injected" sender domain (e.g., `@inject.demo.local`) counts. That avoids needing a separate marker column. Choose this or a dedicated boolean — note the trade-off in the commit message.

**Step 4: Implement controller**

```ts
// demo-emails.controller.ts
@ApiTags('demo')
@Controller('api/projects')
export class DemoEmailsController {
  constructor(private demo: DemoService) {}

  @Post(':id/demo/inject-email')
  @HttpCode(HttpStatus.CREATED)
  async inject(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string; isDemo: boolean };
    return this.demo.injectTestEmail(user.id, user.isDemo, id);
  }
}
```

**Step 5: Register controller in `DemoModule`**

**Step 6: Run tests**

Run: `pnpm --filter api test`
Expected: all green.

**Step 7: Commit**

```bash
git add apps/api/src/demo
git commit -m "feat(api): add demo inject-test-email endpoint"
```

---

### Task 11: Cleanup cron

**Files:**
- Create: `apps/api/src/demo/demo-cleanup.service.ts`
- Create: `apps/api/src/demo/demo-cleanup.service.spec.ts`

**Step 1: Write the failing test**

Verify: when `config.enabled=false`, the handler is a no-op. When enabled, `prisma.user.deleteMany` is called with the right filter (`isDemo: true, createdAt: { lt: <ttl-cutoff> }`).

**Step 2: Run to confirm failure**

Run: `pnpm --filter api test -- demo-cleanup`
Expected: FAIL.

**Step 3: Implement service**

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DemoConfig } from './demo.config';

@Injectable()
export class DemoCleanupService {
  private readonly logger = new Logger(DemoCleanupService.name);

  constructor(private prisma: PrismaService, private config: DemoConfig) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCleanup() {
    if (!this.config.enabled) return;
    const cutoff = new Date(Date.now() - this.config.ttlMinutes * 60_000);
    const result = await this.prisma.user.deleteMany({
      where: { isDemo: true, createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired demo user(s)`);
    }
  }
}
```

**Step 4: Register in `DemoModule`**

**Step 5: Run tests**

Run: `pnpm --filter api test`
Expected: all green.

**Step 6: Commit**

```bash
git add apps/api/src/demo
git commit -m "feat(api): add demo cleanup cron"
```

---

### Task 12: Surface expiration on `GET /api/auth/me`

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts:248-265` (`getCurrentUser`)

**Step 1: Update `select` to include `isDemo` and `createdAt`.**

**Step 2: Return `expiresAt` when `user.isDemo`**

Inject `DemoConfig` into `AuthService`, or inline a TTL read. Preferably the former — add `DemoConfig` to `AuthModule` imports/providers (via `DemoModule` export).

Return shape:
```ts
return {
  ...user,
  ...(user.isDemo
    ? { expiresAt: new Date(user.createdAt.getTime() + ttlMinutes * 60_000) }
    : {}),
};
```

**Step 3: Commit**

```bash
git add apps/api/src
git commit -m "feat(api): surface demo expiresAt on /auth/me"
```

---

## Phase 3 — Web UI

### Task 13: "Try Demo" button on login page

**Files:**
- Modify: `apps/web/app/login/page.tsx` (or equivalent — read the file to find the exact location)
- Modify: `apps/web/lib/api.ts` (or wherever the API client lives — check `apps/web/lib/`)

**Step 1: Read existing login page and API client to understand patterns.**

**Step 2: Add a `tryDemo()` client that calls `POST /api/auth/demo`.**

**Step 3: Add a "Try Demo" button below the login form.**

Visibility: hide the button if `NEXT_PUBLIC_DEMO_MODE_ENABLED !== 'true'`. (Add env var to `apps/web/.env.example`.) On click: call `tryDemo()`, on success redirect to `/dashboard`, on 429 show a clear message ("Demo limit reached, try again later"), on 404 hide the button permanently for this session.

**Step 4: Commit**

```bash
git add apps/web
git commit -m "feat(web): add Try Demo button on login page"
```

---

### Task 14: Demo countdown banner

**Files:**
- Create: `apps/web/components/demo-banner.tsx`
- Modify: `apps/web/app/dashboard/layout.tsx` (or root dashboard layout — locate first)

**Step 1: Implement `DemoBanner` component**

Reads `user.isDemo` and `user.expiresAt` (from an existing user context — check `apps/web/contexts/`). Renders nothing when `!user.isDemo`. Otherwise shows: "Demo expires in {mm}m {ss}s — [Sign up to keep your data]". Updates every second via `setInterval`. When countdown hits 0, redirect to `/login?expired=1`.

**Step 2: Mount in dashboard layout.**

**Step 3: Commit**

```bash
git add apps/web
git commit -m "feat(web): add demo countdown banner"
```

---

### Task 15: Cap indicators and "Inject test email" button

**Files:**
- Modify: `apps/web/app/dashboard/projects/page.tsx` (or wherever the project list lives — locate first)
- Modify: the single-project view

**Step 1: On projects list page, when `user.isDemo`, show `{count}/2 projects used` next to the "Create project" button. Disable the button and show a tooltip when `count >= 2`.**

**Step 2: On single-project page, when `user.isDemo`, render an "Inject test email" button. On click, POST to `/api/projects/:id/demo/inject-email` and refresh email list.**

**Step 3: Commit**

```bash
git add apps/web
git commit -m "feat(web): demo cap indicators and inject-email button"
```

---

## Phase 4 — Verification

### Task 16: End-to-end manual smoke

**Step 1: Set up**

```bash
# In apps/api/.env
DEMO_MODE_ENABLED=true
# In apps/web/.env.local
NEXT_PUBLIC_DEMO_MODE_ENABLED=true
```

Run: `pnpm dev`

**Step 2: Scenarios to verify**

- [ ] Click "Try Demo" on login page → lands in dashboard with demo-inbox project visible, 5 seeded emails
- [ ] Countdown banner visible, counts down
- [ ] Can create a 2nd project — seeing `2/2` afterward
- [ ] Cannot create a 3rd project (UI disabled; curl against API also returns 403)
- [ ] "Inject test email" button adds a new email to the list
- [ ] Can inject up to 20 then gets blocked
- [ ] `change-password` route returns 403 in demo session
- [ ] Wait for (or force) cleanup by setting `DEMO_TTL_MINUTES=0` briefly — cron deletes the user, next `/me` returns 401
- [ ] With `DEMO_MODE_ENABLED=false`, `/api/auth/demo` returns 404 and button is hidden
- [ ] Rate limit: creating 3 demo accounts from the same IP within an hour → 3rd returns 429

**Step 3: Fix any regressions, then:**

```bash
pnpm --filter api test
pnpm --filter api check-types
pnpm --filter web check-types
pnpm lint
```

Expected: all green.

**Step 4: Commit any fixes**

```bash
git commit -m "fix: address demo mode smoke-test findings"
```

---

## Verification checklist before finishing

- [ ] All unit tests pass: `pnpm --filter api test`
- [ ] Type checks pass: `pnpm check-types`
- [ ] Lint passes: `pnpm lint`
- [ ] Build passes: `pnpm build`
- [ ] Manual smoke (Task 16) all scenarios green
- [ ] `DEMO_MODE_ENABLED=false` (default) behaves as if this feature doesn't exist — no new routes reachable, no cron running, no UI button
- [ ] All sample email content is clearly fake, no real URLs/PII/secrets
- [ ] README or docs mention demo mode env vars (optional but nice)

After all boxes are ticked, use `superpowers:finishing-a-development-branch` to decide integration path.
