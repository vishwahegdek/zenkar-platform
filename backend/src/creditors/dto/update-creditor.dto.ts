import { PartialType } from '@nestjs/mapped-types';
import { CreateCreditorDto } from './create-creditor.dto';

export class UpdateCreditorDto extends PartialType(CreateCreditorDto) {}
