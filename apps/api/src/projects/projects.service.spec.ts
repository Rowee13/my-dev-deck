import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: {
    project: {
      create: jest.Mock;
      count: jest.Mock;
    };
  };

  const dto = {
    name: 'Test Project',
    slug: 'Test-Slug',
    description: 'desc',
  };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('create - demo account cap', () => {
    it('allows a demo user to create when they have fewer than 2 projects', async () => {
      prisma.project.count.mockResolvedValue(1);
      prisma.project.create.mockResolvedValue({ id: 'p1' });

      const result = await service.create('user-1', dto, true);

      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.project.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'p1' });
    });

    it('throws ForbiddenException when demo user already has 2 projects', async () => {
      prisma.project.count.mockResolvedValue(2);

      await expect(service.create('user-1', dto, true)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create('user-1', dto, true)).rejects.toThrow(
        'Demo accounts are limited to 2 projects. Sign up to create more.',
      );

      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('does not apply cap for non-demo users regardless of count', async () => {
      prisma.project.create.mockResolvedValue({ id: 'p99' });

      const result = await service.create('user-1', dto, false);

      expect(prisma.project.count).not.toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'p99' });
    });

    it('defaults isDemo to false (no cap) when omitted', async () => {
      prisma.project.create.mockResolvedValue({ id: 'p2' });

      await service.create('user-1', dto);

      expect(prisma.project.count).not.toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalled();
    });
  });
});
