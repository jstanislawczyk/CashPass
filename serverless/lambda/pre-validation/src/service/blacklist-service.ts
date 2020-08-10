import {Service} from 'typedi';
import {Transaction} from '../model/transaction';
import {AWSError, DynamoDB} from 'aws-sdk';
import {AttributeMap, BatchGetItemInput, BatchGetItemOutput, ItemList} from 'aws-sdk/clients/dynamodb';
import {PromiseResult} from 'aws-sdk/lib/request';
import {LambdaError} from '../model/lambda-error';
import {NotificationService} from './notification-service';

@Service()
export class BlacklistService {

  constructor(
    private readonly notificationService: NotificationService,
  ) {
  }

  private readonly documentClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient();

  public async validateBlacklistedAccounts(transaction: Transaction): Promise<void> {
    const tableName: string = process.env.BLACKLIST_TABLE || '';
    const getBlacklistedAccountsParams: BatchGetItemInput = this.buildGetBlacklistedAccountsParams(transaction, tableName);

    const blacklistedAccountsResult: PromiseResult<BatchGetItemOutput, AWSError> =
      await this.documentClient.batchGet(getBlacklistedAccountsParams).promise();

    const blacklistedAccounts: ItemList = blacklistedAccountsResult.Responses
      ? blacklistedAccountsResult.Responses[tableName]
      : [];

    if (blacklistedAccounts.length > 0) {
      await this.throwBlacklistedAccountError(transaction, blacklistedAccounts);
    }
  }

  private buildGetBlacklistedAccountsParams(transaction: Transaction, tableName: string): BatchGetItemInput {
    const params: any = {
      RequestItems: {},
    };

    params.RequestItems[tableName] = {
      Keys: [{
        AccountId: transaction.receiverAccountId,
      }, {
        AccountId: transaction.senderAccountId,
      }]
    };

    return params;
  }

  private async throwBlacklistedAccountError(transaction: Transaction, blacklistedAccounts: ItemList): Promise<void> {
    const accountIds: string = blacklistedAccounts
      .map((account: AttributeMap) =>
        account.accountId
      )
      .join(', ');
    const errorMessage: string = `Accounts with id=[${accountIds}] are blacklisted`;

    transaction.detailedStatus = errorMessage;

    await this.notificationService.sendNotification(transaction);

    throw(new LambdaError(errorMessage, 409));
  }
}
