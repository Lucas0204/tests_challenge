import { hash } from 'bcryptjs';

import { IUsersRepository } from '../../repositories/IUsersRepository';
import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase';
import { IncorrectEmailOrPasswordError } from './IncorrectEmailOrPasswordError';

let usersRepositoryInMemory: IUsersRepository;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe('Authenticate user use case', () => {

  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
  })

  it('should be able to authenticate a user', async () => {
    const password = 'mypassword';
    const passwordHash = await hash(password, 8);
    const userData = {
      name: 'Test name',
      email: 'test@mail.com',
      password: passwordHash
    }

    const user = await usersRepositoryInMemory.create(userData);

    const authInfo = await authenticateUserUseCase.execute({
      email: user.email,
      password
    });

    expect(authInfo).toHaveProperty('user');
    expect(authInfo).toHaveProperty('token');
    expect(authInfo.user.name).toEqual(user.name);
  })

  it('should not be able to authenticate a user that does not exists', async () => {
    expect(async () => {
      const user = {
        name: 'Test name',
        email: 'test@mail.com',
        password: 'mypassword'
      }

      await authenticateUserUseCase.execute(user);
    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  })

  it('should not be able to authenticate a user with incorrect password', async () => {
    expect(async () => {
      const password = 'mypassword';
      const passwordHash = await hash(password, 8);
      const userData = {
        name: 'Test name',
        email: 'test@mail.com',
        password: passwordHash
      }

      const user = await usersRepositoryInMemory.create(userData);

      await authenticateUserUseCase.execute({
        email: user.email,
        password: 'incorrect_password'
      });

    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  })
})
