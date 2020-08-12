import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {SinonSandbox, SinonStub} from 'sinon';
import * as sinonChai from 'sinon-chai';
import {handler} from '../../src';
import {LambdaResponse} from '../../src/model/lambda-response';
import {Account} from '../../src/model/account';

use(sinonChai);
use(chaiAsPromised);

describe('Process transaction', () => {

  let sandbox: SinonSandbox;
  let dynamoDBPutItemStub: SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    dynamoDBPutItemStub = sandbox.stub();

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB', 'putItem', dynamoDBPutItemStub);

    dynamoDBPutItemStub.resolves({
      Responses: {
        'BlacklistTable': [],
      },
    });

    process.env.BLACKLIST_TABLE = 'BlacklistTable';
  });

  afterEach(() => {
    sandbox.restore();
    AWSMock.restore();
  });

  it('should add account to blacklist', async () => {
    // Arrange
    const event: Record<string, any> = {
      test: 'test',
    };
    const account: Account = new Account('SENDER');
    const expectedResult: LambdaResponse = new LambdaResponse(account.toString(), 201);

    // Act
    const result: LambdaResponse = await handler(event);

    // Assert
    expect(result).to.be.eql(expectedResult);
  });
});
