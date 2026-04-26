// Normalize URLs to remove trailing slashes
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

export const oauthConfig = {
  accountUrl: normalizeUrl(process.env.NEXT_PUBLIC_ACCOUNT_URL || 'https://account.moring.co'),
  ssoUrl: normalizeUrl(process.env.NEXT_PUBLIC_SSO_URL || 'https://sso.moring.co'),
  clientId: process.env.NEXT_PUBLIC_SSO_CLIENT_ID || '',
  redirectUri: process.env.NEXT_PUBLIC_SSO_REDIRECT_URI || '',
  scope: 'openid email profile',
};

export function getAuthorizationUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    response_type: 'code',
    scope: oauthConfig.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${oauthConfig.accountUrl}/api/oauth/authorize?${params.toString()}`;
}
