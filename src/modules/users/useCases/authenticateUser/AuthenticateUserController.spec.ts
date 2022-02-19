import request from 'supertest';
import { Connection } from 'typeorm';
import { hash } from 'bcryptjs';

import createDatabaseConnection from '../../../../database';
import { app } from '../../../../app';
import { IUsersRepository } from '../../repositories/IUsersRepository';
import { UsersRepository } from '../../repositories/UsersRepository';
import { IncorrectEmailOrPasswordError } from './IncorrectEmailOrPasswordError';

let connection: Connection;
let usersRepository: IUsersRepository;


describe('Authenticate user controller', () => {
  const userEmail = 'test@mail.com';

  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();

    usersRepository = new UsersRepository();
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to authenticate user', async () => {
    const password = 'mypassword';
    const passwordHash = await hash(password, 8);

    const { email } = await usersRepository.create({
      name: 'Test name',
      email: userEmail,
      password: passwordHash
    });

    const response = await request(app)
    .post('/api/v1/sessions')
    .send({
      email,
      password
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
  })

  it('should not be able to authenticate a user that does not exist', async () => {
    const response = await request(app)
    .post('/api/v1/sessions')
    .send({
      email: 'user@doesnotexist.com',
      password: 'any'
    });

    const error = new IncorrectEmailOrPasswordError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toBe(expectedErrorMessage);
  })

  it('should not be able to authenticate a user with incorrect password', async () => {
    const response = await request(app)
    .post('/api/v1/sessions')
    .send({
      email: userEmail,
      password: 'incorrect_password'
    });

    const error = new IncorrectEmailOrPasswordError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toBe(expectedErrorMessage);
  })
})
