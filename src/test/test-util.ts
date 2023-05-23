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

  tryValidation(valid, expectedSchema, () =>
    validator.safeValidate(value, OVERALL_MESSAGE)
  );
  tryValidation(valid, expectedSchema, () =>
    validator.validate(value, OVERALL_MESSAGE, true)
  );

  tryValidation(valid, expectedSchema, () =>
    validator.unsafeValidate(value, OVERALL_MESSAGE)
  );
  tryValidation(valid, expectedSchema, () =>
    validator.validate(value, OVERALL_MESSAGE, false)
  );
}

function tryValidation(
  valid: boolean,
  expectedSchema: TSchema,
  validate: () => void
): void {
  if (valid) {
    const actualSchema = validate();
    expect(actualSchema).toBe(expectedSchema);
  } else {
    expect(validate).toThrow(OVERALL_MESSAGE);
  }
}
