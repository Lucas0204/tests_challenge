import { IStatementsRepository } from "../../repositories/IStatementsRepository"
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { GetBalanceUseCase } from "./GetBalanceUseCase";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { GetBalanceError } from "./GetBalanceError";


let usersRepositoryInMemory: IUsersRepository;
let statementsRepositoryInMemory: IStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw'
}

describe('Get balance use case', () => {

  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();

    getBalanceUseCase = new GetBalanceUseCase(
      statementsRepositoryInMemory,
      usersRepositoryInMemory
    );
  })

  it('should be able to get balance', async () => {
    const user = await usersRepositoryInMemory.create({
      name: 'Test name',
      email: 'test@mail.com',
      password: 'mypassword'
    });

    const statement = await statementsRepositoryInMemory.create({
      user_id: user.id as string,
      type: 'deposit' as OperationType,
      amount: 120,
      description: 'depositing'
    });

    const balance = await getBalanceUseCase.execute({
      user_id: user.id as string
    });

    expect(balance).toHaveProperty('statement');
    expect(balance).toHaveProperty('balance');
    expect(balance.balance).toBe(statement.amount);
    expect(balance.statement[0]).toEqual(statement);
  })

  it('should not be able to get balance of user that does not exists', () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: 'user_does_not_exist'
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  })
})
