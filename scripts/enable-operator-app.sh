#!/bin/bash

# Post-deployment script to enable the operator app
# This must be run after the CDK stack is deployed

set -e

echo "Setting up AWS DevOps Agent CLI..."

# Download and configure DevOps Agent CLI if not already done
if ! aws devopsagent help >/dev/null 2>&1; then
    echo "DevOps Agent CLI not configured. Setting up..."
    curl -o devopsagent.json https://d1co8nkiwcta1g.cloudfront.net/devopsagent.json
    aws configure add-model --service-model "file://${PWD}/devopsagent.json" --service-name devopsagent
    echo "DevOps Agent CLI configured successfully!"
fi

# Get the stack outputs
AGENT_SPACE_ID=$(aws cloudformation describe-stacks \
  --stack-name DevOpsAgentStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AgentSpaceId`].OutputValue' \
  --output text \
  --region us-east-1)

OPERATOR_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name DevOpsAgentStack \
  --query 'Stacks[0].Outputs[?OutputKey==`OperatorRoleArn`].OutputValue' \
  --output text \
  --region us-east-1)

ASSOCIATION_ID=$(aws cloudformation describe-stacks \
  --stack-name DevOpsAgentStack \
  --query 'Stacks[0].Outputs[?OutputKey==`AssociationId`].OutputValue' \
  --output text \
  --region us-east-1)

echo "Agent Space ID: $AGENT_SPACE_ID"
echo "Operator Role ARN: $OPERATOR_ROLE_ARN"
echo "Association ID: $ASSOCIATION_ID"

# Enable the operator app
echo "Enabling operator app..."
aws devopsagent enable-operator-app \
  --agent-space-id "$AGENT_SPACE_ID" \
  --auth-flow iam \
  --operator-app-role-arn "$OPERATOR_ROLE_ARN" \
  --endpoint-url "https://api.prod.cp.aidevops.us-east-1.api.aws" \
  --region us-east-1

echo "Operator app enabled successfully!"

# Verify setup
echo "Verifying setup..."
aws devopsagent get-agent-space \
  --agent-space-id "$AGENT_SPACE_ID" \
  --endpoint-url "https://api.prod.cp.aidevops.us-east-1.api.aws" \
  --region us-east-1

echo ""
echo "Setup complete! Your DevOps Agent is ready."
echo "Agent Space ID: $AGENT_SPACE_ID"
echo "Association ID: $ASSOCIATION_ID"
echo ""
echo "You can now use the following commands to interact with your agent space:"
echo "aws devopsagent list-associations --agent-space-id $AGENT_SPACE_ID --endpoint-url https://api.prod.cp.aidevops.us-east-1.api.aws --region us-east-1"
