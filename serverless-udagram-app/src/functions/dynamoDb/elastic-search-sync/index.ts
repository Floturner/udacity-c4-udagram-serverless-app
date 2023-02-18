import { handlerPath } from '@libs/handler-resolver';

export default {
	environment: {
		ES_ENDPOINT: { 'Fn::GetAtt': ['ImagesSearch', 'DomainEndpoint'] },
	},
	handler: `${handlerPath(__dirname)}/handler.main`,
	events: [
		{
			stream: {
				type: 'dynamodb',
				arn: {
					'Fn::GetAtt': ['ImagesDynamoDBTable', 'StreamArn'],
				},
			},
		},
	],
};
