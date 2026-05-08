export const environment = {
  production: false,
  cognito: {
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_brBwayYzu',
    clientId: '568m17rcraqh3vs02426uiesqc',
    redirectUri: 'http://localhost:4200/callback',
    scope: 'openid profile email',
  },
  apiUrl: 'http://localhost:8080/api/v1',
};
