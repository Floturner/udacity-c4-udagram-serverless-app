import { APIGatewayTokenAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda';
import 'source-map-support/register';

import { verify } from 'jsonwebtoken';
import { JwtToken } from '../../../auth/JwtToken';

const cert = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJD2TLDaI7d2BqMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1qY28wM2NkMW84d3hzZTF6LnVzLmF1dGgwLmNvbTAeFw0yMzAyMTcx
NDMzMTlaFw0zNjEwMjYxNDMzMTlaMCwxKjAoBgNVBAMTIWRldi1qY28wM2NkMW84
d3hzZTF6LnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAMFLmuFoBUyRdaPURWMaaeI2cuNvhd7CWUJu51Knqc/vSJVJND67+DQi4iRO
kshJBPdZQ7mbA7zZTYYoKtIyGBkohioPh5BRVqFXzKDhXvDPsPz4Wc0UsXx38/K0
o0PW6M5qqt+7oAjGgrlj2+A3vfMQwLv+sNOGyztRuSjU2dQSKMCg0+WX8sT3Hn7B
SpyaoVMQn7zgebUdi82+qsnRoqRSrgH2urgxC6U4e/L2VOxsFmlCTyVl8cNO1tsf
Hrrg0fOg3YcoWHRu7ChvTK19swptBAGYVQYiiRnrslpNYWCCixnwd5Tx0BvDyPho
hNCN98+uAk97qAaPyTLula6+uq0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUh7N9McYx2/q7CQItQ/ZPZelmKsYwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQDAqJl0pnVZwtfhXNr8K4+2xSxR9mnLSKkYNVlsKU2v
9PFpCAinKlZde7xlaB60PejuHqrmSBrjvm8eSGdIlmHXfWFcDTX1HLYGcd6lrp80
BEeNS4BgRtPtNqSpXoe/RVjlX1/MYhHYCTjFkBiSdf4SN48jRyLn100wBzzAFcEf
lqeUCZ5O7QVe0eTmCG+ZXOI6bZMcbih0nPPcnLVSsZakwrT/vBu/8ILPqyaBCSrs
nJQ/5npRHx+vsNAqeD7SwoJHXfpf69Mr6LyFde+RMWxIl2Okz8SpUf0PgUaapixF
FNyxnau/3ul/msm16WY2ZJYE2p+MrKDX6mOm6VaFxsnp
-----END CERTIFICATE-----`;

export const main = async (event: APIGatewayTokenAuthorizerEvent): Promise<CustomAuthorizerResult> => {
	try {
		const jwtToken = verifyToken(event.authorizationToken);
		console.log('User was authorized', jwtToken);

		return {
			principalId: jwtToken.sub,
			policyDocument: {
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'execute-api:Invoke',
						Effect: 'Allow',
						Resource: '*',
					},
				],
			},
		};
	} catch (e) {
		console.log('User authorized', e.message);

		return {
			principalId: 'user',
			policyDocument: {
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'execute-api:Invoke',
						Effect: 'Deny',
						Resource: '*',
					},
				],
			},
		};
	}
};

function verifyToken(authHeader: string): JwtToken {
	if (!authHeader) throw new Error('No authentication header');

	if (!authHeader.toLowerCase().startsWith('bearer ')) throw new Error('Invalid authentication header');

	const split = authHeader.split(' ');
	const token = split[1];

	return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken;
}
