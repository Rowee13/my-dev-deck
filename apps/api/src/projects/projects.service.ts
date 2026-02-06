import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      const project = await this.prisma.project.create({
        data: {
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

  async findAll() {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { emails: true },
        },
      },
    });

    return projects;
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
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

  async findBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
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

  async remove(id: string) {
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
