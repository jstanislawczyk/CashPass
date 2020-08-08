import {Service} from 'typedi';
import {Transaction} from '../model/transaction';
import {Lambda} from 'aws-sdk';

@Service()
export class LambdaPusherService {

  private readonly lambdaClient: Lambda = new Lambda();

  public async passTransactionToLambda(transaction: Transaction): Promise<void> {
    const lambdaParams: { FunctionName: string; Payload: string; } = this.buildLambdaParams(transaction);

    await this.lambdaClient.invoke(lambdaParams).promise();
  }

  private buildLambdaParams(transaction: Transaction): { FunctionName: string; Payload: string; } {
    return {
      FunctionName: process.env.TRANSACTION_LAMBDA_NAME || '',
      Payload: transaction.toString(),
    }
  }
}
