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
   * error message, optionally followed by specific error messages. If
   * there is only one error, the format is "{overall message}: {detail}".
   * If there are multiple errors, the overall message is on the first
   * line and the details are dash-bulleted on subsequent lines.
   * @param includeDetails Whether to append to the error message
   *  descriptions of the detail validation errors
   * @returns a string representation of the error.
   */
  override toString(includeDetails = true): string {
    let message = this.message;
    if (includeDetails && this.details.length > 0) {
      if (this.details.length == 1) {
        message += ': ' + detailToString(this.details[0]);
      } else {
        message += ':';
        for (const detail of this.details) {
          message += '\n- ' + detailToString(detail);
        }
      }
    }
    return message;
  }
}

function detailToString(detail: ValueError): string {
  return detail.path + ': ' + detail.message;
}
