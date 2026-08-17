import { IsIn, IsString } from 'class-validator';
import { CREDIT_PACKAGES } from '@vibra/types';

const PACKAGE_IDS = CREDIT_PACKAGES.map((p) => p.id);

export class CreateCreditPurchaseDto {
  @IsString()
  @IsIn(PACKAGE_IDS)
  packageId!: (typeof CREDIT_PACKAGES)[number]['id'];
}
