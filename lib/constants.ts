export const MONITORING_ACCOUNT_ID = "";
export const SERVICE_ACCOUNT_ID = "";

// AWS DevOps Agent supported Regions: us-east-1, us-west-2, ap-southeast-2,
// ap-northeast-1, eu-central-1, eu-west-1
export const DEPLOY_REGION = "us-east-1";

// Set this to the Agent Space ARN from the DevOpsAgentStack deployment output
// Required before deploying the ServiceStack
export const AGENT_SPACE_ARN = "";

// Set this to the Agent Space ID from the DevOpsAgentStack deployment output
// Required before deploying the IntegrationsStack
export const AGENT_SPACE_ID = "";

// Third-party integration configuration
// Uncomment and fill in the sections for the services you want to integrate.
// Credentials are passed as plain values here for simplicity. In production,
// use AWS Secrets Manager or CDK context variables instead.
import { IntegrationConfig } from './integrations-stack';

export const INTEGRATIONS: IntegrationConfig = {
  // dynatrace: {
  //   accountUrn: "<DYNATRACE_ACCOUNT_URN>",
  //   clientId: "<DYNATRACE_CLIENT_ID>",
  //   clientName: "<DYNATRACE_CLIENT_NAME>",
  //   clientSecret: "<DYNATRACE_CLIENT_SECRET>",
  //   envId: "<DYNATRACE_ENVIRONMENT_ID>",
  //   resources: ["<DYNATRACE_RESOURCE_1>"],
  // },
  // serviceNow: {
  //   instanceUrl: "<SERVICENOW_INSTANCE_URL>",
  //   clientId: "<SERVICENOW_CLIENT_ID>",
  //   clientName: "<SERVICENOW_CLIENT_NAME>",
  //   clientSecret: "<SERVICENOW_CLIENT_SECRET>",
  // },
  // splunk: {
  //   name: "<SPLUNK_NAME>",
  //   endpoint: "https://<XXX>.api.scs.splunk.com/<XXX>/mcp/v1/",
  //   tokenName: "<SPLUNK_TOKEN_NAME>",
  //   tokenValue: "<SPLUNK_TOKEN_VALUE>",
  // },
  // newRelic: {
  //   apiKey: "<NEW_RELIC_API_KEY>",
  //   accountId: "<NEW_RELIC_ACCOUNT_ID>",
  //   region: "US",
  //   endpoint: "https://mcp.newrelic.com/mcp/",
  // },
  // gitLab: {
  //   targetUrl: "https://gitlab.com",
  //   tokenType: "group",
  //   tokenValue: "<GITLAB_ACCESS_TOKEN>",
  //   groupId: "<GITLAB_GROUP_ID>",
  //   projectId: "<GITLAB_PROJECT_ID>",
  //   projectPath: "<NAMESPACE/PROJECT_NAME>",
  // },
};
