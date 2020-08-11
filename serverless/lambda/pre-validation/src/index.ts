import 'reflect-metadata';
import {LambdaResponse} from './model/lambda-response';
import {TransactionService} from './service/transaction-service';
import {Container} from 'typedi';
import {Transaction} from './model/transaction';

export const handler = async (event: any = {}): Promise<any> => {

  console.log(event);
  const transactionService: TransactionService = Container.get(TransactionService);

  try {
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');
    await transactionService.processTransaction(transaction);

    console.log(123123);
    console.log(transaction);

    return new LambdaResponse(transaction.toString(), 201);
  } catch (error) {
    console.log(`Error occurred: ${JSON.stringify(error)}`);

    return new LambdaResponse(error.message, error.code);
  }
};
