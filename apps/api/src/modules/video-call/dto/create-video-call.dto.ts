import { IsUUID } from 'class-validator';

export class CreateVideoCallDto {
  @IsUUID()
  modelId!: string;
}
