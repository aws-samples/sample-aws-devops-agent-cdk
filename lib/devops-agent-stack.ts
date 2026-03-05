import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as devopsagent from 'aws-cdk-lib/aws-devopsagent';

export interface DevOpsAgentStackProps extends cdk.StackProps {
  /**
   * Account ID of the secondary (service) account for cross-account monitoring
   */
  secondaryAccountId: string;
}

export class DevOpsAgentStack extends cdk.Stack {
  public readonly agentSpaceArn: string;

  constructor(scope: Construct, id: string, props: DevOpsAgentStackProps) {
    super(scope, id, props);

    // 1. Create DevOps Agent Space Role (matches CLI step 1)
    const agentSpaceRole = new iam.Role(this, 'DevOpsAgentSpaceRole', {
      roleName: 'DevOpsAgentRole-AgentSpace',
      assumedBy: new iam.ServicePrincipal('aidevops.amazonaws.com', {
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account
          },
          ArnLike: {
            'aws:SourceArn': `arn:aws:aidevops:${this.region}:${this.account}:agentspace/*`
          }
        }
      }),
      description: 'Role for AWS DevOps Agent Space',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AIOpsAssistantPolicy')
      ],
      inlinePolicies: {
        AllowExpandedAIOpsAssistantPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'AllowAwsSupportActions',
              effect: iam.Effect.ALLOW,
              actions: [
                'support:CreateCase',
                'support:DescribeCases'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              sid: 'AllowExpandedAIOpsAssistantPolicy',
              effect: iam.Effect.ALLOW,
              actions: [
                'aidevops:GetKnowledgeItem',
                'aidevops:ListKnowledgeItems',
                'eks:AccessKubernetesApi',
                'synthetics:GetCanaryRuns',
                'route53:GetHealthCheckStatus',
                'resource-explorer-2:Search'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // 2. Create Operator App Role (matches CLI step 2)
    const operatorRole = new iam.Role(this, 'DevOpsOperatorRole', {
      roleName: 'DevOpsAgentRole-WebappAdmin',
      assumedBy: new iam.ServicePrincipal('aidevops.amazonaws.com', {
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account
          },
          ArnLike: {
            'aws:SourceArn': `arn:aws:aidevops:${this.region}:${this.account}:agentspace/*`
          }
        }
      }),
      description: 'Role for AWS DevOps Agent Operator App',
      inlinePolicies: {
        AIDevOpsBasicOperatorActionsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'AllowBasicOperatorActions',
              effect: iam.Effect.ALLOW,
              actions: [
                'aidevops:GetAgentSpace',
                'aidevops:GetAssociation',
                'aidevops:ListAssociations',
                'aidevops:CreateBacklogTask',
                'aidevops:GetBacklogTask',
                'aidevops:UpdateBacklogTask',
                'aidevops:ListBacklogTasks',
                'aidevops:ListChildExecutions',
                'aidevops:ListJournalRecords',
                'aidevops:DiscoverTopology',
                'aidevops:InvokeAgent',
                'aidevops:ListGoals',
                'aidevops:ListRecommendations',
                'aidevops:ListExecutions',
                'aidevops:GetRecommendation',
                'aidevops:UpdateRecommendation',
                'aidevops:CreateKnowledgeItem',
                'aidevops:ListKnowledgeItems',
                'aidevops:GetKnowledgeItem',
                'aidevops:UpdateKnowledgeItem',
                'aidevops:ListPendingMessages',
                'aidevops:InitiateChatForCase',
                'aidevops:EndChatForCase',
                'aidevops:DescribeSupportLevel',
                'aidevops:SendChatMessage'
              ],
              resources: [`arn:aws:aidevops:${this.region}:${this.account}:agentspace/*`]
            }),
            new iam.PolicyStatement({
              sid: 'AllowSupportOperatorActions',
              effect: iam.Effect.ALLOW,
              actions: [
                'support:DescribeCases',
                'support:InitiateChatForCase',
                'support:DescribeSupportLevel'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // 3. Create Agent Space using proper L1 construct
    const agentSpace = new devopsagent.CfnAgentSpace(this, 'MyAgentSpace', {
      name: 'MyCDKAgentSpace',
      description: 'AgentSpace for monitoring my application using CDK',
      operatorApp: {
        iam: {
          operatorAppRoleArn: operatorRole.roleArn,
        },
      }
    });

    // 4. Associate AWS Account using proper L1 construct
    const awsAssociation = new devopsagent.CfnAssociation(this, 'AWSAssociation', {
      agentSpaceId: agentSpace.ref,
      serviceId: 'aws',
      configuration: {
        aws: {
          assumableRoleArn: agentSpaceRole.roleArn,
          accountId: this.account,
          accountType: 'monitor',
          resources: []
        }
      }
    });
    awsAssociation.addDependency(agentSpace);

    // 5. Associate cross-account monitoring
     const secondaryAwsAssociation = new devopsagent.CfnAssociation(this, 'SecondaryAWSAssociation', {
      agentSpaceId: agentSpace.ref,
      serviceId: 'aws',
      configuration: {
        sourceAws: {
          assumableRoleArn: `arn:aws:iam::${props.secondaryAccountId}:role/DevOpsAgentRole-SecondaryAccount`,
          accountId: props.secondaryAccountId,
          accountType: 'source',
        }
      }
    });
   secondaryAwsAssociation.addDependency(agentSpace);

    // Store the agent space ARN for cross-stack reference
    this.agentSpaceArn = agentSpace.attrArn;

    // Outputs
    new cdk.CfnOutput(this, 'AgentSpaceArn', {
      value: agentSpace.attrArn,
      description: 'ARN of the created DevOps Agent Space',
      exportName: 'DevOpsAgentSpaceArn'
    });

    new cdk.CfnOutput(this, 'AgentSpaceRoleArn', {
      value: agentSpaceRole.roleArn,
      description: 'ARN of the DevOps Agent Space Role',
      exportName: 'DevOpsAgentSpaceRoleArn'
    });

    new cdk.CfnOutput(this, 'OperatorRoleArn', {
      value: operatorRole.roleArn,
      description: 'ARN of the DevOps Agent Operator Role'
    });

    new cdk.CfnOutput(this, 'PrimaryAccountId', {
      value: this.account,
      description: 'Primary Account ID',
      exportName: 'DevOpsAgentPrimaryAccountId'
    });

    new cdk.CfnOutput(this, 'AssociationId', {
      value: awsAssociation.attrAssociationId,
      description: 'ID of the AWS Association'
    });
  }
}