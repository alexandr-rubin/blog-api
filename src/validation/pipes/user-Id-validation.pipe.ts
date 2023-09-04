import { Injectable, PipeTransform, ArgumentMetadata, NotFoundException, BadRequestException } from "@nestjs/common";
import { UserExistValidator } from "../UserExistValidator";

@Injectable()
export class UserIdValidationPipe implements PipeTransform {
  constructor(private readonly userIdExistValidator: UserExistValidator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const { type, data } = metadata;
    if (type === 'param' && data === 'userId') {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(value);
      if (!isValidObjectId) {
        throw new BadRequestException(`Invalid ${data}. It should be a valid ObjectId.`);
      }

      const isValid = await this.userIdExistValidator.validate(value);
      if (!isValid) {
        throw new NotFoundException(`User with id "${value}" does not exist.`);
      }
    }

    return value;
  }
}