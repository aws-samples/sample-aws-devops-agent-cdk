# AWS DevOps Agent CDK Application

This CDK application creates a complete AWS DevOps Agent setup using CloudFormation resources, including the agent space, IAM roles, and AWS account association.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js (version 18 or later)
- AWS CDK CLI installed globally: `npm install -g aws-cdk`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Bootstrap your AWS environment (if not done before):

   ```bash
   cdk bootstrap
   ```

## Configuration

The stack creates the following resources using CloudFormation:

- **DevOps Agent Space Role**: `DevOpsAgentRole-AgentSpace` with proper trust policy and permissions
- **Operator App Role**: `DevOpsAgentRole-WebappAdmin` for the operator application
- **Agent Space**: Named `MyAgentSpace` created via `AWS::DevOpsAgent::AgentSpace` (includes operator app configuration)
- **AWS Account Association**: Links the agent space to your AWS account via `AWS::DevOpsAgent::Association`

## Deployment

### Step 1: Deploy the Agent Space (Primary Account)

1. Build the TypeScript code:

   ```bash
   npm run build
   ```

2. Preview the changes:

   ```bash
   cdk diff
   ```

3. Deploy the stack:

   ```bash
   export AWS_REGION=us-east-1 && cdk deploy DevOpsAgentStack
   ```

   The operator app is now configured directly through the CDK `AgentSpace` construct — no post-deployment script is needed.

### Step 2 (Optional): Deploy the Service Stack to a Secondary Account

After deploying the Agent Space, you can optionally deploy the `ServiceStack` into a secondary (service) account. This creates a cross-account IAM role (`DevOpsAgentRole-SecondaryAccount`) so the Agent Space can monitor resources in that account, along with a simple echo Lambda function as an example service.

The Agent Space ARN is required as input. It is exported as a CloudFormation output (`DevOpsAgentSpaceArn`) from the `DevOpsAgentStack` deployment.

1. Update `lib/constants.ts` with your service account ID:

   ```typescript
   export const SERVICE_ACCOUNT_ID = "<YOUR_SERVICE_ACCOUNT_ID>";
   ```

2. Bootstrap the secondary account for CDK (if not done before):

   ```bash
   cdk bootstrap aws://<SERVICE_ACCOUNT_ID>/us-east-1 \
     --trust <PRIMARY_ACCOUNT_ID> \
     --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
   ```

3. Deploy the service stack (set `SERVICE_ACCOUNT_ID` to enable it):

   ```bash
   export SERVICE_ACCOUNT_ID=<YOUR_SERVICE_ACCOUNT_ID>
   cdk deploy ServiceStack
   ```

   This will import the Agent Space ARN from the primary account's CloudFormation exports and create the secondary account role with a fixed name: `DevOpsAgentRole-SecondaryAccount`.

## What Gets Created

### DevOpsAgentStack (Primary Account)

#### IAM Roles

- **DevOpsAgentRole-AgentSpace**: Main role for the agent space with:
  - Trust policy for `aidevops.amazonaws.com` service
  - `AIOpsAssistantPolicy` managed policy
  - Additional inline policies for support and expanded permissions

- **DevOpsAgentRole-WebappAdmin**: Operator app role with:
  - Trust policy for `aidevops.amazonaws.com` service
  - Inline policies for basic operator actions and support

#### DevOps Agent Resources

- **Agent Space**: Created using `AWS::DevOpsAgent::AgentSpace` CloudFormation resource
- **AWS Association**: Created using `AWS::DevOpsAgent::Association` CloudFormation resource

### ServiceStack (Secondary Account — Optional)

- **DevOpsAgentRole-SecondaryAccount**: Cross-account role with a fixed name, trusted by the Agent Space in the primary account. Includes `AIOpsAssistantPolicy` and expanded permissions for monitoring.
- **Echo Lambda Function** (`echo-service`): A simple example service that echoes back any input event.

## Outputs

### DevOpsAgentStack

- `AgentSpaceArn`: The ARN of the created agent space
- `AgentSpaceRoleArn`: The ARN of the agent space role
- `OperatorRoleArn`: The ARN of the operator role
- `PrimaryAccountId`: The primary account ID
- `AssociationId`: The ID of the AWS association

### ServiceStack

- `SecondaryAccountRoleArn`: The ARN of the secondary account role

## Post-Deployment Steps

1. Verify your setup:

   ```bash
   # Get details of your AgentSpace
   aws devopsagent get-agent-space \
     --agent-space-id <AGENT_SPACE_ID> \
     --endpoint-url "https://api.prod.cp.aidevops.us-east-1.api.aws" \
     --region us-east-1

   # List associations
   aws devopsagent list-associations \
     --agent-space-id <AGENT_SPACE_ID> \
     --endpoint-url "https://api.prod.cp.aidevops.us-east-1.api.aws" \
     --region us-east-1
   ```

2. (Optional) Test the echo service in the secondary account:

   ```bash
   aws lambda invoke \
     --function-name echo-service \
     --payload '{"test": "hello"}' \
     response.json && cat response.json
   ```

## Optional Associations

You can extend this setup by adding associations for:

- Additional AWS accounts (cross-account monitoring)
- GitHub repositories
- ServiceNow instances
- Dynatrace environments
- Splunk instances
- New Relic accounts
- Datadog instances

Refer to the [CLI onboarding guide](https://docs.aws.amazon.com/devopsagent/latest/userguide/getting-started-with-aws-devops-agent-cli-onboarding-guide.html) for detailed instructions on adding these associations.

## Cleanup

To remove all resources:

```bash
cdk destroy --all
```

## Notes

- All resources are created in the `us-east-1` region (DevOps Agent requirement)
- The stack uses CloudFormation resource types `AWS::DevOpsAgent::AgentSpace` and `AWS::DevOpsAgent::Association`
- The operator app is configured directly through the CDK `AgentSpace` construct — the `enable-operator-app.sh` script is no longer required
- The `ServiceStack` is optional and only synthesized when `SERVICE_ACCOUNT_ID` is set
- The secondary account role uses a fixed name (`DevOpsAgentRole-SecondaryAccount`) so it can be referenced predictably from the primary account
- Replace placeholder values in the CLI commands with your actual agent space ID from the stack outputs

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
