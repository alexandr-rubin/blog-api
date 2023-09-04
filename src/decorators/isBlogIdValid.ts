import { Injectable } from '@nestjs/common';
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { BlogExistValidator } from '../validation/BlogExistValidator';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsBlogIdValidConstraint implements ValidatorConstraintInterface {
  constructor(private blogExistValidator: BlogExistValidator) {}

  async validate(blogId: string) {
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

