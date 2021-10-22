import { CfnOutput, Construct, Duration } from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as path from 'path';
import { AccountPrincipal, Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { SecurityGroup, Vpc } from '@aws-cdk/aws-ec2';

/**
 * A stack for our simple Lambda-powered web service
 */
export class RdsDbSchemaMigrationsLambdaStack extends Construct {
  public readonly lambdaFunctionName: string;
  public readonly crossAccountLambdaInvokeRoleName: string = 'CrossAccountLambdaInvokeRole';

  constructor(scope: Construct, id: string, dbCredentialsSecretName: CfnOutput, dbCredentialsSecretArn: CfnOutput, vpc: Vpc, securityGroup: SecurityGroup, defaultDBName: string, crossAccount: boolean, stageName: string, devAccountId?: string) {
    super(scope, id);

    this.lambdaFunctionName = `RDSSchemaMigrationFunction-${stageName}`;

    const lambdaRole = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(this, 'LambdaBasicExecution', 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'),
        ManagedPolicy.fromManagedPolicyArn(this, 'LambdaVPCExecution', 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        secretsManagerPermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'kms:Decrypt',
              ],
              resources: [
                dbCredentialsSecretArn.value
              ]
            }),
          ]
        })
      }
    })

    // The Lambda function that contains the functionality
    const func = new NodejsFunction(this, 'Lambda', {
      functionName: this.lambdaFunctionName,
      handler: 'handler',
      entry: path.resolve(__dirname, 'lambda/handler.ts'),
      timeout: Duration.minutes(10),
      bundling: {
        externalModules: [
          'aws-sdk'
        ],
        nodeModules: [
          'knex',
          'pg'
        ],
        commandHooks: {
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [`cp -r ${inputDir}/migrations ${outputDir}`, `find ${outputDir}/migrations -type f ! -name '*.js' -delete`];
          },
          beforeBundling() {
            return [];
          },
          beforeInstall() {
            return [];
          }
        }
      },
      depsLockFilePath: path.resolve(__dirname, 'lambda', 'package-lock.json'),
      projectRoot: path.resolve(__dirname, 'lambda'),
      environment: {
        RDS_DB_PASS_SECRET_ID: dbCredentialsSecretName.value,
        RDS_DB_NAME: defaultDBName
      },
      vpc: vpc,
      role: lambdaRole,
      securityGroups: [
        securityGroup
      ]
    })

    if (crossAccount) {
      new Role(this, 'CrossAccountLambdaInvokeRole', {
        roleName: this.crossAccountLambdaInvokeRoleName,
        assumedBy: new AccountPrincipal(devAccountId),
        inlinePolicies: {
          invokeLambdaPermissions: new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['iam:PassRole'],
                resources: ['*']
              }),
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['lambda:InvokeFunction'],
                resources: [func.functionArn],
              }),
            ]
          })
        }
      })
    }
  }
}