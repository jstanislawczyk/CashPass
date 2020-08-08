import {IsInt, IsNotEmpty, IsPositive} from 'class-validator';

export class LambdaResponse {

  @IsNotEmpty()
  public readonly body: object | string;

  @IsInt()
  @IsPositive()
  public readonly statusCode: number;

  constructor(body: object | string, statusCode: number) {
    this.body = body;
    this.statusCode = statusCode;
  }
}