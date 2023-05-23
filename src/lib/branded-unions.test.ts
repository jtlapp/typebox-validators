import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import {
  HeterogeneousUnionUnion,
  DiscriminatedUnionUnion,
} from './branded-unions';

describe('branded unions', () => {
  const vSchema = DiscriminatedUnionUnion({
    discriminantKey: 'type',
    schemas: [
      Type.Object({
        type: Type.Literal('s'),
        str1: Type.String(),
        str2: Type.Optional(Type.String()),
      }),
      Type.Object({
        type: Type.Literal('i'),
        int1: Type.Integer(),
        int2: Type.Optional(Type.Integer()),
      }),
    ],
  });
  console.log('vSchema', vSchema);

  const kSchema = HeterogeneousUnionUnion({
    schemas: [
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
    ],
  });

  it('DiscriminatedUnionUnion accepts only valid values', () => {
    expect(Value.Check(vSchema, { type: 's', str1: 'hello' })).toBe(true);
    expect(Value.Check(vSchema, { type: 'i', int1: 1 })).toBe(true);

    expect(Value.Check(vSchema, { type: 's', str1: 'hello', int1: 1 })).toBe(
      true
    );
    expect(Value.Check(vSchema, { type: 'i', str1: 'hello', int1: 1 })).toBe(
      true
    );

    expect(Value.Check(vSchema, { type: 's', int1: 1 })).toBe(false);
    expect(Value.Check(vSchema, { type: 'i', str1: 'hello' })).toBe(false);
    expect(Value.Check(vSchema, { type: 'x', str1: 'hello', int1: 1 })).toBe(
      false
    );
    expect(Value.Check(vSchema, { str1: 'hello', int1: 1 })).toBe(false);
    expect(Value.Check(vSchema, {})).toBe(false);

    expect(Value.Check(vSchema, undefined)).toBe(false);
    expect(Value.Check(vSchema, null)).toBe(false);
    expect(Value.Check(vSchema, true)).toBe(false);
    expect(Value.Check(vSchema, 1)).toBe(false);
    expect(Value.Check(vSchema, 'hello')).toBe(false);
  });

  it('temp', () => {
    const errors1 = Value.Errors(vSchema, { type: 's', str1: 1 });
    console.log([...errors1]);

    const nestedUnion = Type.Object({
      union: vSchema,
    });

    const errors2 = Value.Errors(nestedUnion, {
      union: { type: 's', str1: 1 },
    });
    console.log([...errors2]);
  });

  it('HeterogeneousUnionUnion accepts only valid values', () => {
    expect(Value.Check(kSchema, { s: 'hello', str1: 'hello' })).toBe(true);
    expect(Value.Check(kSchema, { i: 1, int1: 1 })).toBe(true);

    expect(Value.Check(kSchema, { s: 'hello', str1: 'hello', int1: 1 })).toBe(
      true
    );
    expect(Value.Check(kSchema, { i: 1, str1: 'hello', int1: 1 })).toBe(true);

    expect(Value.Check(kSchema, { s: 'hello', int1: 1 })).toBe(false);
    expect(Value.Check(kSchema, { i: 1, str1: 'hello' })).toBe(false);
    expect(Value.Check(kSchema, { x: 'hello', str1: 'hello', int1: 1 })).toBe(
      false
    );
    expect(Value.Check(kSchema, { str1: 'hello', int1: 1 })).toBe(false);
    expect(Value.Check(kSchema, {})).toBe(false);

    expect(Value.Check(kSchema, undefined)).toBe(false);
    expect(Value.Check(kSchema, null)).toBe(false);
    expect(Value.Check(kSchema, true)).toBe(false);
    expect(Value.Check(kSchema, 1)).toBe(false);
    expect(Value.Check(kSchema, 'hello')).toBe(false);
  });
});
