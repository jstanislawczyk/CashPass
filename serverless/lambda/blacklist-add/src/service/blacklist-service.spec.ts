import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {SinonSandbox, SinonStub} from 'sinon';
import * as sinonChai from 'sinon-chai';
import {BlacklistService} from './blacklist-service';
import {Account} from '../model/account';
import {LambdaError} from '../model/lambda-error';

use(sinonChai);
use(chaiAsPromised);

describe('BlacklistService', () => {

  let sandbox: SinonSandbox;
  let dynamoDbClientStub: SinonStub;
  let blacklistService: BlacklistService;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    dynamoDbClientStub = sandbox.stub();

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB', 'putItem', dynamoDbClientStub);

    process.env.BLACKLIST_TABLE = 'BlacklistTable';

    dynamoDbClientStub.resolves({});

    blacklistService = new BlacklistService();
  });

  afterEach(() => {
    sandbox.restore();
    AWSMock.restore();
  });

  it('should add account to blacklist', async () => {
    // Arrange
    const account: Account = new Account('SENDER');

    // Act
    await blacklistService.addAccountToBlacklist(account);

    // Assert;
    const blacklistPutArgs: Record<string, any> = dynamoDbClientStub.firstCall.args[0];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(blacklistPutArgs.TableName).to.not.be.empty;
    expect(blacklistPutArgs.TableName).to.be.eql(process.env.BLACKLIST_TABLE);
    expect(blacklistPutArgs.Item.AccountId).to.be.eql({ S: account.accountId });
  });

  it('should pass empty string to table name if BLACKLIST_TABLE environment variable is null', async () => {
    // Arrange
    const account: Account = new Account('SENDER');

    delete process.env.BLACKLIST_TABLE;

    // Act
    await blacklistService.addAccountToBlacklist(account);

    // Assert;
    const blacklistPutArgs: Record<string, any> = dynamoDbClientStub.firstCall.args[0];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(blacklistPutArgs.TableName).to.be.empty;
    expect(blacklistPutArgs.Item.AccountId).to.be.eql({ S: account.accountId });
  });

  it('should catch DynamoDB error', async () => {
    // Arrange
    const account: Account = new Account('SENDER');

    dynamoDbClientStub.throws(new Error('DynamoDB Error'));

    // Act
    const result: Promise<void> = blacklistService.addAccountToBlacklist(account);

    // Assert;
    await expect(result).to
      .eventually.be.rejectedWith(LambdaError, 'DynamoDB Error')
      .and.to.have.property('code', 500);

    const blacklistPutArgs: Record<string, any> = dynamoDbClientStub.firstCall.args[0];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(blacklistPutArgs.TableName).to.not.be.empty;
    expect(blacklistPutArgs.TableName).to.be.eql(process.env.BLACKLIST_TABLE);
    expect(blacklistPutArgs.Item.AccountId).to.be.eql({ S: account.accountId });
  });
});
