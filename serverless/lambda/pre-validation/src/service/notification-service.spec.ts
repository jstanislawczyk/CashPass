import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {expect, use} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {afterEach, beforeEach, describe, it} from 'mocha';
import * as sinon from 'sinon';
import {SinonSandbox, SinonStub} from 'sinon';
import * as sinonChai from 'sinon-chai';
import {NotificationService} from './notification-service';
import {Transaction} from '../model/transaction';

use(sinonChai);
use(chaiAsPromised);

describe('NotificationService', () => {

  let sandbox: SinonSandbox;
  let snsStub: SinonStub;
  let notificationService: NotificationService;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    snsStub = sandbox.stub();

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('SNS', 'publish', snsStub);

    notificationService = new NotificationService();
  });

  afterEach(() => {
    sandbox.restore();
    AWSMock.restore();
  });

  it('should throw exception when checking message uniqueness fails', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');
    snsStub.resolves({});

    // Act
    await notificationService.sendNotification(transaction);

    // Assert
    expect(snsStub).to.be.calledOnce;
  });
});
