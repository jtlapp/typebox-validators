import { TObject, TUnion, Type } from '@sinclair/typebox';

import { KeyBrandedValidator } from '../validators/key-branded-validator';
import { AbstractValidator } from '../validators/abstract-validator';
import { CompilingKeyBrandedValidator } from '../validators/compiling-key-branded-validator';

const OVERALL_MESSAGE = 'Bad union';

describe('key branded validators', () => {
  const union = Type.Union([
    Type.Object(
      {
        s: Type.String(),
        str1: Type.String(),
        str2: Type.Optional(Type.String()),
      },
      { uniqueKey: 's' }
    ),
    Type.Object(
      {
        i: Type.Integer(),
        int1: Type.Integer(),
        int2: Type.Optional(Type.Integer()),
      },
      { uniqueKey: 'i' }
    ),
  ]);

  testKeyBrandedValidation(
    'KeyBrandedValidator()',
    new KeyBrandedValidator(union)
  );
  testKeyBrandedValidation(
    'CompilingKeyBrandedValidator()',
    new CompilingKeyBrandedValidator(union)
  );
});

function testKeyBrandedValidation(
  description: string,
  validator: AbstractValidator<TUnion<TObject[]>>
) {
  describe(description, () => {
    it('accepts only valid key branded unions', () => {
      checkValidations(validator, { s: 'hello', str1: 'hello' }, true);
      checkValidations(validator, { i: 1, int1: 1 }, true);

      checkValidations(validator, { s: 'hello', str1: 'hello', int1: 1 }, true);
      checkValidations(validator, { i: 1, str1: 'hello', int1: 1 }, true);

      checkValidations(validator, { s: 'hello', int1: 1 }, false);
      checkValidations(validator, { i: 1, str1: 'hello' }, false);
      checkValidations(
        validator,
        { x: 'hello', str1: 'hello', int1: 1 },
        false
      );
      checkValidations(validator, { str1: 'hello', int1: 1 }, false);
      checkValidations(validator, {}, false);

      checkValidations(validator, undefined, false);
      checkValidations(validator, null, false);
      checkValidations(validator, true, false);
      checkValidations(validator, 1, false);
      checkValidations(validator, 'hello', false);
    });
  });
}

function checkValidations(
  validator: AbstractValidator<TUnion<TObject[]>>,
  value: any,
  valid: boolean
): void {
  tryValidation(valid, () => validator.safeValidate(value, OVERALL_MESSAGE));
  tryValidation(valid, () => validator.validate(value, OVERALL_MESSAGE, true));

  tryValidation(valid, () => validator.unsafeValidate(value, OVERALL_MESSAGE));
  tryValidation(valid, () => validator.validate(value, OVERALL_MESSAGE, false));
}

function tryValidation(valid: boolean, validate: () => void): void {
  if (valid) {
    expect(validate).not.toThrow();
  } else {
    expect(validate).toThrow(OVERALL_MESSAGE);
  }
}
