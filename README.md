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
- **Agent Space**: Named `MyAgentSpace` created via `AWS::DevOpsAgent::AgentSpace`
- **AWS Account Association**: Links the agent space to your AWS account via `AWS::DevOpsAgent::Association`

## Deployment

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
   export AWS_REGION=us-east-1 &&  cdk deploy
   ```

4. Enable the operator app (post-deployment):
   ```bash
   ./scripts/enable-operator-app.sh
   ```

## What Gets Created

### IAM Roles
- **DevOpsAgentRole-AgentSpace**: Main role for the agent space with:
  - Trust policy for `aidevops.amazonaws.com` service
  - `AIOpsAssistantPolicy` managed policy
  - Additional inline policies for support and expanded permissions

- **DevOpsAgentRole-WebappAdmin**: Operator app role with:
  - Trust policy for `aidevops.amazonaws.com` service  
  - Inline policies for basic operator actions and support

### DevOps Agent Resources
- **Agent Space**: Created using `AWS::DevOpsAgent::AgentSpace` CloudFormation resource
- **AWS Association**: Created using `AWS::DevOpsAgent::Association` CloudFormation resource

## Outputs

After deployment, you'll see:
- `AgentSpaceId`: The ID of the created agent space
- `AgentSpaceRoleArn`: The ARN of the agent space role
- `OperatorRoleArn`: The ARN of the operator role
- `AssociationId`: The ID of the AWS association

## Post-Deployment Steps

1. Run the operator app enablement script:
   ```bash
   ./scripts/enable-operator-app.sh
   ```

2. Verify your setup:
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
cdk destroy
```

## Notes

- All resources are created in the `us-east-1` region (DevOps Agent requirement)
- The stack uses CloudFormation resource types `AWS::DevOpsAgent::AgentSpace` and `AWS::DevOpsAgent::Association`
- The operator app must be enabled after stack deployment using the provided script
- Replace placeholder values in the CLI commands with your actual agent space ID from the stack outputs

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

