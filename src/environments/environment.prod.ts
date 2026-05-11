export const environment = {
  production: true,
  cognito: {
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_brBwayYzu',
    clientId: '568m17rcraqh3vs02426uiesqc',
    redirectUri: 'https://littlepricetracker.observer/callback',
    scope: 'openid profile email',
    domain: 'price-tracker-dev-3fde8e2b.auth.us-east-1.amazoncognito.com',
  },
  apiUrl: 'https://api.littlepricetracker.observer/api/v1',
};
