/**
 * Classes representing the validation errors of a single value.
 */

import { ValueError } from '@sinclair/typebox/value';
import ExtendableError from 'es6-error';

/**
 * Exception reporting the occurrence of one or more validation errors.
 */
export class ValidationException extends ExtendableError {
  /**
   * @param overallError Overall error message
   * @param details The individual validation errors
   */
  constructor(
    overallError: string,
    readonly details: Readonly<ValueError[]> = []
  ) {
    super(overallError);
  }

  /**
   * Returns a string representation of the error. Provides the overall
   * error message, followed by the specific error messages, one per line.
   * @returns a string representation of the error.
   */
  override toString(): string {
    let message = this.message;
    if (this.details.length > 0) {
      message += ':';
      for (const detail of this.details) {
        message += '\n- ' + detailToString(detail);
      }
    }
    return message;
  }
}

function detailToString(detail: ValueError): string {
  return detail.path != ''
    ? detail.path.substring(1) + ': ' + detail.message
    : detail.message;
}
