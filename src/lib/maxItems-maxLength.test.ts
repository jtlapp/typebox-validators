/**
 * As of Typebox version 0.28.13,`maxLength` and `maxItems` are checked before
 * checking other constraints, but the TypeBox docs say nothing about this, so
 * this feature may not be part of the public contract. These tests confirm
 * that this remains the case, as this feature is important for securing APIs.
 */

import { TSchema, Type } from '@sinclair/typebox';
import {
  Value as TypeBoxValue,
  ValueErrorIterator,
} from '@sinclair/typebox/value';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';

const MAX_SIZE = 4;
const ERROR_SUBSTRING = `less or equal to ${MAX_SIZE}`;
const PATTERN = '^[a-z]+$';

describe('TypeBox value size checks', () => {
  describe('maxLength checks', () => {
    const schema = Type.Object({
      lengthFirstStr: Type.String({ maxLength: 4, pattern: PATTERN }),
      lengthLastStr: Type.String({ pattern: PATTERN, maxLength: MAX_SIZE }),
    });
    const value = {
      lengthFirstStr: '1'.repeat(MAX_SIZE + 1),
      lengthLastStr: '1'.repeat(MAX_SIZE + 1),
    };
    const compiledType = TypeCompiler.Compile(schema);

    it('should have Check() test maxLength first', () => {
      testTypeBoxCheckFunction(compiledType);
    });

    it('should have First() return a maxLength error', () => {
      let error = TypeBoxValue.Errors(schema, value).First();
      expect(error?.message).toContain(ERROR_SUBSTRING);

      error = compiledType.Errors(value).First();
      expect(error?.message).toContain(ERROR_SUBSTRING);
    });

    it('should have Errors() return a maxLength error first', () => {
      const verifyErrors = (errors: ValueErrorIterator) => {
        let priorPath = '';
        for (const error of errors) {
          if (error.path !== priorPath) {
            expect(error.message).toContain(ERROR_SUBSTRING);
            priorPath = error.path;
          }
        }
      };
      verifyErrors(TypeBoxValue.Errors(schema, value));
      verifyErrors(compiledType.Errors(value));
    });
  });

  describe('maxItems checks', () => {
    const schema = Type.Object({
      array: Type.Array(Type.String({ pattern: PATTERN }), {
        maxItems: MAX_SIZE,
      }),
    });
    const value = {
      array: Array.from({ length: MAX_SIZE + 1 }).fill('1'),
    };
    const compiledType = TypeCompiler.Compile(schema);

    it('should have Check() test maxItems first', () => {
      testTypeBoxCheckFunction(compiledType);
    });

    it('should have First() return a maxItems error', () => {
      let error = TypeBoxValue.Errors(schema, value).First();
      expect(error?.message).toContain(ERROR_SUBSTRING);

      error = compiledType.Errors(value).First();
      expect(error?.message).toContain(ERROR_SUBSTRING);
    });

    it('should have Errors() return a maxItems error first', () => {
      for (const error of compiledType.Errors(value)) {
        expect(error.message).toContain(ERROR_SUBSTRING);
        break; // only check first error
      }
    });
  });
});

function testTypeBoxCheckFunction(compiledType: TypeCheck<TSchema>) {
  // Not guaranteed to work for all versions of TypeBox, but
  // it's better than nothing. Doesn't test uncompiled `Check()`.
  const code = compiledType.Code();
  const maxSizeOffset = code.indexOf(`${MAX_SIZE}`);
  const patternOffset = code.indexOf('.test(');
  expect(maxSizeOffset).toBeGreaterThanOrEqual(0);
  expect(patternOffset).toBeGreaterThanOrEqual(0);
  expect(maxSizeOffset).toBeLessThan(patternOffset);
}
