import {handler} from './index';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import {SinonSandbox, SinonStub} from 'sinon';
import {TransactionService} from './service/transaction-service';
import {LambdaResponse} from './model/lambda-response';
import {Transaction} from './model/transaction';

use(sinonChai);
use(chaiAsPromised);

describe('Index', () => {

  const event: Record<string, unknown> = {
    test: 123,
  };

  let sandbox: SinonSandbox;
  let processTransactionStub: SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    processTransactionStub = sandbox.stub(TransactionService.prototype, 'processTransaction');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should process transaction', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');
    const expectedResponse: LambdaResponse = new LambdaResponse(transaction.toString(), 201);

    // Act
    const response: LambdaResponse = await handler(event);

    // Assert
    expect(processTransactionStub).to.be.calledOnce;
    expect(response).to.be.eql(expectedResponse);
  });

  it('should catch transaction service error', async () => {
    // Arrange
    const expectedResponse: LambdaResponse = new LambdaResponse('TransactionService error', 409);
    const errorThrown: object = {
      code: 409,
      message: 'TransactionService error',
    };

    processTransactionStub.throws(errorThrown);

    // Act
    const response: LambdaResponse = await handler(event);

    // Assert
    expect(processTransactionStub).to.be.calledOnce;
    expect(response).to.be.eql(expectedResponse);
  });
});
