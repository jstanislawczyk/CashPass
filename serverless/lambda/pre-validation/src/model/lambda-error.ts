import {IsInt, IsPositive} from 'class-validator';

export class LambdaError extends Error {

  @IsInt()
  @IsPositive()
  public readonly code: number;

  constructor(message: string, code: number) {
    super(message);

    this.code = code;

    Object.setPrototypeOf(this, LambdaError.prototype);
  }
}
