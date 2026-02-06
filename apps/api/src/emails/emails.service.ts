import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailsService {
  constructor(private prisma: PrismaService) {}

  // Methods will be implemented in Phase 3
}
