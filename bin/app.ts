#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DevOpsAgentStack } from "../lib/devops-agent-stack";
import { ServiceStack } from "../lib/service-stack";
import {
  MONITORING_ACCOUNT_ID,
  SERVICE_ACCOUNT_ID,
  AGENT_SPACE_ARN,
  DEPLOY_REGION,
} from "../lib/constants";

const app = new cdk.App();

// Primary account stack — Agent Space, IAM roles, and associations
new DevOpsAgentStack(app, "DevOpsAgentStack", {
  secondaryAccountId: SERVICE_ACCOUNT_ID,
  env: {
    account: MONITORING_ACCOUNT_ID,
    region: DEPLOY_REGION,
  },
});

// Secondary account stack — echo service and cross-account role
// Only deployable after AGENT_SPACE_ARN is set from DevOpsAgentStack output
if (AGENT_SPACE_ARN) {
  new ServiceStack(app, "ServiceStack", {
    agentSpaceArn: AGENT_SPACE_ARN,
    primaryAccountId: MONITORING_ACCOUNT_ID,
    env: {
      account: SERVICE_ACCOUNT_ID,
      region: DEPLOY_REGION,
    },
  });
}
