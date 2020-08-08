import {Service} from 'typedi';
import {Transaction} from '../model/transaction';
import {BlacklistService} from './blacklist-service';
import {LambdaPusherService} from './lambda-pusher-service';

@Service()
export class TransactionService {

  constructor(
    private readonly blacklistService: BlacklistService,
    private readonly lambdaPusherService: LambdaPusherService,
  ) {
  }

  public async processTransaction(transaction: Transaction): Promise<void> {
    await this.blacklistService.validateBlacklistedAccounts(transaction);
    await this.lambdaPusherService.passTransactionToLambda(transaction);
  }
}
