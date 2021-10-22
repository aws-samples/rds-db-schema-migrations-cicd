#!/usr/bin/env bash

if [[ $# -ge 4 ]]; then
    export CDK_DEVELOPMENT_ACCOUNT=$1
    export CDK_PRODUCTION_ACCOUNT=$2
    export REGION=$3
    export REPOSITORY_NAME=$4
    shift; shift; shift; shift

    # retrieve default branch
    export BRANCH=$(aws codecommit get-repository --repository-name ${REPOSITORY_NAME} --region ${REGION} --output json | jq -r '.repositoryMetadata.defaultBranch')

    npx cdk destroy "$@"
    exit $?
else
    echo 1>&2 "Provide development, production accounts, region and repository name as first four args."
    echo 1>&2 "Additional args are passed through to cdk deploy."
    exit 1
fi