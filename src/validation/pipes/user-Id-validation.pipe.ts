import { Injectable, PipeTransform, ArgumentMetadata, NotFoundException, BadRequestException } from "@nestjs/common";
import { UserExistValidator } from "../UserExistValidator";

@Injectable()
export class UserIdValidationPipe implements PipeTransform {
  constructor(private readonly userIdExistValidator: UserExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'userId') {
      const isValidUUIDv4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
      if (!isValidUUIDv4) {
        throw new BadRequestException(`Invalid ${data}. It should be a valid uuid.`);
      }

      const isValid = await this.userIdExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`User with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}