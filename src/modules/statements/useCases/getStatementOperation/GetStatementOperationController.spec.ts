import request from 'supertest';
import { Connection } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import createDatabaseConnection from '../../../../database';
import { app } from '../../../../app';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { IStatementsRepository } from '../../repositories/IStatementsRepository';
import { User } from '../../../users/entities/User';
import { UsersRepository } from '../../../users/repositories/UsersRepository';
import { Statement } from '../../entities/Statement';
import { StatementsRepository } from '../../repositories/StatementsRepository';
import auth from '../../../../config/auth';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { GetStatementOperationError } from './GetStatementOperationError';


enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw'
}

interface IPayload {
  email: string;
}


let connection: Connection;
let usersRepository: IUsersRepository;
let statementsRepository: IStatementsRepository;

let user: User;
let statement: Statement;

let payload: IPayload;

describe('Get statement operation controller', () => {

  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();

    usersRepository = new UsersRepository();
    statementsRepository = new StatementsRepository();

    user = await usersRepository.create({
      name: 'Test name',
      email: 'test@mail.com',
      password: 'mypassword'
    });

    statement = await statementsRepository.create({
      user_id: user.id as string,
      type: 'deposit' as OperationType,
      amount: 120,
      description: 'depositing'
    })

    payload = { email: user.email };
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to get statement operation', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: user.id
    });

    const response = await request(app)
    .get(`/api/v1/statements/${statement.id}`)
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.user_id).toBe(user.id);
  });

  it('should not be able to get statement operation without sending authentication token', async () => {
    const response = await request(app).get(`/api/v1/statements/${statement.id}`);

    const error = new JWTTokenMissingError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toEqual(expectedErrorMessage);
  });

  it('should not be able to get statement operation with incorrect jwt secret', async () => {
    const token = sign(payload, 'incorrect_jwt_secret', {
      subject: user.id
    });

    const response = await request(app)
    .get(`/api/v1/statements/${statement.id}`)
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

  it('should not be able to get statement operation of user that does not exist', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: uuidv4()
    });

    const response = await request(app)
    .get(`/api/v1/statements/${statement.id}`)
    .set({
      Authorization: `Bearer ${token}`
    });

    const error = new GetStatementOperationError.UserNotFound();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(404);
    expect(response.text).toEqual(expectedErrorMessage);
  });

  it('should not be able to get statement operation that does not exist', async () => {
    const token = sign(payload, auth.jwt.secret, {
      subject: user.id
    });

    const response = await request(app)
    .get(`/api/v1/statements/${uuidv4()}`)
    .set({
      Authorization: `Bearer ${token}`
    });

    const error = new GetStatementOperationError.StatementNotFound();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(404);
    expect(response.text).toEqual(expectedErrorMessage);
  });
})
