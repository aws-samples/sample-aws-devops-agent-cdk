#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DevOpsAgentStack } from "../lib/devops-agent-stack";
import { ServiceStack } from "../lib/service-stack";
import { SERVICE_ACCOUNT_ID } from "../lib/constants";

const app = new cdk.App();

// Primary account stack with Agent Space
const devOpsStack = new DevOpsAgentStack(app, "DevOpsAgentStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

if (process.env.SERVICE_ACCOUNT_ID) {
  // Secondary account stack with Echo service and cross-account role
  // Deploy this in the service account using the ID from constants.ts
  // Uses explicit CloudFormation exports from DevOpsAgentStack
  const serviceStack = new ServiceStack(app, "ServiceStack", {
    agentSpaceArn: cdk.Fn.importValue("DevOpsAgentSpaceArn"),
    primaryAccountId: cdk.Fn.importValue("DevOpsAgentPrimaryAccountId"),
    env: {
      account: SERVICE_ACCOUNT_ID,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });

  // ServiceStack depends on DevOpsAgentStack
  serviceStack.addDependency(devOpsStack);
}
