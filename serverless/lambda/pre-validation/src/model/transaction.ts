import {IsNotEmpty} from 'class-validator';

export class Transaction {

  @IsNotEmpty()
  public readonly senderAccountId: string;

  @IsNotEmpty()
  public readonly receiverAccountId: string;

  public detailedStatus: string = '';

  public toString(): string {
    return JSON.stringify(this);
  }

  constructor(senderAccountId: string, receiverAccountId: string) {
    this.senderAccountId = senderAccountId;
    this.receiverAccountId = receiverAccountId;
  }
}
