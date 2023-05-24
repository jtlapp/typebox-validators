/**
 * Classes representing the validation errors of a single value.
 */

import { ValueError } from '@sinclair/typebox/value';
import ExtendableError from 'es6-error';

import { SpecificValidationError } from './specific-validation-error';

/**
 * Exception reporting the occurrence of one or more validation errors.
 */
export class ValidationException extends ExtendableError {
  /**
   * @param overallError Overall error message
   * @param specifics The individual specific validation errors
   */
  constructor(overallError: string, public specifics: ValueError[] = []) {
    super(overallError);
    this.specifics = specifics.map(
      (detail) => new SpecificValidationError(detail)
    );
  }

  /**
   * Returns a string representation of the error. Provides the overall
   * error message, optionally followed by detailed error messages. If
   * there is only one error, the format is "{overall message}: {detail}".
   * If there are multiple errors, the overall message is on the first
   * line and the specifics are dash-bulleted on subsequent lines.
   * @param includeSpecifics Whether to append to the error message
   *  descriptions of the specific validation errors
   * @returns a string representation of the error.
   */
  override toString(includeSpecifics = true): string {
    let message = this.message;
    if (includeSpecifics && this.specifics.length > 0) {
      if (this.specifics.length == 1) {
        message += ': ' + this.specifics[0].toString();
      } else {
        message += ':';
        for (const detail of this.specifics) {
          message += '\n- ' + detail.toString();
        }
      }
    }
    return message;
  }
}
