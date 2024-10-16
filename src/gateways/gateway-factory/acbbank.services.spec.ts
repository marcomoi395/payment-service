import * as fs from 'fs';
import { ParseAcbHistory } from '../acbbank.helpers';
describe('parseAcbHistory', () => {
  it('should parse HTML and return an array of payments', () => {
    const html = fs.readFileSync('acb2.html', 'utf8');

    const expectedPayments = [
      {
        date: '2023-11-19T17:00:00.000Z',
        transaction_id: 'acbbank-2737',
        amount: 1000000,
        content: 'IB DANG TRAN HOANG LAN KC1 + 1 WIN',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
      {
        date: '2023-11-19T17:00:00.000Z',
        transaction_id: 'acbbank-2738',
        amount: 155000,
        content: '48712273716-0917654845-CT 11246 GD 339429-112023 00:22:06',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
      {
        date: '2023-11-21T17:00:00.000Z',
        transaction_id: 'acbbank-2739',
        amount: 200000,
        content:
          'TRUONG BACH TUNG CHUYEN FT23326830405364 GD 835174-112123 22:55:59',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
      {
        date: '2023-11-22T17:00:00.000Z',
        transaction_id: 'acbbank-2740',
        amount: 4,
        content: ' LAI NHAP VON',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
      {
        date: '2023-11-27T17:00:00.000Z',
        transaction_id: 'acbbank-2741',
        amount: 975000,
        content: 'CT 11315 GD 239601-112723 22:31:13',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
      {
        date: '2023-11-27T17:00:00.000Z',
        transaction_id: 'acbbank-2742',
        amount: NaN,
        content: 'AA-271123-23:31:09 167399',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
      {
        date: '2023-11-27T17:00:00.000Z',
        transaction_id: 'acbbank-2743',
        amount: NaN,
        content: 'THU PHI DICH VU ACB ONLINE-271123-23:31:09 167399',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
      {
        date: '2023-12-13T17:00:00.000Z',
        transaction_id: 'acbbank-2744',
        amount: 381000,
        content: 'CT 11409 GD 721328-121423 12:30:14',
        gate: 'ACBBANK',
        account_receiver: '9663467',
      },
    ].map((el) => ({ ...el, date: new Date(el.date) }));

    const payments = ParseAcbHistory(html);

    expect(payments).toEqual(expectedPayments);
  });
});
