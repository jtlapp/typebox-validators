import { SchemaOptions, Type } from '@sinclair/typebox';
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { TypeSystem } from '@sinclair/typebox/system';

const IntegerString = TypeSystem.Type<
  string,
  { minimum?: number; maximum?: number; maxDigits?: number } & SchemaOptions
>('IntegerString', (options: any, value: any) => {
  if (
    typeof value !== 'string' ||
    (options.maxDigits !== undefined && value.length > options.maxDigits) ||
    !/^[0-9]+$/.test(value)
  ) {
    return false;
  }
  const integer = parseInt(value);
  return (
    (options.minimum === undefined || integer >= options.minimum) &&
    (options.maximum === undefined || integer <= options.maximum)
  );
});

test('IntegerString', () => {
  const schema = Type.Object({
    literal: Type.Literal('exact'),
    host: Type.String({
      description: 'hostname or IP address of database server',
      minLength: 1,
    }),
    port: IntegerString({
      description: 'port number of database server at host',
      minimum: 0,
      maximum: 65535,
      errorMessage: 'port must be an integer >= 0 and <= 65535',
    }),
    maxConnections: Type.Integer({
      description: 'maximum number of connections to allow',
      minimum: 10,
    }),
  });

  const compiledType = TypeCompiler.Compile(schema);
  console.log(compiledType.Code());
});
