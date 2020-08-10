import {Transaction} from '../model/transaction';
import {PublishResponse} from 'aws-sdk/clients/sns';
import {LambdaError} from '../model/lambda-error';
import {PromiseResult} from 'aws-sdk/lib/request';
import {AWSError} from 'aws-sdk';
import {SNS} from 'aws-sdk';
import {Service} from 'typedi';

@Service()
export class NotificationService {

  public async sendNotification(transaction: Transaction): Promise<void> {
    const snsClient: SNS = new SNS();
    const snsTopic: string = process.env.SNS_TOPIC_ARN || '';
    const message: string = JSON.stringify(transaction);
    const notificationParams: { Message: string; TopicArn: string; } = this.buildNotificationParams(message, snsTopic);

    try {
      const snsResponse: PromiseResult<PublishResponse, AWSError> = await snsClient.publish(notificationParams).promise();

      if (snsResponse.MessageId) {
        console.log(`Message successfully delivered to SNS. Topic: ${snsTopic}. Message: ${message}`);
      }
    } catch (error) {
      console.log(`Error publishing message to SNS. Topic: ${snsTopic}. Message: ${message}`, error);

      throw new LambdaError(error.message, 500);
    }
  }

  private buildNotificationParams(message: string, snsTopic: string): { Message: string; TopicArn: string; } {
    return {
      Message: message,
      TopicArn: snsTopic,
    };
  }
}
