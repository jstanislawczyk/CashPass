import {IsInt, IsNotEmpty, IsPositive} from 'class-validator';

export class LambdaResponse {

  @IsNotEmpty()
  public readonly body: Record<string, unknown> | string;

  @IsInt()
  @IsPositive()
  public readonly statusCode: number;

  constructor(body: Record<string, unknown> | string, statusCode: number = 500) {
    this.body = body;
    this.statusCode = statusCode;
  }
}
