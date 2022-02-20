import request from 'supertest';
import { Connection } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import createDatabaseConnection from '../../../../database';
import authConfig from '../../../../config/auth';

import { app } from '../../../../app';
import { IUsersRepository } from '../../repositories/IUsersRepository';
import { UsersRepository } from '../../repositories/UsersRepository';
import { JWTTokenMissingError } from '../../../../shared/errors/JWTTokenMissingError';
import { JWTInvalidTokenError } from '../../../../shared/errors/JWTInvalidTokenError';
import { ShowUserProfileError } from './ShowUserProfileError';


let connection: Connection;
let usersRepository: IUsersRepository;

describe('Show user profile controller', () => {

  beforeAll(async () => {
    connection = await createDatabaseConnection();
    await connection.runMigrations();

    usersRepository = new UsersRepository();
  })

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it('should be able to show user profile', async () => {
    const user = await usersRepository.create({
      name: 'Test name',
      email: 'test@mail.com',
      password: 'mypassword'
    });

    const payload = { email: user.email };
    const token = sign(payload, authConfig.jwt.secret, {
      subject: user.id
    });

    const response = await request(app)
    .get('/api/v1/profile')
    .set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
  })

  it('should not be able to show a user profile without sending the authentication token', async () => {
    const response = await request(app).get('/api/v1/profile');

    const error = new JWTTokenMissingError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toEqual(expectedErrorMessage);
  })

  it('should not be able to show a user profile with a incorrect jwt secret', async () => {
    const payload = { email: 'any@mail.com' };
    const token = sign(payload, 'incorrect_jwt_secret', {
      subject: 'anyId'
    });

    const response = await request(app)
    .get('/api/v1/profile')
    .set({
      Authorization: `Bearer ${token}`
    });

    const error = new JWTInvalidTokenError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(401);
    expect(response.text).toEqual(expectedErrorMessage);
  })

  it('should not be able to show profile of user that does not exist', async () => {
    const payload = { email: 'any@mail.com' };
    const token = sign(payload, authConfig.jwt.secret, {
      subject: uuidv4()
    })

    const response = await request(app)
    .get('/api/v1/profile')
    .set({
      Authorization: `Bearer ${token}`
    });

    const error = new ShowUserProfileError();
    const expectedErrorMessage = JSON.stringify({
      message: error.message
    });

    expect(response.status).toBe(404);
    expect(response.text).toEqual(expectedErrorMessage);
  })
})
