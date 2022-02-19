import { IStatementsRepository } from "../../repositories/IStatementsRepository"
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { CreateStatementError } from "./CreateStatementError";


let usersRepositoryInMemory: IUsersRepository;
let statementsRepositoryInMemory: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw'
}

describe('Create statement use case', () => {

  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();

    createStatementUseCase = new CreateStatementUseCase(
      usersRepositoryInMemory,
      statementsRepositoryInMemory
    );
  })

  it('should be able to create a new statement', async () => {
    const user = await usersRepositoryInMemory.create({
      name: 'Test name',
      email: 'test@mail.com',
      password: 'mypassword'
    });

    const statement = await createStatementUseCase.execute({
      user_id: user.id as string,
      type: 'deposit' as OperationType,
      amount: 120,
      description: 'depositing'
    });

    expect(statement).toHaveProperty('id');
    expect(statement.user_id).toBe(user.id);
  })

  it('should not be able to create a statement to user that does not exists', () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: 'user_does_not_exist',
        type: 'deposit' as OperationType,
        amount: 120,
        description: 'depositing'
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  })

  it('should not be able to create a statement of withdraw with insufficient funds', () => {
    expect(async () => {
      const user = await usersRepositoryInMemory.create({
        name: 'Test name',
        email: 'test@mail.com',
        password: 'mypassword'
      });

      await createStatementUseCase.execute({
        user_id: user.id as string,
        type: 'withdraw' as OperationType,
        amount: 120,
        description: 'depositing'
      });
    }).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds);
  })
})
