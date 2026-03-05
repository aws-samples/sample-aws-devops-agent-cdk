# Tutorial: Deploy AWS DevOps Agent with CDK

This tutorial walks you through deploying an AWS DevOps Agent Space that monitors your AWS account. Optionally, you can extend it to monitor a second (service) account via cross-account access.

## What you'll build

1. An Agent Space with an operator app and an AWS association, so the agent can monitor issues in your monitoring account.
2. (Optional) A source AWS association to a service account, plus a ServiceStack deployed into that account with an IAM role that trusts the Agent Space.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js (version 18 or later)
- AWS CDK CLI: `npm install -g aws-cdk`
- One or two AWS accounts (depending on whether you do the optional step)

Install project dependencies:

```bash
npm install
```

---

## Part 1: Deploy the Agent Space (Monitoring Account)

This creates the Agent Space, IAM roles, operator app, and an AWS association in your monitoring account.

### 1.1 Configure your monitoring account ID

Edit `lib/constants.ts` and set your monitoring account ID:

```typescript
export const MONITORING_ACCOUNT_ID = "<YOUR_MONITORING_ACCOUNT_ID>";
```

### 1.2 Bootstrap CDK (if not done before)

```bash
cdk bootstrap aws://<MONITORING_ACCOUNT_ID>/us-east-1 --profile monitoring
```

### 1.3 Build and deploy

```bash
npm run build
cdk deploy DevOpsAgentStack --profile monitoring
```

### 1.4 Note the outputs

After deployment, CDK prints the stack outputs. You'll see something like:

```
Outputs:
DevOpsAgentStack.AgentSpaceArn = arn:aws:aidevops:us-east-1:650138640062:agentspace/abc123
DevOpsAgentStack.AgentSpaceRoleArn = arn:aws:iam::650138640062:role/DevOpsAgentRole-AgentSpace
DevOpsAgentStack.OperatorRoleArn = arn:aws:iam::650138640062:role/DevOpsAgentRole-WebappAdmin
DevOpsAgentStack.AssociationId = assoc-xyz
```

Save the `AgentSpaceArn` — you'll need it if you proceed to Part 2.

---

## Part 2 (Optional): Add a Service Account for Cross-Account Monitoring

This extends the setup so the Agent Space can also monitor resources in a second AWS account. You'll:

- Add a source AWS association in the DevOpsAgentStack pointing to the service account
- Deploy the ServiceStack into the service account with an IAM role that trusts the Agent Space

### 2.1 Configure the service account ID

Edit `lib/constants.ts` and set your service account ID:

```typescript
export const SERVICE_ACCOUNT_ID = "<YOUR_SERVICE_ACCOUNT_ID>";
```

The DevOpsAgentStack already creates a source AWS association using this account ID. If you haven't deployed with it set yet, redeploy:

```bash
npm run build
cdk deploy DevOpsAgentStack --profile monitoring
```

### 2.2 Set the Agent Space ARN

Copy the `AgentSpaceArn` from the DevOpsAgentStack output (Step 1.4) and paste it into `lib/constants.ts`:

```typescript
export const AGENT_SPACE_ARN = "arn:aws:aidevops:us-east-1:<MONITORING_ACCOUNT_ID>:agentspace/<SPACE_ID>";
```

This is required — the ServiceStack uses it to scope the trust policy on the secondary account role. The ServiceStack will only be synthesized when this value is set.

### 2.3 Bootstrap the service account

```bash
cdk bootstrap aws://<SERVICE_ACCOUNT_ID>/us-east-1 --profile service
```

### 2.4 Deploy the ServiceStack

```bash
npm run build
cdk deploy ServiceStack --profile service
```

This creates:

- An IAM role (`DevOpsAgentRole-SecondaryAccount`) in the service account that trusts the Agent Space
- An echo Lambda function (`echo-service`) as a simple example service

### 2.5 Test the echo service

```bash
aws lambda invoke \
  --function-name echo-service \
  --payload '{"test": "hello world"}' \
  --profile service \
  response.json

cat response.json
```

---

## What gets created

### DevOpsAgentStack (Monitoring Account)

| Resource | Name | Purpose |
| --- | --- | --- |
| Agent Space | `MyCDKAgentSpace` | Central agent space with operator app |
| IAM Role | `DevOpsAgentRole-AgentSpace` | Assumed by the agent to monitor the account |
| IAM Role | `DevOpsAgentRole-WebappAdmin` | Operator app role |
| Association | AWS (monitor) | Links the monitoring account |
| Association | AWS (source) | Links the service account (optional) |

### ServiceStack (Service Account — Optional)

| Resource | Name | Purpose |
| --- | --- | --- |
| IAM Role | `DevOpsAgentRole-SecondaryAccount` | Cross-account role trusted by the Agent Space |
| Lambda | `echo-service` | Example service |

---

## Cleanup

Destroy in reverse order:

```bash
# If you deployed the ServiceStack
cdk destroy ServiceStack --profile service

# Then the DevOpsAgentStack
cdk destroy DevOpsAgentStack --profile monitoring
```
