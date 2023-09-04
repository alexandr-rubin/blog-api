// password-recovery-code-exist.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { UserQueryRepository } from '../../users/user.query-repository';
import { PasswordRecoveryCodeExistValidator } from '../passwordRecCodeValid';
import { NewPasswordInputModelValidation } from '../newPasswordInputModel';

@Injectable()
export class PasswordRecoveryCodeValidPipe implements PipeTransform {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async transform(data: NewPasswordInputModelValidation) {
    const validator = new PasswordRecoveryCodeExistValidator(this.userQueryRepository);
    const isValid = await validator.validate(data.recoveryCode);

    if (!isValid) {
      throw new BadRequestException(`User with recovery code "${data.recoveryCode}" does not exist or the code has expired.`);
    }

    return data;
  }
}
