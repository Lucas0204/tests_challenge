import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository"
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";


let usersRepositoryInMemory: IUsersRepository;
let showUserProfileUseCase: ShowUserProfileUseCase;

describe('Show user profile use case', () => {

  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepositoryInMemory);
  })

  it('should be able to show user profile', async () => {
    const user = await usersRepositoryInMemory.create({
      name: 'Test name',
      email: 'test@mail.com',
      password: 'mypassword'
    });

    const userProfile = await showUserProfileUseCase.execute(user.id as string);

    expect(userProfile).toEqual(user);
  })

  it('should not be able to show user that does not exist', () => {
    expect(async () => {
      await showUserProfileUseCase.execute('user_does_not_exist');
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  })
})
