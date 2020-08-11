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
import {LambdaError} from '../model/lambda-error';

use(sinonChai);
use(chaiAsPromised);

describe('NotificationService', () => {

  let sandbox: SinonSandbox;
  let snsStub: SinonStub;
  let consoleLogStub: SinonStub;
  let notificationService: NotificationService;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    snsStub = sandbox.stub();
    consoleLogStub = sandbox.stub(console, 'log');

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('SNS', 'publish', snsStub);

    snsStub.resolves({});

    process.env.SNS_TOPIC_ARN = 'TestTopic';

    notificationService = new NotificationService();
  });

  afterEach(() => {
    sandbox.restore();
    AWSMock.restore();
  });

  it('should call SNS publish', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    snsStub.resolves({ MessageId: 'TestId' });

    // Act
    await notificationService.sendNotification(transaction);

    // Assert
    const snsPublishArgs: Record<string, string> = snsStub.firstCall.args[0];

    expect(snsStub).to.be.calledOnce;
    expect(snsPublishArgs.Message).to.be.eql(transaction.toString());
    expect(snsPublishArgs.TopicArn).to.be.eql('TestTopic');
    expect(consoleLogStub).to.be.calledOnce;
    expect(consoleLogStub.firstCall.args[0]).to.be.eql(
      `Message successfully delivered to SNS. Topic: ${process.env.SNS_TOPIC_ARN}. Message: ${transaction.toString()}`
    );
  });

  it('should call SNS publish without MessageId in response', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    // Act
    await notificationService.sendNotification(transaction);

    // Assert
    const snsPublishArgs: Record<string, string> = snsStub.firstCall.args[0];

    expect(snsStub).to.be.calledOnce;
    expect(snsPublishArgs.Message).to.be.eql(transaction.toString());
    expect(snsPublishArgs.TopicArn).to.be.eql('TestTopic');
    expect(consoleLogStub).to.not.be.called;
  });

  it('should call SNS publish with empty topic if SNS_TOPIC_ARN is not provided', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    delete process.env.SNS_TOPIC_ARN;

    // Act
    await notificationService.sendNotification(transaction);

    // Assert
    const snsPublishArgs: Record<string, string> = snsStub.firstCall.args[0];

    expect(snsStub).to.be.calledOnce;
    expect(snsPublishArgs.Message).to.be.eql(transaction.toString());
    expect(snsPublishArgs.TopicArn).to.be.empty;
  });

  it('should catch and handle SNS error', async () => {
    // Arrange
    const transaction: Transaction = new Transaction('SENDER', 'RECEIVER');

    snsStub.throws(new Error('SNS error'));

    // Act
    const result: Promise<void> = notificationService.sendNotification(transaction);

    // Assert
    await expect(result).to.eventually.be.rejectedWith(LambdaError, 'SNS error')
      .and.to.have.property('code', 500);

    const snsPublishArgs: Record<string, string> = snsStub.firstCall.args[0];

    expect(snsStub).to.be.calledOnce;
    expect(snsPublishArgs.Message).to.be.eql(transaction.toString());
    expect(snsPublishArgs.TopicArn).to.be.eql('TestTopic');
    expect(consoleLogStub).to.be.calledOnce;
    expect(consoleLogStub.firstCall.args[0]).to.be.eql(
      `Error publishing message to SNS. Topic: ${process.env.SNS_TOPIC_ARN}. Message: ${transaction.toString()}`
    );
  });
});
