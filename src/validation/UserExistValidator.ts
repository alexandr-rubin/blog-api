import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { UserQueryRepository } from '../users/user.query-repository';

@ValidatorConstraint({ async: true })
export class UserExistValidator implements ValidatorConstraintInterface {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async validate(userId: string) {
    const post = await this.userQueryRepository.getUsergByIdNoView(userId);
    return !!post;
  }

  defaultMessage(args: ValidationArguments) {
    return `User with id "${args.value}" does not exist.`;
  }
}