import {handler} from './index';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import {SinonSandbox, SinonStub} from 'sinon';
import {LambdaResponse} from './model/lambda-response';
import {BlacklistService} from './service/blacklist-service';
import {Account} from './model/account';

use(sinonChai);
use(chaiAsPromised);

describe('Index', () => {

  const event: Record<string, unknown> = {
    test: 123,
  };

  let sandbox: SinonSandbox;
  let blacklistAccountStub: SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    blacklistAccountStub = sandbox.stub(BlacklistService.prototype, 'addAccountToBlacklist');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should successfully blacklist account', async () => {
    // Arrange
    const account: Account = new Account('SENDER');
    const expectedResponse: LambdaResponse = new LambdaResponse(account.toString(), 201);

    // Act
    const response: LambdaResponse = await handler(event);

    // Assert
    expect(blacklistAccountStub).to.be.calledOnce;
    expect(blacklistAccountStub.firstCall.args[0]).to.be.eql(account);
    expect(response).to.be.eql(expectedResponse);
  });

  it('should catch blacklist service error', async () => {
    // Arrange
    const expectedResponse: LambdaResponse = new LambdaResponse('BlacklistService error', 500);
    const expectedBlacklistCallArgs: Account = new Account('SENDER');
    const errorThrown: Error = new Error('BlacklistService error');

    blacklistAccountStub.throws(errorThrown);

    // Act
    const response: LambdaResponse = await handler(event);

    // Assert
    expect(blacklistAccountStub).to.be.calledOnce;
    expect(blacklistAccountStub.firstCall.args[0]).to.be.eql(expectedBlacklistCallArgs);
    expect(response).to.be.eql(expectedResponse);
  });
});
