import type { AWS } from '@serverless/typescript';

import RS256Auth from '@functions/auth/rs256-auth-0-authorizer';
import Auth from '@functions/auth/auth-0-authorizer';
import GetGroups from '@functions/http/get-groups';
import CreateGroup from '@functions/http/create-group';
import GetImages from '@functions/http/get-images';
import GetImage from '@functions/http/get-image';
import CreateImage from '@functions/http/create-image';
import SendNotifications from '@functions/s3/send-notifications';
import ResizeImage from '@functions/s3/resize-image';
import ConnectHandler from '@functions/websocket/connect';
import DisconnectHandler from '@functions/websocket/disconnect';
import SyncWithElasticsearch from '@functions/dynamoDb/elastic-search-sync';

const serverlessConfiguration: AWS = {
	service: 'serverless-udagram-app',
	frameworkVersion: '3',
	plugins: [
		'serverless-esbuild',
		'serverless-reqvalidator-plugin',
		'serverless-aws-documentation',
		'serverless-plugin-canary-deployments',
		'serverless-iam-roles-per-function',
		'serverless-dynamodb-local',
		'serverless-offline',
	],
	provider: {
		name: 'aws',
		runtime: 'nodejs14.x',
		apiGateway: {
			minimumCompressionSize: 1024,
			shouldStartNameWithService: true,
		},
		stage: "${opt:stage, 'dev'}",
		region: 'us-east-1',
		tracing: {
			lambda: true,
			apiGateway: true,
		},
		environment: {
			AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
			NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
			GROUPS_TABLE: 'Groups-${self:provider.stage}',
			IMAGES_TABLE: 'Images-${self:provider.stage}',
			CONNECTIONS_TABLE: 'Connections-${self:provider.stage}',
			IMAGE_ID_INDEX: 'ImageIdIndex',
			IMAGES_S3_BUCKET: 'serverless-flo-udagram-images-${self:provider.stage}',
			THUMBNAILS_S3_BUCKET: 'serverless-flo-udagram-thumbnail-${self:provider.stage}',
			SIGNED_URL_EXPIRATION: '300',
			AUTH_0_SECRET_ID: 'Auth0Secret-${self:provider.stage}',
			AUTH_0_SECRET_FIELD: 'auth0Secret',
		},
		iam: {
			role: {
				statements: [
					{
						Effect: 'Allow',
						Action: ['codedeploy:*'],
						Resource: '*',
					},
					{
						Effect: 'Allow',
						Action: ['dynamodb:Scan', 'dynamodb:GetItem', 'dynamodb:PutItem'],
						Resource:
							'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}',
					},
					{
						Effect: 'Allow',
						Action: ['dynamodb:Query', 'dynamodb:PutItem'],
						Resource:
							'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}',
					},
					{
						Effect: 'Allow',
						Action: ['dynamodb:Query'],
						Resource:
							'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}',
					},
					{
						Effect: 'Allow',
						Action: ['s3:GetObject', 's3:PutObject'],
						Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*',
					},
					{
						Effect: 'Allow',
						Action: ['s3:PutObject'],
						Resource: 'arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*',
					},
					{
						Effect: 'Allow',
						Action: ['dynamodb:Scan', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
						Resource:
							'arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}',
					},
					{
						Effect: 'Allow',
						Action: ['secretsmanager:GetSecretValue'],
						Resource: { Ref: 'Auth0Secret' },
					},
					{
						Effect: 'Allow',
						Action: ['kms:Decrypt'],
						Resource: { 'Fn::GetAtt': ['KMSKey', 'Arn'] },
					},
				],
			},
		},
	},
	functions: {
		RS256Auth,
		Auth,
		GetGroups,
		CreateGroup,
		GetImages,
		GetImage,
		CreateImage,
		SendNotifications,
		ResizeImage,
		ConnectHandler,
		DisconnectHandler,
		SyncWithElasticsearch,
	},
	package: { individually: true },
	custom: {
		topicName: 'imagesTopic-${self:provider.stage}',
		'serverless-offline': {
			httpPort: 3003,
		},
		dynamodb: {
			start: {
				port: 8000,
				inMemory: true,
				migrate: true,
			},
		},
		documentation: {
			api: {
				info: {
					version: 'v1.0.0',
					title: 'Udagram API',
					descritpion: 'Serverless application for images sharing',
				},
			},
			models: [
				{
					name: 'GroupRequest',
					description: 'Model for creating a Group',
					contentType: 'application/json',
					schema: '${file(models/create-group-request.json)}',
				},
				{
					name: 'ImageRequest',
					description: 'Model for creating an Image',
					contentType: 'application/json',
					schema: '${file(models/create-image-request.json)}',
				},
			],
		},
		esbuild: {
			bundle: true,
			minify: false,
			sourcemap: true,
			exclude: ['aws-sdk'],
			target: 'node14',
			define: { 'require.resolve': undefined },
			platform: 'node',
			concurrency: 10,
		},
	},
	resources: {
		Resources: {
			GatewayResponseDefault4XX: {
				Type: 'AWS::ApiGateway::GatewayResponse',
				Properties: {
					ResponseParameters: {
						'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
						'gatewayresponse.header.Access-Control-Allow-Headers':
							"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
						'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,OPTIONS,POST'",
					},
					ResponseType: 'DEFAULT_4XX',
					RestApiId: { Ref: 'ApiGatewayRestApi' },
				},
			},
			GroupsDynamoDBTable: {
				Type: 'AWS::DynamoDB::Table',
				Properties: {
					TableName: '${self:provider.environment.GROUPS_TABLE}',
					AttributeDefinitions: [
						{
							AttributeName: 'id',
							AttributeType: 'S',
						},
					],
					KeySchema: [
						{
							AttributeName: 'id',
							KeyType: 'HASH',
						},
					],
					BillingMode: 'PAY_PER_REQUEST',
				},
			},
			ImagesDynamoDBTable: {
				Type: 'AWS::DynamoDB::Table',
				Properties: {
					TableName: '${self:provider.environment.IMAGES_TABLE}',
					AttributeDefinitions: [
						{
							AttributeName: 'groupId',
							AttributeType: 'S',
						},
						{
							AttributeName: 'timestamp',
							AttributeType: 'S',
						},
						{
							AttributeName: 'imageId',
							AttributeType: 'S',
						},
					],
					KeySchema: [
						{
							AttributeName: 'groupId',
							KeyType: 'HASH',
						},
						{
							AttributeName: 'timestamp',
							KeyType: 'RANGE',
						},
					],
					BillingMode: 'PAY_PER_REQUEST',
					StreamSpecification: {
						StreamViewType: 'NEW_IMAGE',
					},
					GlobalSecondaryIndexes: [
						{
							IndexName: '${self:provider.environment.IMAGE_ID_INDEX}',
							KeySchema: [
								{
									AttributeName: 'imageId',
									KeyType: 'HASH',
								},
							],
							Projection: {
								ProjectionType: 'ALL',
							},
						},
					],
				},
			},
			WebSocketConnectionsDynamoDBTable: {
				Type: 'AWS::DynamoDB::Table',
				Properties: {
					TableName: '${self:provider.environment.CONNECTIONS_TABLE}',
					AttributeDefinitions: [
						{
							AttributeName: 'id',
							AttributeType: 'S',
						},
					],
					KeySchema: [
						{
							AttributeName: 'id',
							KeyType: 'HASH',
						},
					],
					BillingMode: 'PAY_PER_REQUEST',
				},
			},
			RequestBodyValidator: {
				Type: 'AWS::ApiGateway::RequestValidator',
				Properties: {
					Name: 'request-body-validator',
					RestApiId: {
						Ref: 'ApiGatewayRestApi',
					},
					ValidateRequestBody: true,
					ValidateRequestParameters: true,
				},
			},
			AttachmentsBucket: {
				Type: 'AWS::S3::Bucket',
				DependsOn: ['SNSTopicPolicy'],
				Properties: {
					BucketName: '${self:provider.environment.IMAGES_S3_BUCKET}',
					NotificationConfiguration: {
						TopicConfigurations: [
							{
								Event: 's3:ObjectCreated:Put',
								Topic: { Ref: 'ImagesTopic' },
							},
						],
					},
					CorsConfiguration: {
						CorsRules: [
							{
								AllowedOrigins: ['*'],
								AllowedHeaders: ['*'],
								AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
								MaxAge: 3000,
							},
						],
					},
				},
			},
			BucketPolicy: {
				Type: 'AWS::S3::BucketPolicy',
				Properties: {
					PolicyDocument: {
						Id: 'MyPolicy',
						Version: '2012-10-17',
						Statement: [
							{
								Sid: 'PublicReadForGetBucketObjects',
								Effect: 'Allow',
								Principal: '*',
								Action: 's3:GetObject',
								Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*',
							},
						],
					},
					Bucket: { Ref: 'AttachmentsBucket' },
				},
			},
			SNSTopicPolicy: {
				Type: 'AWS::SNS::TopicPolicy',
				Properties: {
					PolicyDocument: {
						Version: '2012-10-17',
						Statement: [
							{
								Effect: 'Allow',
								Principal: {
									AWS: '*',
								},
								Action: 'sns:Publish',
								Resource: { Ref: 'ImagesTopic' },
								Condition: {
									ArnLike: {
										'AWS:SourceArn': 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}',
									},
								},
							},
						],
					},
					Topics: [{ Ref: 'ImagesTopic' }],
				},
			},
			ThumbnailsBucket: {
				Type: 'AWS::S3::Bucket',
				Properties: {
					BucketName: '${self:provider.environment.THUMBNAILS_S3_BUCKET}',
				},
			},
			ImagesTopic: {
				Type: 'AWS::SNS::Topic',
				Properties: {
					DisplayName: 'Image bucket topic',
					TopicName: '${self:custom.topicName}',
				},
			},
			ImagesSearch: {
				Type: 'AWS::Elasticsearch::Domain',
				Properties: {
					ElasticsearchVersion: '6.3',
					DomainName: 'images-search-${self:provider.stage}',
					ElasticsearchClusterConfig: {
						DedicatedMasterEnabled: false,
						InstanceCount: '1',
						ZoneAwarenessEnabled: false,
						InstanceType: 't2.small.elasticsearch',
					},
					EBSOptions: {
						EBSEnabled: true,
						Iops: 0,
						VolumeSize: 10,
						VolumeType: 'gp2',
					},
					AccessPolicies: {
						Version: '2012-10-17',
						Statement: [
							{
								Effect: 'Allow',
								Principal: {
									AWS: '*',
								},
								Action: 'es:*',
								Resource: '*',
							},
						],
					},
				},
			},
			KMSKey: {
				Type: 'AWS::KMS::Key',
				Properties: {
					Description: 'KMS key to encrypt Auth0 secret',
					KeyPolicy: {
						Version: '2012-10-17',
						Id: 'key-default-1',
						Statement: [
							{
								Sid: ' Allow administration of the key',
								Effect: 'Allow',
								Principal: {
									AWS: {
										'Fn::Join': [
											'*',
											[
												'arn:aws:iam:',
												{
													Ref: 'AWS::AccountId',
												},
												'root',
											],
										],
									},
								},
								Action: ['kms:*'],
								Resource: '*',
							},
						],
					},
				},
			},
			KMSKeyAlias: {
				Type: 'AWS::KMS::Alias',
				Properties: {
					AliasName: 'alias/auth0Key-${self:provider.stage}',
					TargetKeyId: { Ref: 'KMSKey' },
				},
			},
			Auth0Secret: {
				Type: 'AWS::SecretsManager::Secret',
				Properties: {
					Name: '${self:provider.environment.AUTH_0_SECRET_ID}',
					Description: 'Auth0 secret',
					KmsKeyId: { Ref: 'KMSKey' },
				},
			},
		},
	},
};

module.exports = serverlessConfiguration;
