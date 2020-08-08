#!/bin/bash

REGION="us-east-1"

# Create S3 bucket for terraform state
aws s3 mb s3://cash-pass-terraform-state --region $REGION

# Build and deploy CodeCommit push lambda trigger
PUSH_TRIGGER_FUNCTION_NAME="cash-pass-codecommit-push-trigger"
PUSH_TRIGGER_ROLE_NAME="cash-pass-codecommit-lambda-trigger-role"
PUSH_TRIGGER_POLICY_NAME="cash-pass-codecommit-lambda-trigger-policy"
REPOSITORY_DATA=$(aws codecommit get-repository --repository-name "cash-pass" --region=$REGION)
REPOSITORY_ARN=$(node -pe "JSON.parse(process.argv[1]).repositoryMetadata.Arn" "$REPOSITORY_DATA")

PUSH_TRIGGER_ROLE_DATA=$(
  aws iam create-role \
    --role-name $PUSH_TRIGGER_ROLE_NAME \
    --assume-role-policy-document file://json/lambda-codecommit-trigger-role.json \
    --region $REGION
)

PUSH_TRIGGER_ROLE_ARN=$(node -pe "JSON.parse(process.argv[1]).Role.Arn" "$PUSH_TRIGGER_ROLE_DATA")

PUSH_TRIGGER_POLICY_DATA=$(
  aws iam create-policy \
    --policy-name $PUSH_TRIGGER_POLICY_NAME \
    --policy-document file://json/lambda-codecommit-trigger-policy.json \
    --region $REGION
)

PUSH_TRIGGER_POLICY_ARN=$(node -pe "JSON.parse(process.argv[1]).Policy.Arn" "$PUSH_TRIGGER_POLICY_DATA")

aws iam attach-role-policy \
  --role-name $PUSH_TRIGGER_ROLE_NAME \
  --policy-arn $PUSH_TRIGGER_POLICY_ARN \
  --region $REGION

aws iam attach-role-policy \
  --role-name $PUSH_TRIGGER_ROLE_NAME \
  --policy-arn "arn:aws:iam::aws:policy/AWSCodeCommitReadOnly" \
  --region $REGION

cd ../lambda/node/codecommit-push-trigger

npm run build-prod

aws lambda create-function \
  --function-name $PUSH_TRIGGER_FUNCTION_NAME \
  --runtime "nodejs12.x" \
  --handler "src/index.handler" \
  --zip-file "fileb://artifacts/codecommit-push-trigger.zip" \
  --role $PUSH_TRIGGER_ROLE_ARN \
  --region $REGION

aws lambda add-permission \
  --function-name $PUSH_TRIGGER_FUNCTION_NAME \
  --statement-id 1 \
  --action "lambda:InvokeFunction" \
  --principal "codecommit.amazonaws.com" \
  --source-arn "$REPOSITORY_ARN" \
  --region $REGION

aws codecommit put-repository-triggers \
  --repository-name "cash-pass" \
  --triggers name="lambda-push-trigger",destinationArn="arn:aws:lambda:us-east-1:009853592988:function:cash-pass-codecommit-push-trigger",customData="",branches="master","develop",events="updateReference" \
  --region $REGION
