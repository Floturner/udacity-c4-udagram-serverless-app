import { handlerPath } from '@libs/handler-resolver';

export default {
	handler: `${handlerPath(__dirname)}/handler.main`,
	events: [
		{
			http: {
				method: 'post',
				path: 'groups/{groupId}/images',
				cors: true,
				authorizer: 'RS256Auth',
				reqValidatorName: 'RequestBodyValidator',
				documentation: {
					summary: 'Create a new image',
					description: 'Create a new image',
					requestModels: {
						'application/json': 'ImageRequest',
					},
				},
			},
		},
	],
};
