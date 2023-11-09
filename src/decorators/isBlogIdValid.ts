import { BadRequestException, Injectable } from '@nestjs/common';
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { BlogExistValidator } from '../validation/BlogExistValidator';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsBlogIdValidConstraint implements ValidatorConstraintInterface {
  constructor(private blogExistValidator: BlogExistValidator) {}

  async validate(blogId: string) {
    const isValidUUIDv4 = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(blogId)
      if (!isValidUUIDv4) {
        throw new BadRequestException(`Invalid BlogId. It should be a valid uuid.`);
      }
    return await this.blogExistValidator.validate(blogId)
  }

  defaultMessage() {
    return 'Blog with id does not exist.';
  }
}

export function IsBlogIdValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBlogIdValidConstraint,
    });
  };
}

