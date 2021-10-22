#!/usr/bin/env node
import { CdkpipelinesStack } from '../lib/cdkpipelines-stack';
import { App } from '@aws-cdk/core';

const app = new App();

// environment variables set in the cdk-deploy-to script
const envVariables = {
  branch: process.env.BRANCH || 'main',
  developmentAccount: process.env.CDK_DEVELOPMENT_ACCOUNT || '',
  productionAccount: process.env.CDK_PRODUCTION_ACCOUNT || '',
  region: process.env.REGION || '',
  repositoryName: process.env.REPOSITORY_NAME || ''
}

new CdkpipelinesStack(app, 'CdkpipelinesStack', envVariables, {
  env: { account: process.env.CDK_DEVELOPMENT_ACCOUNT, region: process.env.REGION },
});

app.synth();