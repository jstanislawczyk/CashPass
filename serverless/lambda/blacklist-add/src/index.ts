import 'reflect-metadata';
import {LambdaResponse} from './model/lambda-response';
import {Container} from 'typedi';
import {BlacklistService} from './service/blacklist-service';
import {Account} from './model/account';

export const handler = async (event: any = {}): Promise<any> => {

  console.log(event);
  const blacklistService: BlacklistService = Container.get(BlacklistService);

  try {
    const account: Account = new Account('SENDER');

    await blacklistService.addAccountToBlacklist(account);

    return new LambdaResponse(account.toString(), 201);
  } catch (error) {
    console.log(`Error occurred: ${JSON.stringify(error)}`);

    return new LambdaResponse(error.message, error.code);
  }
};
