import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { UserQueryRepository } from '../users/user.query-repository';
import { SQLUser } from 'src/users/models/view/SQLUserView';

@ValidatorConstraint({ async: true })
export class EmailConfirmationCodeValidator implements ValidatorConstraintInterface {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async validate(data: {code?: string, email?: string}) {
    let user: SQLUser
    if(data.code) {
      user = await this.userQueryRepository.findUserByConfirmationEmailCode(data.code)
    }
    if(data.email) {
      user = await this.userQueryRepository.getUsergByEmail(data.email)
    }

    if (!user)
      return false
    if (user.confirmationEmail.isConfirmed)
      return false
      //
    if(data.code && new Date(user.confirmationEmail.expirationDate) < new Date())
      return false
    
    return true
  }

  defaultMessage(args: ValidationArguments) {
    return `User with id "${args.value}" does not exist.`;
  }
}