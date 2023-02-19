import { handlerPath } from '@libs/handler-resolver';

export default {
	environment: {
		STAGE: '${self:provider.stage}',
		API_ID: { Ref: 'WebsocketsApi' },
	},
	handler: `${handlerPath(__dirname)}/handler.main`,
	events: [
		{
			sns: {
				arn: {
					'Fn::Join': [
						':',
						['arn:aws:sns', { Ref: 'AWS::Region' }, { Ref: 'AWS::AccountId' }, '${self:custom.topicName}'],
					],
				},
				topicName: '${self:custom.topicName}',
			},
		},
	],
};
