/**
 * Classes representing the validation errors of a single value.
 */

import { ValueError } from '@sinclair/typebox/value';

/**
 * Exception reporting the occurrence of one or more validation errors.
 */
export class ValidationException {
  /**
   * @param message Overall error message
   * @param details The individual validation errors
   */
  constructor(
    readonly message: string,
    readonly details: Readonly<ValueError[]> = []
  ) {}

  /**
   * Returns a string representation of the error. Provides the overall
   * error message, followed by the specific error messages, one per line.
   * @returns a string representation of the error.
   */
  toString(): string {
    let message = this.message;
    if (this.details.length > 0) {
      if (!message.endsWith(':')) {
        message += ':';
      }
      for (const detail of this.details) {
        message += '\n * ' + ValidationException.errorToString(detail);
      }
    }
    return message;
  }

  /**
   * Returns a string representation of a validation error, which precedes
   * the error with its reference path if it occurs in an object.
   */
  static errorToString(error: ValueError): string {
    return error.path != ''
      ? `${error.path.substring(1)} - ${error.message}`
      : error.message;
  }
}
