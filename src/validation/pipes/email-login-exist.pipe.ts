import { PipeTransform, Injectable } from '@nestjs/common';
import { UserQueryRepository } from '../../users/user.query-repository';
import { validationExceptionFactory } from '../Factories/custom-exception-factory';
import { UserInputModel } from '../../users/models/input/UserInput';

@Injectable()
export class EmailOrLoginExistsPipe implements PipeTransform {
  constructor(private readonly userQueryRepository: UserQueryRepository) {}

  async transform(value: UserInputModel) {
    if (!value.email && !value.login) {
      validationExceptionFactory([
        {
          property: 'email',
          constraints: { isDefined: 'Email or login must be provided.' },
        },
        {
          property: 'login',
          constraints: { isDefined: 'Email or login must be provided.' },
        },
      ]);
    }

    if (value.email) {
      const emailExists = await this.userQueryRepository.getUsergByEmail(value.email);
      if (emailExists) {
        validationExceptionFactory([
          {
            property: 'email',
            constraints: { isUnique: 'Email is already taken.' },
          },
        ]);
      }
    }

    if (value.login) {
      const loginExists = await this.userQueryRepository.getUsergByLogin(value.login);
      if (loginExists) {
        validationExceptionFactory([
          {
            property: 'login',
            constraints: { isUnique: 'Login is already taken.' },
          },
        ]);
      }
    }

    return value;
  }
}
