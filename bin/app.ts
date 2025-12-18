#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevOpsAgentStack } from '../lib/devops-agent-stack';

const app = new cdk.App();

new DevOpsAgentStack(app, 'DevOpsAgentStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});