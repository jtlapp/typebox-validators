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
//import { performance } from 'node:perf_hooks';

const MAX_SIZE = 4;
const ERROR_SUBSTRING = `less or equal to ${MAX_SIZE}`;
const PATTERN = '^[a-z]+$';

// const uncompiledIterations = [400, 10000] as const;
// const compiledIterations = [400, 20000] as const;

describe('TypeBox value size checks', () => {
  describe('maxLength checks', () => {
    const schema = Type.Object({
      lengthFirstStr: Type.String({ maxLength: 4, pattern: PATTERN }),
      lengthLastStr: Type.String({ pattern: PATTERN, maxLength: MAX_SIZE }),
    });
    const badSizeValue = {
      lengthFirstStr: '1'.repeat(MAX_SIZE + 1),
      lengthLastStr: '1'.repeat(MAX_SIZE + 1),
    };
    // const badRegexValue = {
    //   lengthFirstStr: '1',
    //   lengthLastStr: '1',
    // };

    const compiledType = TypeCompiler.Compile(schema);

    // it('should have uncompiled Check() test maxLength first', () => {
    //   const check = TypeBoxValue.Check.bind(TypeBoxValue, schema);
    //   testCheckViaTiming(
    //     check,
    //     badSizeValue,
    //     badRegexValue,
    //     uncompiledIterations
    //   );
    // });

    it('should have compiled Check() test maxLength first', () => {
      testCheckViaCode(compiledType);
      // const check = compiledType.Check.bind(compiledType);
      // testCheckViaTiming(
      //   check,
      //   badSizeValue,
      //   badRegexValue,
      //   compiledIterations
      // );
    });

    it('should have First() return a maxLength error', () => {
      let error = TypeBoxValue.Errors(schema, badSizeValue).First();
      expect(error?.message).toContain(ERROR_SUBSTRING);

      error = compiledType.Errors(badSizeValue).First();
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
      verifyErrors(TypeBoxValue.Errors(schema, badSizeValue));
      verifyErrors(compiledType.Errors(badSizeValue));
    });
  });

  describe('maxItems checks', () => {
    const schema = Type.Object({
      array: Type.Array(Type.String({ pattern: PATTERN }), {
        maxItems: MAX_SIZE,
      }),
    });
    const badSizeValue = {
      array: Array.from({ length: MAX_SIZE + 1 }).fill('1'),
    };
    // const badRegexValue = {
    //   array: Array.from({ length: 1 }).fill('1'),
    // };
    const compiledType = TypeCompiler.Compile(schema);

    // it('should have uncompiled Check() test maxItems first', () => {
    //   const check = TypeBoxValue.Check.bind(TypeBoxValue, schema);
    //   testCheckViaTiming(
    //     check,
    //     badSizeValue,
    //     badRegexValue,
    //     uncompiledIterations
    //   );
    // });

    it('should have compiled Check() test maxItems first', () => {
      testCheckViaCode(compiledType);
      // const check = compiledType.Check.bind(compiledType);
      // testCheckViaTiming(
      //   check,
      //   badSizeValue,
      //   badRegexValue,
      //   compiledIterations
      // );
    });

    it('should have First() return a maxItems error', () => {
      let error = TypeBoxValue.Errors(schema, badSizeValue).First();
      expect(error?.message).toContain(ERROR_SUBSTRING);

      error = compiledType.Errors(badSizeValue).First();
      expect(error?.message).toContain(ERROR_SUBSTRING);
    });

    it('should have Errors() return a maxItems error first', () => {
      for (const error of compiledType.Errors(badSizeValue)) {
        expect(error.message).toContain(ERROR_SUBSTRING);
        break; // only check first error
      }
    });
  });
});

function testCheckViaCode(compiledType: TypeCheck<TSchema>) {
  // Not guaranteed to work for all versions of TypeBox,
  // but it's faster than doing another timing test.
  const code = compiledType.Code();
  const maxSizeOffset = code.indexOf(`${MAX_SIZE}`);
  const patternOffset = code.indexOf('.test(');
  expect(maxSizeOffset).toBeGreaterThanOrEqual(0);
  expect(patternOffset).toBeGreaterThanOrEqual(0);
  expect(maxSizeOffset).toBeLessThan(patternOffset);
}

// This function works most of the time, but produces a false negative
// often enough to make it too unreliable to include in the test suite.

// function testCheckViaTiming(
//   check: (value: unknown) => boolean,
//   badSizeValue: unknown,
//   badRegexValue: unknown,
//   iterations: Readonly<[number, number]>
// ) {
//   let badSizeTimes: number[] = [];
//   let badRegexTimes: number[] = [];

//   // Mix the two tests to equally apply system slowdowns across them.
//   for (let i = 0; i < iterations[0]; ++i) {
//     badSizeTimes.push(timeCheckFunction(check, badSizeValue, iterations[1]));
//     badRegexTimes.push(timeCheckFunction(check, badRegexValue, iterations[1]));
//   }
//   badSizeTimes.sort();
//   badRegexTimes.sort();

//   const sum = (times: number[]) =>
//     times.slice(0, iterations[0] / 2).reduce((a, b) => a + b, 0);
//   expect(sum(badSizeTimes)).toBeLessThan(sum(badRegexTimes));
// }

// function timeCheckFunction(
//   check: (value: unknown) => boolean,
//   badValue: unknown,
//   iterations: number
// ): number {
//   let start = performance.now();
//   for (let i = 0; i < iterations; ++i) {
//     check(badValue);
//   }
//   return performance.now() - start;
// }
