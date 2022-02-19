import { Connection, createConnection, getConnectionOptions } from 'typeorm';

export default async (host = 'db'): Promise<Connection> => {
  const defaultOptions = await getConnectionOptions();

  const database = process.env.NODE_ENV === 'test' ? 'fin_api_tests' : 'fin_api';

  return await createConnection(
    Object.assign(defaultOptions, {
      host: process.env.NODE_ENV === 'test' ? 'localhost' : host,
      database
    })
  );
}
