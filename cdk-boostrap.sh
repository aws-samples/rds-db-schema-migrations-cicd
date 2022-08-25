#!/usr/bin/env bash

if [[ $# -ge 6 ]]; then
    export CDK_DEVELOPMENT_ACCOUNT=$1
    export CDK_PRODUCTION_ACCOUNT=$2
    export REGION=$3
    export REPOSITORY_NAME=$4
    export PROD_PROFILE=$5
    export DEV_PROFILE=$6
    shift; shift; shift; shift; shift; shift

    # retrieve default branch
    export BRANCH=$(aws codecommit get-repository --repository-name ${REPOSITORY_NAME} --region ${REGION} --output json | jq -r '.repositoryMetadata.defaultBranch')

    export AWS_REGION=$REGION

    npx cdk bootstrap  --profile $DEV_PROFILE --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://$CDK_DEVELOPMENT_ACCOUNT/$REGION

    npx cdk bootstrap --profile $PROD_PROFILE --trust $CDK_DEVELOPMENT_ACCOUNT --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://$CDK_PRODUCTION_ACCOUNT/$REGION

    exit $?
else
    echo 1>&6 "Provide development, production accounts, region repository name, dev profile name and prod profile name as first args."
    exit 1
fi