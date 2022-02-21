import request from 'supertest';
import { Connection } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import createDatabaseConnection from '../../../../database';
import auth from '../../../../config/auth';
import { app } from '../../../../app';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { UsersRepository } from '../../../users/repositories/UsersRepository';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { CreateStatementError } from './CreateStatementError';
import { User } from '../../../users/entities/User';

interface IPayload {
  email: string;
}

let connection: Connection;
let usersRepository: IUsersRepository;
let user: User;
let payload: IPayload;

describe('Create statement controller', () => {
  const amountToDeposit = 120;
  const amountToWithdraw = 240;

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

  it('should be able to create a new statement', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: user.id
    });

    const response = await request(app)
    .post('/api/v1/statements/deposit')
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: amountToDeposit,
      description: 'depositing'
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toBe(user.id);
  });

  it('should not be able to create a statement without sending the authentication token', async () => {
    const response = await request(app)
    .post('/api/v1/statements/deposit')
    .send({
      amount: amountToDeposit,
      description: 'depositing'
    });

    const error = new JWTTokenMissingError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toEqual(expectedErrorMessage);
  });

  it('should not be able to create a statement with a incorrect jwt secret', async () => {
    const token = sign(payload, 'incorrect_jwt_secret', {
      subject: user.id
    });

    const response = await request(app)
    .post('/api/v1/statements/deposit')
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: amountToDeposit,
      description: 'depositing'
    });

    const error = new JWTInvalidTokenError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toEqual(expectedErrorMessage);
  });

  it('should not be able to create a statement to user that does not exist', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: uuidv4()
    });

    const response = await request(app)
    .post('/api/v1/statements/deposit')
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: amountToDeposit,
      description: 'depositing'
    });

    const error = new CreateStatementError.UserNotFound();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(404);
    expect(response.text).toEqual(expectedErrorMessage);
  });

  it('should not be able to create a statement of withdraw with insufficient funds', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: user.id
    });

    const response = await request(app)
    .post('/api/v1/statements/withdraw')
    .set({
      Authorization: `Bearer ${token}`
    })
    .send({
      amount: amountToWithdraw,
      description: 'drawing'
    });

    const error = new CreateStatementError.InsufficientFunds();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(400);
    expect(response.text).toEqual(expectedErrorMessage);
  });
})
