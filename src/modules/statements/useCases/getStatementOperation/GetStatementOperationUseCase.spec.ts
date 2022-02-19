import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { IStatementsRepository } from '../../repositories/IStatementsRepository';
import { GetStatementOperationUseCase } from './GetStatementOperationUseCase';
import { GetStatementOperationError } from './GetStatementOperationError';


let usersRepositoryInMemory: IUsersRepository;
let statementsRepositoryInMemory: IStatementsRepository;
let getSatementOperationUseCase: GetStatementOperationUseCase;

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw'
}

describe('Get statement operation use case', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    statementsRepositoryInMemory = new InMemoryStatementsRepository();

    getSatementOperationUseCase = new GetStatementOperationUseCase(
      usersRepositoryInMemory,
      statementsRepositoryInMemory
    );
  })

  it('should be able to get statement operation', async () => {
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

    const statementOperation = await getSatementOperationUseCase.execute({
      user_id: user.id as string,
      statement_id: statement.id as string
    });

    expect(statementOperation).toEqual(statement);
  })

  it('should not be able to get statement operation of user that does not exist', () => {
    expect(async () => {
      const statement = await statementsRepositoryInMemory.create({
        user_id: 'some_id',
        type: 'deposit' as OperationType,
        amount: 120,
        description: 'depositing'
      });

      await getSatementOperationUseCase.execute({
        user_id: 'user_does_not_exist',
        statement_id: statement.id as string
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  })

  it('should not be able to get statement operation of user that does not exist', () => {
    expect(async () => {
      const user = await usersRepositoryInMemory.create({
        name: 'Test name',
        email: 'test@mail.com',
        password: 'mypassword'
      });

      await getSatementOperationUseCase.execute({
        user_id: user.id as string,
        statement_id: 'statement_does_not_exist'
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  })
})
