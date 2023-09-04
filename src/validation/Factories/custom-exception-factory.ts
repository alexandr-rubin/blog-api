import { BadRequestException } from '@nestjs/common';

export function validationExceptionFactory(errors) {
  const errorsMessages = {
    errorsMessages: [],
  };
  errors.forEach((error) => {
    const firstKey = Object.keys(error.constraints)[0];
    errorsMessages.errorsMessages.push({
      message: error.constraints[firstKey],
      field: error.property,
    });
  });
  throw new BadRequestException(errorsMessages);
}