import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createProjectDto: CreateProjectDto, isDemo = false) {
    if (isDemo) {
      const count = await this.prisma.project.count({ where: { userId } });
      if (count >= 2) {
        throw new ForbiddenException(
          'Demo accounts are limited to 2 projects. Sign up to create more.',
        );
      }
    }

    try {
      const project = await this.prisma.project.create({
        data: {
          userId,
          name: createProjectDto.name,
          slug: createProjectDto.slug.toLowerCase(),
          description: createProjectDto.description,
        },
      });

      return project;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Project with slug "${createProjectDto.slug}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { emails: true },
        },
      },
    });

    return projects;
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { emails: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    return project;
  }

  async findBySlug(userId: string, slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug: slug.toLowerCase(), userId },
    });

    return project;
  }

  /**
   * Find project by slug without user verification (for SMTP server)
   */
  async findBySlugPublic(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    return project;
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto) {
    // Verify ownership first
    await this.findOne(userId, id);

    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: updateProjectDto,
      });

      return project;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Project with ID "${id}" not found`);
      }
      throw error;
    }
  }

  async remove(userId: string, id: string) {
    // Verify ownership first
    await this.findOne(userId, id);

    try {
      await this.prisma.project.delete({
        where: { id },
      });

      return { message: 'Project deleted successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Project with ID "${id}" not found`);
      }
      throw error;
    }
  }
}
