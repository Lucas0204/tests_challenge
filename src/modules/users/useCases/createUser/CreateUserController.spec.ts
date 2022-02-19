import request from 'supertest';
import { Connection } from 'typeorm';

import { app } from '../../../../app';

import createDatabaseConnection from '../../../../database';
import { CreateUserError } from './CreateUserError';


let connection: Connection;

describe('Create user controller', () => {

  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Test name',
        email: 'test@mail.com',
        password: 'mypassword'
      });

    expect(response.status).toBe(201);
  })

  it('should not be able to create a user that already exists', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Test name',
        email: 'test@mail.com',
        password: 'mypassword'
      });

    const error = new CreateUserError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    })

    expect(response.status).toBe(400);
    expect(response.text).toBe(expectedErrorMessage);
  })
})
