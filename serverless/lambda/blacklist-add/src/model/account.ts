import {IsNotEmpty} from 'class-validator';

export class Account {

  @IsNotEmpty()
  public readonly accountId: string;

  public toString(): string {
    return JSON.stringify(this);
  }

  constructor(accountId: string) {
    this.accountId = accountId;
  }
}
