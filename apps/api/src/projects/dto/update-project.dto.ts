import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'Updated Project Name',
    required: false,
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @Length(3, 50)
  name?: string;

  @ApiProperty({
    description: 'Project description',
    example: 'Updated description',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;
}
