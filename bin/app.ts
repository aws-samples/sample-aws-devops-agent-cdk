#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DevOpsAgentStack } from "../lib/devops-agent-stack";
import { ServiceStack } from "../lib/service-stack";
import { IntegrationsStack } from "../lib/integrations-stack";
import {
  MONITORING_ACCOUNT_ID,
  SERVICE_ACCOUNT_ID,
  AGENT_SPACE_ARN,
  AGENT_SPACE_ID,
  DEPLOY_REGION,
  INTEGRATIONS,
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

// Third-party integrations stack — registers and associates external services
// Only deployable after AGENT_SPACE_ID is set from DevOpsAgentStack output
const hasIntegrations = Object.values(INTEGRATIONS).some(Boolean);
if (AGENT_SPACE_ID && hasIntegrations) {
  new IntegrationsStack(app, "IntegrationsStack", {
    agentSpaceId: AGENT_SPACE_ID,
    integrations: INTEGRATIONS,
    env: {
      account: MONITORING_ACCOUNT_ID,
      region: DEPLOY_REGION,
    },
  });
}
