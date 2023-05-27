import { TObject, TSchema, TUnion } from '@sinclair/typebox';
import { AbstractValidator } from '../validators/abstract-validator';

export const OVERALL_MESSAGE = 'Invalid union value';

export function checkValidations(
  validator: AbstractValidator<TUnion<TObject[]>>,
  schemaIndex: number,
  value: any,
  valid: boolean
): void {
  const expectedSchema = validator.schema.anyOf[schemaIndex];

  tryValidation(valid, expectedSchema, 'Invalid value', () =>
    validator.assert(value)
  );
  tryValidation(valid, expectedSchema, OVERALL_MESSAGE, () =>
    validator.assert(value, OVERALL_MESSAGE)
  );

  tryValidation(valid, expectedSchema, 'Invalid value', () =>
    validator.validate(value)
  );
  tryValidation(valid, expectedSchema, OVERALL_MESSAGE, () =>
    validator.validate(value, OVERALL_MESSAGE)
  );
}

function tryValidation(
  valid: boolean,
  expectedSchema: TSchema,
  expectedMessage: string,
  validate: () => void
): void {
  if (valid) {
    const actualSchema = validate();
    expect(actualSchema).toBe(expectedSchema);
  } else {
    expect(validate).toThrow(expectedMessage);
  }
}
