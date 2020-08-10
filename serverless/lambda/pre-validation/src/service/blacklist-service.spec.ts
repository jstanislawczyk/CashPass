import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {SinonSandbox, SinonStub, SinonStubbedInstance} from 'sinon';
import * as sinonChai from 'sinon-chai';
import {Transaction} from '../model/transaction';
import {BlacklistService} from './blacklist-service';
import {NotificationService} from './notification-service';
import {LambdaError} from '../model/lambda-error';

use(sinonChai);
use(chaiAsPromised);

describe('LambdaPusherService', () => {

  let sandbox: SinonSandbox;
  let dynamoDbClientStub: SinonStub;
  let blacklistService: BlacklistService;
  let notificationServiceMock: SinonStubbedInstance<NotificationService>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    dynamoDbClientStub = sandbox.stub();
    notificationServiceMock = sandbox.createStubInstance(NotificationService);

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', dynamoDbClientStub);

    dynamoDbClientStub.resolves({
      Responses: {
        'BlacklistTable': [
          {
            accountId: 'SENDER',
          },
          {
            accountId: 'RECEIVER',
          },
        ],
      },
    });

    process.env.BLACKLIST_TABLE = 'BlacklistTable';

    blacklistService = new BlacklistService(notificationServiceMock as any);
  });

  afterEach(() => {
    sandbox.restore();
    AWSMock.restore();
  });

  it('should find both blacklisted accounts', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    // Act
    const result: Promise<void> = blacklistService.validateBlacklistedAccounts(transaction);

    // Assert
    const expectedErrorMessage: string = `Accounts with id=[${transaction.senderAccountId}, ${transaction.receiverAccountId}] are blacklisted`;

    await expect(result).to
      .eventually.be.rejectedWith(LambdaError, expectedErrorMessage)
      .and.to.have.property('code', 409);

    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems[process.env.BLACKLIST_TABLE];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams.Keys.length).to.be.eql(2);
    expect(batchGetParams.Keys[0].AccountId).to.be.eql(transaction.receiverAccountId);
    expect(batchGetParams.Keys[1].AccountId).to.be.eql(transaction.senderAccountId);

    expect(notificationServiceMock.sendNotification).to.be.calledOnce;
    expect(notificationServiceMock.sendNotification.firstCall.args[0]).to.be.eql(transaction);
  });

  it('should find sender blacklisted account', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    dynamoDbClientStub.resolves({
      Responses: {
        'BlacklistTable': [
          {
            accountId: transaction.senderAccountId,
          },
        ],
      },
    });

    // Act
    const result: Promise<void> = blacklistService.validateBlacklistedAccounts(transaction);

    // Assert
    const expectedErrorMessage: string = `Accounts with id=[${transaction.senderAccountId}] are blacklisted`;

    await expect(result).to
      .eventually.be.rejectedWith(LambdaError, expectedErrorMessage)
      .and.to.have.property('code', 409);

    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems[process.env.BLACKLIST_TABLE];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams.Keys.length).to.be.eql(2);
    expect(batchGetParams.Keys[0].AccountId).to.be.eql(transaction.receiverAccountId);
    expect(batchGetParams.Keys[1].AccountId).to.be.eql(transaction.senderAccountId);

    expect(notificationServiceMock.sendNotification).to.be.calledOnce;
    expect(notificationServiceMock.sendNotification.firstCall.args[0]).to.be.eql(transaction);
  });

  it('should find receiver blacklisted account', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    dynamoDbClientStub.resolves({
      Responses: {
        'BlacklistTable': [
          {
            accountId: transaction.receiverAccountId,
          },
        ],
      },
    });

    // Act
    const result: Promise<void> = blacklistService.validateBlacklistedAccounts(transaction);

    // Assert
    const expectedErrorMessage: string = `Accounts with id=[${transaction.receiverAccountId}] are blacklisted`;

    await expect(result).to
      .eventually.be.rejectedWith(LambdaError, expectedErrorMessage)
      .and.to.have.property('code', 409);

    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems[process.env.BLACKLIST_TABLE];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams.Keys.length).to.be.eql(2);
    expect(batchGetParams.Keys[0].AccountId).to.be.eql(transaction.receiverAccountId);
    expect(batchGetParams.Keys[1].AccountId).to.be.eql(transaction.senderAccountId);

    expect(notificationServiceMock.sendNotification).to.be.calledOnce;
    expect(notificationServiceMock.sendNotification.firstCall.args[0]).to.be.eql(transaction);
  });

  it('should not find any blacklisted account', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    dynamoDbClientStub.resolves({
      Responses: {
        'BlacklistTable': [],
      },
    });

    // Act
    await blacklistService.validateBlacklistedAccounts(transaction);

    // Assert
    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems[process.env.BLACKLIST_TABLE];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams.Keys.length).to.be.eql(2);
    expect(batchGetParams.Keys[0].AccountId).to.be.eql(transaction.receiverAccountId);
    expect(batchGetParams.Keys[1].AccountId).to.be.eql(transaction.senderAccountId);

    expect(notificationServiceMock.sendNotification).to.not.be.called;
  });

  it('should not throw error if there is no blacklisted account', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    dynamoDbClientStub.resolves({
      Responses: {
        'BlacklistTable': [],
      },
    });

    // Act
    await blacklistService.validateBlacklistedAccounts(transaction);

    // Assert
    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems[process.env.BLACKLIST_TABLE];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams.Keys.length).to.be.eql(2);
    expect(batchGetParams.Keys[0].AccountId).to.be.eql(transaction.receiverAccountId);
    expect(batchGetParams.Keys[1].AccountId).to.be.eql(transaction.senderAccountId);

    expect(notificationServiceMock.sendNotification).to.not.be.called;
  });

  it('should provide empty blacklist table name if it was not provided', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    delete process.env.BLACKLIST_TABLE;

    dynamoDbClientStub.resolves({});

    // Act
    await blacklistService.validateBlacklistedAccounts(transaction);

    // Assert
    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems;

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams[process.env.BLACKLIST_TABLE]).to.be.undefined;

    expect(notificationServiceMock.sendNotification).to.not.be.called;
  });

  it('should throw dynamoDb error', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    dynamoDbClientStub.throws(new Error('DynamoClient error'));

    // Act
    const result: Promise<void> = blacklistService.validateBlacklistedAccounts(transaction);

    // Assert
    await expect(result).to.eventually.be.rejectedWith(Error, 'DynamoClient error');

    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems[process.env.BLACKLIST_TABLE];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams.Keys.length).to.be.eql(2);
    expect(batchGetParams.Keys[0].AccountId).to.be.eql(transaction.receiverAccountId);
    expect(batchGetParams.Keys[1].AccountId).to.be.eql(transaction.senderAccountId);

    expect(notificationServiceMock.sendNotification).to.not.be.called;
  });
});
