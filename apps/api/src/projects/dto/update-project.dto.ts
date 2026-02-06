import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @Length(3, 50)
  name?: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;
}
