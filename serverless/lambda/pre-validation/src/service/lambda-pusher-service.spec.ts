import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {SinonSandbox, SinonStub} from 'sinon';
import * as sinonChai from 'sinon-chai';
import {Transaction} from '../model/transaction';
import {LambdaPusherService} from './lambda-pusher-service';

use(sinonChai);
use(chaiAsPromised);

describe('LambdaPusherService', () => {

  let sandbox: SinonSandbox;
  let lambdaStub: SinonStub;
  let lambdaPusherService: LambdaPusherService;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    lambdaStub = sandbox.stub();

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('Lambda', 'invoke', lambdaStub);

    lambdaStub.resolves({});

    process.env.TRANSACTION_LAMBDA_NAME = 'TransactionLambda';

    lambdaPusherService = new LambdaPusherService();
  });

  afterEach(() => {
    sandbox.restore();
    AWSMock.restore();
  });

  it('should invoke transaction lambda', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    // Act
    await lambdaPusherService.passTransactionToLambda(transaction);

    // Assert
    const lambdaArgs: Record<string, string> = lambdaStub.firstCall.args[0];

    expect(lambdaStub).to.be.calledOnce;
    expect(lambdaArgs.FunctionName).to.be.eql('TransactionLambda');
    expect(lambdaArgs.Payload).to.be.eql(transaction.toString());
  });

  it('should rethrow error if function name is empty string', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    process.env.TRANSACTION_LAMBDA_NAME = '';

    // Act
    const result: Promise<void> = lambdaPusherService.passTransactionToLambda(transaction);

    // Assert
    await expect(result).to.eventually.be
      .rejectedWith(Error, 'Expected uri parameter to have length >= 1, but found "" for params.FunctionName');

    expect(lambdaStub).to.not.be.called;
  });

  it('should provide empty string if transaction lambda name is not provided', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    delete process.env.TRANSACTION_LAMBDA_NAME;

    // Act
    const result: Promise<void> = lambdaPusherService.passTransactionToLambda(transaction);

    // Assert
    await expect(result).to.eventually.be
      .rejectedWith(Error, 'Expected uri parameter to have length >= 1, but found "" for params.FunctionName');

    expect(lambdaStub).to.not.be.called;
  });

  it('should catch and rethrow Lambda exception', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    lambdaStub.rejects(new Error('Lambda exception'));

    // Act
    const result: Promise<void> = lambdaPusherService.passTransactionToLambda(transaction);

    // Assert
    await expect(result).to.eventually.be.rejectedWith(Error, 'Lambda exception');

    const lambdaArgs: Record<string, string> = lambdaStub.firstCall.args[0];

    expect(lambdaStub).to.be.calledOnce;
    expect(lambdaArgs.FunctionName).to.be.eql('TransactionLambda');
    expect(lambdaArgs.Payload).to.be.eql(transaction.toString());
  });
});
