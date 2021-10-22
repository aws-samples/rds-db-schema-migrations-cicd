import { Construct, Stage, StageProps, Stack, StackProps } from '@aws-cdk/core';
import { RdsDbSchemaMigrationsLambdaStack } from './lambda-stack';
import { DatabaseStack } from './database-stack';

/**
 * Main stack to combine other nested stacks (CDK Constructs)
 */
export class PrimaryInfraStack extends Stack {
  public readonly lambdaFunctionName: string;
  public readonly crossAccountLambdaInvokeRoleName: string;

  constructor(scope: Construct, id: string, crossAccount: boolean, stageName: string, devAccountId?: string, props?: StackProps) {
    super(scope, id, props);
    const database = new DatabaseStack(this, 'DatabaseConstruct', id)
    const service = new RdsDbSchemaMigrationsLambdaStack(
      this, 
      'WebServiceConstruct', 
      database.secretName, 
      database.secretArn, 
      database.vpc, 
      database.securityGroupOutput,
      database.defaultDBName,
      crossAccount,
      stageName,
      devAccountId);

    this.lambdaFunctionName = service.lambdaFunctionName;
    this.crossAccountLambdaInvokeRoleName = service.crossAccountLambdaInvokeRoleName;
  }
}

/**
 * Deployable unit of web service app
 */
export class CdkpipelinesStage extends Stage {
  public readonly lambdaFunctionName: string;
  public readonly crossAccountLambdaInvokeRoleName: string;

  constructor(scope: Construct, id: string, crossAccount: boolean, devAccountId?: string, props?: StageProps) {
    super(scope, id, props);

    const mainStack = new PrimaryInfraStack(this, 'PrimaryStack', crossAccount, id, devAccountId)

    this.lambdaFunctionName = mainStack.lambdaFunctionName;
    this.crossAccountLambdaInvokeRoleName = mainStack.crossAccountLambdaInvokeRoleName;
  }
}