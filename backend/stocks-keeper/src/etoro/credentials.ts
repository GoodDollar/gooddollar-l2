import fs from 'fs';
import path from 'path';
import { EtoroCredentialRecord } from './types';

export const DEFAULT_ETORO_CREDENTIALS_FILE =
  '/home/goodclaw/.openclaw/workspace/.credentials/etoro-api-test-users.tsv';

const DEFAULT_NO_HEADER_COLUMNS = ['username', 'password', 'apiKey', 'clientId', 'clientSecret'];

const HEADER_ALIASES: Record<string, keyof Omit<EtoroCredentialRecord, 'raw'> | 'apiKey' | 'clientSecret'> = {
  profile: 'profile',
  name: 'profile',
  label: 'profile',
  user: 'username',
  username: 'username',
  email: 'username',
  login: 'username',
  password: 'password',
  pass: 'password',
  api_key: 'apiKey',
  apikey: 'apiKey',
  api_token: 'token',
  access_token: 'token',
  bearer_token: 'token',
  token: 'token',
  client_id: 'clientId',
  clientid: 'clientId',
  client_secret: 'clientSecret',
  clientsecret: 'clientSecret',
  account_id: 'accountId',
  accountid: 'accountId',
  base_url: 'baseUrl',
  baseurl: 'baseUrl',
  environment: 'environment',
  env: 'environment',
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function splitTsvLine(line: string): string[] {
  return line.split('\t').map((value) => value.trim());
}

function looksLikeHeader(fields: string[]): boolean {
  if (fields.length === 0) return false;
  const normalized = fields.map(normalizeHeader);
  return normalized.some((field) => Object.prototype.hasOwnProperty.call(HEADER_ALIASES, field));
}

function assign(record: Partial<EtoroCredentialRecord>, key: string, value: string): void {
  if (!value) return;
  const normalized = normalizeHeader(key);
  const target = HEADER_ALIASES[normalized] ?? normalized;

  switch (target) {
    case 'profile':
    case 'username':
    case 'password':
    case 'apiKey':
    case 'clientId':
    case 'clientSecret':
    case 'token':
    case 'accountId':
    case 'baseUrl':
    case 'environment':
      record[target] = value;
      break;
    default:
      break;
  }
}

export interface ParseEtoroCredentialsOptions {
  defaultProfilePrefix?: string;
}

export function parseEtoroCredentialsTsv(
  content: string,
  opts: ParseEtoroCredentialsOptions = {},
): EtoroCredentialRecord[] {
  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map(splitTsvLine);

  if (rows.length === 0) return [];

  const hasHeader = looksLikeHeader(rows[0]);
  const headers = hasHeader ? rows[0] : DEFAULT_NO_HEADER_COLUMNS;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const prefix = opts.defaultProfilePrefix ?? 'test-user';

  return dataRows.map((fields, index) => {
    const raw: Record<string, string> = {};
    const record: Partial<EtoroCredentialRecord> = { raw };

    fields.forEach((value, fieldIndex) => {
      const header = headers[fieldIndex] ?? `field_${fieldIndex + 1}`;
      raw[header] = value;
      assign(record, header, value);
    });

    if (!record.profile) record.profile = `${prefix}-${index + 1}`;

    return record as EtoroCredentialRecord;
  });
}

export function loadEtoroCredentialsFromFile(
  filePath = process.env.ETORO_CREDENTIALS_FILE ?? DEFAULT_ETORO_CREDENTIALS_FILE,
): EtoroCredentialRecord[] {
  const resolved = path.resolve(filePath);
  const content = fs.readFileSync(resolved, 'utf8');
  return parseEtoroCredentialsTsv(content);
}

export function selectEtoroCredential(
  records: EtoroCredentialRecord[],
  profile = process.env.ETORO_CREDENTIALS_PROFILE,
): EtoroCredentialRecord {
  if (records.length === 0) {
    throw new Error('No eToro credential records were loaded');
  }

  if (!profile) return records[0];

  const selected = records.find((record) => record.profile === profile);
  if (!selected) {
    throw new Error(`No eToro credential record matched profile ${profile}`);
  }

  return selected;
}

export function loadSelectedEtoroCredential(
  filePath = process.env.ETORO_CREDENTIALS_FILE ?? DEFAULT_ETORO_CREDENTIALS_FILE,
  profile = process.env.ETORO_CREDENTIALS_PROFILE,
): EtoroCredentialRecord {
  return selectEtoroCredential(loadEtoroCredentialsFromFile(filePath), profile);
}

export function credentialHasUsableAuth(record: EtoroCredentialRecord): boolean {
  return Boolean(
    record.token ||
      record.apiKey ||
      record.clientSecret ||
      (record.username && record.password),
  );
}

export function redactedCredentialSummary(record: EtoroCredentialRecord): Record<string, string | boolean | undefined> {
  return {
    profile: record.profile,
    username: record.username ? maskIdentifier(record.username) : undefined,
    hasPassword: Boolean(record.password),
    hasApiKey: Boolean(record.apiKey),
    hasClientId: Boolean(record.clientId),
    hasClientSecret: Boolean(record.clientSecret),
    hasToken: Boolean(record.token),
    hasAccountId: Boolean(record.accountId),
    baseUrl: record.baseUrl,
    environment: record.environment,
  };
}

function maskIdentifier(value: string): string {
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}
