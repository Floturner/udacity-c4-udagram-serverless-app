import express from 'express';
import * as awsServerlessExpress from 'aws-serverless-express';
import 'source-map-support/register';

import { getAllGroups } from '../../../businessLogic/groups';

const app = express();

app.get('/groups', async (_req, res) => {
	const groups = await getAllGroups();

	res.json({
		items: groups,
	});
});

const server = awsServerlessExpress.createServer(app);
exports.main = (event: any, context: any) => {
	awsServerlessExpress.proxy(server, event, context);
};
