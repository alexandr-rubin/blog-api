import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { EmailConfirmationCodeValidator } from '../EmailConfirmationCodeValidator';

@Injectable()
export class EmailConfirmationCodePipe implements PipeTransform {
  constructor(private readonly validator: EmailConfirmationCodeValidator) {}

  async transform(value: any) {
    if (typeof value !== 'object') {
      throw new BadRequestException('Invalid payload format.');
    }

    if (!value.code && !value.email) {
      throw new BadRequestException('No confirmation code or email provided.');
    }

    if (value.code && typeof value.code !== 'string') {
      throw new BadRequestException('Invalid code format.');
    }

    if (value.email && typeof value.email !== 'string') {
      throw new BadRequestException('Invalid email format.');
    }

    const codeOrEmail = value.code ? {code: value.code} : {email: value.email}
    const field = value.code ? 'code' : 'email'
    const isValid = await this.validator.validate(codeOrEmail);
    if (!isValid) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: `Invalid ${field} or user is confirmed`,
            field: field,
          },
        ],
      });
    }

    return value;
  }
}
