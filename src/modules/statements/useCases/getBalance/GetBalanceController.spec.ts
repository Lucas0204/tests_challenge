import request from 'supertest';
import { Connection } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import createDatabaseConnection from '../../../../database';
import auth from '../../../../config/auth';
import { app } from '../../../../app';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { UsersRepository } from '../../../users/repositories/UsersRepository';
import { User } from '../../../users/entities/User';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { GetBalanceError } from './GetBalanceError';


interface IPayload {
  email: string;
}

let connection: Connection;
let usersRepository: IUsersRepository;

let user: User;
let payload: IPayload;

describe('Get balance controller', () => {

  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();

    usersRepository = new UsersRepository();

    user = await usersRepository.create({
      name: 'Test name',
      email: 'test@mail.com',
      password: 'mypassword'
    });

    payload = { email: user.email };
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to get balance', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: user.id
    });

    const response = await request(app)
    .get('/api/v1/statements/balance')
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('statement');
    expect(response.body).toHaveProperty('balance');
  });

  it('should not be able to get balance without sending authentication token', async () => {
    const response = await request(app).get('/api/v1/statements/balance');

    const error = new JWTTokenMissingError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toEqual(expectedErrorMessage);
  });

  it('should not be able to get balance with a incorrect jwt secret', async () => {
    const token = sign(payload, 'incorrect_jwt_secret', {
      subject: user.id
    });

    const response = await request(app)
    .get('/api/v1/statements/balance')
    .set({
      Authorization: `Bearer ${token}`
    });

    const error = new JWTInvalidTokenError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toEqual(expectedErrorMessage);
  });

  it('should not be able to get balance of user that does not exist', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: uuidv4()
    });

    const response = await request(app)
    .get('/api/v1/statements/balance')
    .set({
      Authorization: `Bearer ${token}`
    });

    const error = new GetBalanceError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(404);
    expect(response.text).toEqual(expectedErrorMessage);
  });
})
