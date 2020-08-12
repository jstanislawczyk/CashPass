import {Service} from 'typedi';
import {DynamoDB} from 'aws-sdk';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import PutItemInput = DocumentClient.PutItemInput;
import {Account} from '../model/account';
import {LambdaError} from '../model/lambda-error';

@Service()
export class BlacklistService {

  private readonly dynamoDB: DynamoDB = new DynamoDB();

  public async addAccountToBlacklist(account: Account): Promise<void> {
    const blacklistAddParams: PutItemInput = this.buildBlacklistAddParams(account);

    try {
      await this.dynamoDB.putItem(blacklistAddParams).promise();
    } catch (error) {
      console.log('DynamoDB error occurred', error);

      throw (new LambdaError(error.message, 500));
    }
  }

  private buildBlacklistAddParams(account: Account): PutItemInput {
    const tableName: string = process.env.BLACKLIST_TABLE || '';

    return {
      Item: {
        'AccountId': {
          S: account.accountId,
        },
      },
      TableName: tableName,
    };
  }
}
