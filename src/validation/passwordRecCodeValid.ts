import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { UserQueryRepository } from '../users/user.query-repository';

@ValidatorConstraint({ async: true })
export class PasswordRecoveryCodeExistValidator implements ValidatorConstraintInterface {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async validate(code: string) {
    const user = await this.userQueryRepository.findUserByConfirmationPasswordCode(code)

    if (!user)
      return false
    if(new Date(user.confirmationPassword.expirationDate) < new Date())
      return false
    
    return true
  }

  defaultMessage(args: ValidationArguments) {
    return `User with id "${args.value}" does not exist.`;
  }
}