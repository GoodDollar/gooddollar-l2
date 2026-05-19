import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  credentialHasUsableAuth,
  loadEtoroCredentialsFromFile,
  parseEtoroCredentialsTsv,
  redactedCredentialSummary,
  selectEtoroCredential,
} from '../credentials';

describe('eToro credential loading', () => {
  it('parses a header-based TSV without exposing secret values in summaries', () => {
    const records = parseEtoroCredentialsTsv([
      'profile\tusername\tpassword\tapi_key\tclient_id\tbase_url',
      'paper\tuser@example.com\tsuper-secret\tapi-secret\tclient-1\thttps://api.example.test',
    ].join('\n'));

    expect(records).toHaveLength(1);
    expect(records[0].profile).toBe('paper');
    expect(records[0].apiKey).toBe('api-secret');
    expect(credentialHasUsableAuth(records[0])).toBe(true);

    const summary = redactedCredentialSummary(records[0]);
    expect(summary.username).toBe('us***om');
    expect(JSON.stringify(summary)).not.toContain('super-secret');
    expect(JSON.stringify(summary)).not.toContain('api-secret');
  });

  it('supports no-header TSV fixtures with generated profiles', () => {
    const records = parseEtoroCredentialsTsv('user@example.com\tpassword-1\tapi-key-1');
    expect(records[0].profile).toBe('test-user-1');
    expect(records[0].username).toBe('user@example.com');
    expect(records[0].password).toBe('password-1');
    expect(records[0].apiKey).toBe('api-key-1');
  });

  it('loads and selects a credential profile from a local TSV file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'etoro-creds-'));
    const file = path.join(tmpDir, 'users.tsv');
    fs.writeFileSync(file, 'profile\tusername\tpassword\nfirst\ta@example.test\ta\nsecond\tb@example.test\tb\n', 'utf8');

    const selected = selectEtoroCredential(loadEtoroCredentialsFromFile(file), 'second');
    expect(selected.username).toBe('b@example.test');
  });
});
