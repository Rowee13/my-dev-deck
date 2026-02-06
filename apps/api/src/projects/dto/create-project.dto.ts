import { IsString, IsNotEmpty, IsOptional, Matches, Length } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must be lowercase alphanumeric with hyphens only',
  })
  slug: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;
}
