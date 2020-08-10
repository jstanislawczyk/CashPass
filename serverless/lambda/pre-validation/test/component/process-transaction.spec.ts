import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {SinonSandbox, SinonStub} from 'sinon';
import * as sinonChai from 'sinon-chai';
import {Transaction} from '../../src/model/transaction';
import {handler} from '../../src';
import {LambdaResponse} from '../../src/model/lambda-response';

use(sinonChai);
use(chaiAsPromised);

describe('Process transaction', () => {

  let sandbox: SinonSandbox;
  let snsStub: SinonStub;
  let lambdaStub: SinonStub;
  let dynamoDbClientStub: SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    snsStub = sandbox.stub();
    lambdaStub = sandbox.stub();
    dynamoDbClientStub = sandbox.stub();

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('SNS', 'publish', snsStub);
    AWSMock.mock('Lambda', 'invoke', lambdaStub);
    AWSMock.mock('DynamoDB.DocumentClient', 'batchGet', dynamoDbClientStub);

    snsStub.resolves({ MessageId: 'TestId' });
    lambdaStub.resolves({});
    dynamoDbClientStub.resolves({
      Responses: {
        'BlacklistTable': [],
      },
    });

    process.env.BLACKLIST_TABLE = 'BlacklistTable';
    process.env.SNS_TOPIC_ARN = 'TestTopic';
    process.env.TRANSACTION_LAMBDA_NAME = 'TransactionLambda';
  });

  afterEach(() => {
    sandbox.restore();
    AWSMock.restore();
  });

  it('should process transaction', async () => {
    // Arrange
    const event: Record<string, any> = {
      test: 'test',
    };
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');
    const expectedResponse: LambdaResponse = new LambdaResponse(transaction.toString(), 201);

    // Act
    const result: LambdaResponse = await handler(event);

    // Assert
    expect(result).to.be.eql(expectedResponse);

    const batchGetParams: Record<string, any> = dynamoDbClientStub.firstCall.args[0].RequestItems[process.env.BLACKLIST_TABLE];

    expect(dynamoDbClientStub).to.be.calledOnce;
    expect(batchGetParams.Keys.length).to.be.eql(2);
    expect(batchGetParams.Keys[0].AccountId).to.be.eql(transaction.receiverAccountId);
    expect(batchGetParams.Keys[1].AccountId).to.be.eql(transaction.senderAccountId);

    expect(snsStub).to.not.be.called;

    const lambdaArgs: Record<string, string> = lambdaStub.firstCall.args[0];

    expect(lambdaStub).to.be.calledOnce;
    expect(lambdaArgs.FunctionName).to.be.eql('TransactionLambda');
    expect(lambdaArgs.Payload).to.be.eql(transaction.toString());
  });
});
