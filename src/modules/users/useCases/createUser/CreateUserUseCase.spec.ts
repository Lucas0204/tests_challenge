import { IUsersRepository } from '../../repositories/IUsersRepository';
import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository';
import { CreateUserUseCase } from './CreateUserUseCase';
import { CreateUserError } from './CreateUserError';

let usersRepositoryInMemory: IUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe('Create user use case', () => {

  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  })

  it('should be able to create a new user', async () => {
    const password = 'mypassword';

    const user = await createUserUseCase.execute({
      name: 'Test name',
      email: 'test@mail.com',
      password
    });

    expect(user).toHaveProperty('id');
    expect(user.password).not.toBe(password);
  })

  it('should not be able to create a user that already exists', () => {
    expect(async () => {
      const user = {
        name: 'Test name',
        email: 'test@mail.com',
        password: 'mypassword'
      }

      await usersRepositoryInMemory.create(user);

      await createUserUseCase.execute(user);

    }).rejects.toBeInstanceOf(CreateUserError);
  })
})
