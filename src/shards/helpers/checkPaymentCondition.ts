import { Payment } from 'src/gateways/gate.interface';

export function CheckPaymentConditions(
  payment: Payment,
  condition: {
    content_regex: string;
    account_regex: string;
  },
) {
  const { content_regex, account_regex } = condition;
  const isMatchContent = !!payment.content.match(
    new RegExp(content_regex, 'gmi'),
  );
  const isMatchAccount = !!payment.accountNo.match(
    new RegExp(account_regex, 'gmi'),
  );
  return isMatchContent && isMatchAccount;
}
