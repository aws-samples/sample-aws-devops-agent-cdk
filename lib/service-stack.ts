import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";

export interface ServiceStackProps extends cdk.StackProps {
  /**
   * ARN of the Agent Space from the primary account
   * This should be imported from the cross-account deployment
   */
  agentSpaceArn: string;

  /**
   * Account ID of the primary account where the Agent Space is deployed
   */
  primaryAccountId: string;
}

export class ServiceStack extends cdk.Stack {
  public readonly echoFunction: lambda.Function;
  public readonly secondaryAccountRole: iam.Role;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    // Create the secondary account role with a fixed name
    // This role will be assumed by the Agent Space from the primary account
    this.secondaryAccountRole = new iam.Role(this, "SecondaryAccountRole", {
      roleName: "DevOpsAgentRole-SecondaryAccount",
      assumedBy: new iam.ServicePrincipal("aidevops.amazonaws.com", {
        conditions: {
          StringEquals: {
            "aws:SourceAccount": props.primaryAccountId,
            "aws:SourceArn": props.agentSpaceArn,
          },
        },
      }),
      description:
        "Secondary account role for DevOps Agent Space cross-account access",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AIDevOpsAgentAccessPolicy"),
      ],
      inlinePolicies: {
        AllowCreateServiceLinkedRoles: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: "AllowCreateServiceLinkedRoles",
              effect: iam.Effect.ALLOW,
              actions: ["iam:CreateServiceLinkedRole"],
              resources: [
                `arn:aws:iam::${this.account}:role/aws-service-role/resource-explorer-2.amazonaws.com/AWSServiceRoleForResourceExplorer`,
              ],
            }),
          ],
        }),
      },
    });

    // Create a simple Echo Lambda function
    this.echoFunction = new lambda.Function(this, "EchoFunction", {
      functionName: "echo-service",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Echo service response',
      echo: event,
      timestamp: new Date().toISOString()
    })
  };
};
      `),
      description: "Simple echo service that returns the input event",
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    // Outputs
    new cdk.CfnOutput(this, "SecondaryAccountRoleArn", {
      value: this.secondaryAccountRole.roleArn,
      description: "ARN of the Secondary Account Role for Agent Space",
      exportName: "DevOpsAgentSecondaryAccountRoleArn",
    });
  }
}
