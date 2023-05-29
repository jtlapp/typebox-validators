import { ValueError } from '@sinclair/typebox/errors';

import { ValidationException } from './validation-exception';
import { adjustErrorMessage } from './errors';

/**
 * Exception thrown when a value is not a member of a typed member union.
 * Provides the error message in the union schema's `errorMessage` property,
 * if given, otherwise providing a default error message.
 */
export class UnionTypeException extends ValidationException {
  constructor(overallError: string, error: ValueError) {
    super(overallError, [adjustErrorMessage(error)]);
  }
}
