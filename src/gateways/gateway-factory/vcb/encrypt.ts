import * as forge from 'node-forge';

export class Encrypt {
  keys: any;
  clientPublicKey: any;
  clientPrivateKey: any;
  constructor() {
    this.genKeys();
  }
  get defaultPublicKey() {
    return 'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFpa3FRckl6WkprVXZIaXNqZnU1WkNOK1RMeS8vNDNDSWM1aEpFNzA5VElLM0hiY0M5dnVjMitQUEV0STZwZVNVR3FPbkZvWU93bDNpOHJSZFNhSzE3RzJSWk4wMU1JcVJJSi82YWM5SDRMMTFkdGZRdFI3S0hxRjdLRDBmajZ2VTRrYjUrMGN3UjNSdW1CdkRlTWxCT2FZRXBLd3VFWTlFR3F5OWJjYjVFaE5HYnh4TmZiVWFvZ3V0VndHNUMxZUtZSXR6YVlkNnRhbzNncTdzd05IN3A2VWRsdHJDcHhTd0ZFdmM3ZG91RTJzS3JQRHA4MDdaRzJkRnNsS3h4bVI0V0hESFdmSDBPcHpyQjVLS1dRTnl6WHhUQlhlbHFyV1pFQ0xSeXBOcTdQKzFDeWZnVFNkUTM1ZmRPN00xTW5pU0JUMVYzM0xkaFhvNzMvOXFENWU1VlFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t';
  }
  genKeys() {
    if (!this.keys)
      this.keys = forge.pki.rsa.generateKeyPair({
        bits: 1024,
        workers: 1,
      });

    this.clientPublicKey = forge.pki
      .publicKeyToPem(this.keys.publicKey)
      .replace(/(-|(BEGIN|END) PUBLIC KEY|\r|\n)/gi, '');

    this.clientPrivateKey = forge.pki.privateKeyToPem(this.keys.privateKey);
  }
  encryptRequest(m) {
    try {
      const v = forge.random.getBytesSync(32),
        N = forge.random.getBytesSync(16);
      m = {
        clientPubKey: this.clientPublicKey,
        ...m,
      };
      const A = forge.cipher.createCipher('AES-CTR', v);
      A.start({
        iv: N,
      }),
        A.update(
          forge.util.createBuffer(forge.util.encodeUtf8(JSON.stringify(m))),
        ),
        A.finish();
      const o = Buffer.concat([
          Buffer.from(N, 'binary'),
          Buffer.from(A.output.data, 'binary'),
        ]),
        s = forge.pki
          .publicKeyFromPem(forge.util.decode64(this.defaultPublicKey))
          .encrypt(forge.util.encode64(v));
      return {
        d: o.toString('base64'),
        k: forge.util.encode64(s),
      };
    } catch (v) {
      return {
        d: '',
        k: '',
      };
    }
  }
  decryptResponse(m) {
    const { k: v, d: N } = m,
      A = forge.pki.privateKeyFromPem(this.clientPrivateKey),
      o = forge.util.decodeUtf8(A.decrypt(forge.util.decode64(v))),
      f = Buffer.from(N, 'base64'),
      s = f.slice(0, 16),
      d = f.slice(16),
      S = forge.cipher.createDecipher(
        'AES-CTR',
        Buffer.from(o, 'base64').toString('binary'),
      );
    return (
      S.start({
        iv: s.toString('binary'),
      }),
      S.update(forge.util.createBuffer(d)),
      S.finish(),
      forge.util.decodeUtf8(S.output.data)
    );
  }
  sha256(m) {
    return forge.md.sha256.create().update(m).digest().toHex();
  }
}
