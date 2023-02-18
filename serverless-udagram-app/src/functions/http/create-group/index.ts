import { handlerPath } from '@libs/handler-resolver';

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
	events: [
		{
			http: {
				method: 'post',
				path: 'groups',
				cors: true,
				authorizer: 'RS256Auth',
				reqValidatorName: 'RequestBodyValidator',
				documentation: {
					summary: 'Create a new group',
					description: 'Create a new group',
					requestModels: {
						'application/json': 'GroupRequest',
					},
				},
			},
		},
	],
	deploymentSettings: {
		type: 'Linear10PercentEvery1Minute',
		alias: 'Live',
	},
};
