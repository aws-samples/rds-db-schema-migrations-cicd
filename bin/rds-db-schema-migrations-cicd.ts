#!/usr/bin/env node
import { CdkpipelinesStack } from '../lib/cdkpipelines-stack';
import { App } from '@aws-cdk/core';

const app = new App();

// environment variables set in the cdk-deploy-to script
const envVariables = {
  branch: process.env.BRANCH || 'main',
  developmentAccount: safelyRetrieveEnvVariable('CDK_DEVELOPMENT_ACCOUNT'),
  productionAccount: safelyRetrieveEnvVariable('CDK_PRODUCTION_ACCOUNT'),
  region: safelyRetrieveEnvVariable('REGION'),
  repositoryName: safelyRetrieveEnvVariable('REPOSITORY_NAME')
}

new CdkpipelinesStack(app, 'CdkpipelinesStack', envVariables, {
  env: { account: process.env.CDK_DEVELOPMENT_ACCOUNT, region: process.env.REGION },
});

app.synth();

function safelyRetrieveEnvVariable(envName: string): string {
  const variable = process.env[envName];
  if (!variable) {
    throw new Error(`The variable ${envName} is required as environment variable. 
    Either provide the variables, or run the cdk-* scripts provided by this module`);
  }
  return variable;
}
