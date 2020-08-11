import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {SinonSandbox, SinonStubbedInstance} from 'sinon';
import * as sinonChai from 'sinon-chai';
import {Transaction} from '../model/transaction';
import {BlacklistService} from './blacklist-service';
import {LambdaError} from '../model/lambda-error';
import {LambdaPusherService} from './lambda-pusher-service';
import {TransactionService} from './transaction-service';

use(sinonChai);
use(chaiAsPromised);

describe('TransactionService', () => {

  let sandbox: SinonSandbox;
  let transactionService: TransactionService;
  let blacklistServiceMock: SinonStubbedInstance<BlacklistService>;
  let lambdaPusherServiceMock: SinonStubbedInstance<LambdaPusherService>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    blacklistServiceMock = sandbox.createStubInstance(BlacklistService);
    lambdaPusherServiceMock = sandbox.createStubInstance(LambdaPusherService);

    transactionService = new TransactionService(
      blacklistServiceMock as any,
      lambdaPusherServiceMock as any,
    );
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should handle validation and lambda push services', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    // Act
    await transactionService.processTransaction(transaction);

    // Assert
    expect(blacklistServiceMock.validateBlacklistedAccounts).to.be.calledOnce;
    expect(blacklistServiceMock.validateBlacklistedAccounts.firstCall.args[0]).to.be.eql(transaction);
    expect(lambdaPusherServiceMock.passTransactionToLambda).to.be.calledOnce;
    expect(lambdaPusherServiceMock.passTransactionToLambda.firstCall.args[0]).to.be.eql(transaction);
  });

  it('should throw error from blacklist service', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    blacklistServiceMock.validateBlacklistedAccounts.throws(new LambdaError('BlacklistService Error', 500));

    // Act
    const result: Promise<void> = transactionService.processTransaction(transaction);

    // Assert
    await expect(result).to
      .eventually.be.rejectedWith(LambdaError, 'BlacklistService Error')
      .and.to.have.property('code', 500);

    expect(blacklistServiceMock.validateBlacklistedAccounts).to.be.calledOnce;
    expect(blacklistServiceMock.validateBlacklistedAccounts.firstCall.args[0]).to.be.eql(transaction);
    expect(lambdaPusherServiceMock.passTransactionToLambda).to.not.be.called;
  });

  it('should throw error from lambda pusher service', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    lambdaPusherServiceMock.passTransactionToLambda.throws(new LambdaError('LambdaPusherService Error', 500));

    // Act
    const result: Promise<void> = transactionService.processTransaction(transaction);

    // Assert
    await expect(result).to
      .eventually.be.rejectedWith(LambdaError, 'LambdaPusherService Error')
      .and.to.have.property('code', 500);

    expect(blacklistServiceMock.validateBlacklistedAccounts).to.be.calledOnce;
    expect(blacklistServiceMock.validateBlacklistedAccounts.firstCall.args[0]).to.be.eql(transaction);
    expect(lambdaPusherServiceMock.passTransactionToLambda).to.be.calledOnce;
    expect(lambdaPusherServiceMock.passTransactionToLambda.firstCall.args[0]).to.be.eql(transaction);
  });
});
