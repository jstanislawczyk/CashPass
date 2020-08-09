import {IsInt, IsNotEmpty, IsPositive} from 'class-validator';

export class LambdaError {

  @IsNotEmpty()
  public readonly message: string;

  @IsInt()
  @IsPositive()
  public readonly code: number;

  constructor(message: string, code: number) {
    this.message = message;
    this.code = code;
  }
}
