import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as devopsagent from 'aws-cdk-lib/aws-devopsagent';

export interface IntegrationConfig {
  /** Dynatrace OAuth credentials and account URN */
  dynatrace?: {
    accountUrn: string;
    clientId: string;
    clientName: string;
    clientSecret: string;
    envId: string;
    resources?: string[];
  };
  /** ServiceNow OAuth credentials and instance URL */
  serviceNow?: {
    instanceUrl: string;
    clientId: string;
    clientName: string;
    clientSecret: string;
  };
  /** Splunk bearer token credentials and endpoint */
  splunk?: {
    name: string;
    endpoint: string;
    tokenName: string;
    tokenValue: string;
  };
  /** New Relic API key credentials */
  newRelic?: {
    apiKey: string;
    accountId: string;
    region: string;
    endpoint: string;
    applicationIds?: string[];
    entityGuids?: string[];
    alertPolicyIds?: string[];
  };
  /** GitLab access token and instance details */
  gitLab?: {
    targetUrl: string;
    tokenType: string;
    tokenValue: string;
    groupId?: string;
    projectId: string;
    projectPath: string;
  };
}

export interface IntegrationsStackProps extends cdk.StackProps {
  agentSpaceId: string;
  integrations: IntegrationConfig;
}

export class IntegrationsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IntegrationsStackProps) {
    super(scope, id, props);

    const { agentSpaceId, integrations } = props;

    if (integrations.dynatrace) {
      const cfg = integrations.dynatrace;
      const svc = new devopsagent.CfnService(this, 'DynatraceService', {
        serviceType: 'dynatrace',
        serviceDetails: {
          dynatrace: {
            accountUrn: cfg.accountUrn,
            authorizationConfig: {
              oAuthClientCredentials: {
                clientId: cfg.clientId,
                clientName: cfg.clientName,
                clientSecret: cfg.clientSecret,
              },
            },
          },
        },
      });

      new devopsagent.CfnAssociation(this, 'DynatraceAssociation', {
        agentSpaceId,
        serviceId: svc.attrServiceId,
        configuration: {
          dynatrace: {
            envId: cfg.envId,
            resources: cfg.resources,
          },
        },
      });
    }

    if (integrations.serviceNow) {
      const cfg = integrations.serviceNow;
      const svc = new devopsagent.CfnService(this, 'ServiceNowService', {
        serviceType: 'servicenow',
        serviceDetails: {
          serviceNow: {
            instanceUrl: cfg.instanceUrl,
            authorizationConfig: {
              oAuthClientCredentials: {
                clientId: cfg.clientId,
                clientName: cfg.clientName,
                clientSecret: cfg.clientSecret,
              },
            },
          },
        },
      });

      new devopsagent.CfnAssociation(this, 'ServiceNowAssociation', {
        agentSpaceId,
        serviceId: svc.attrServiceId,
        configuration: {
          serviceNow: {
            instanceId: cfg.instanceUrl,
          },
        },
      });
    }

    if (integrations.splunk) {
      const cfg = integrations.splunk;
      const svc = new devopsagent.CfnService(this, 'SplunkService', {
        serviceType: 'mcpserversplunk',
        serviceDetails: {
          mcpServerSplunk: {
            name: cfg.name,
            endpoint: cfg.endpoint,
            authorizationConfig: {
              bearerToken: {
                tokenName: cfg.tokenName,
                tokenValue: cfg.tokenValue,
              },
            },
          },
        },
      });

      new devopsagent.CfnAssociation(this, 'SplunkAssociation', {
        agentSpaceId,
        serviceId: svc.attrServiceId,
        configuration: {
          mcpServerSplunk: {
            name: cfg.name,
            endpoint: cfg.endpoint,
          },
        },
      });
    }

    if (integrations.newRelic) {
      const cfg = integrations.newRelic;
      const svc = new devopsagent.CfnService(this, 'NewRelicService', {
        serviceType: 'mcpservernewrelic',
        serviceDetails: {
          mcpServerNewRelic: {
            authorizationConfig: {
              apiKey: {
                apiKey: cfg.apiKey,
                accountId: cfg.accountId,
                region: cfg.region,
                applicationIds: cfg.applicationIds,
                entityGuids: cfg.entityGuids,
                alertPolicyIds: cfg.alertPolicyIds,
              },
            },
          },
        },
      });

      new devopsagent.CfnAssociation(this, 'NewRelicAssociation', {
        agentSpaceId,
        serviceId: svc.attrServiceId,
        configuration: {
          mcpServerNewRelic: {
            accountId: cfg.accountId,
            endpoint: cfg.endpoint,
          },
        },
      });
    }

    if (integrations.gitLab) {
      const cfg = integrations.gitLab;
      const svc = new devopsagent.CfnService(this, 'GitLabService', {
        serviceType: 'gitlab',
        serviceDetails: {
          gitLab: {
            targetUrl: cfg.targetUrl,
            tokenType: cfg.tokenType,
            tokenValue: cfg.tokenValue,
            groupId: cfg.groupId,
          },
        },
      });

      new devopsagent.CfnAssociation(this, 'GitLabAssociation', {
        agentSpaceId,
        serviceId: svc.attrServiceId,
        configuration: {
          gitLab: {
            projectId: cfg.projectId,
            projectPath: cfg.projectPath,
          },
        },
      });
    }
  }
}
