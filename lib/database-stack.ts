import { CfnOutput, Construct, Duration } from '@aws-cdk/core';

import { Vpc, SecurityGroup, Peer, Port, BastionHostLinux } from '@aws-cdk/aws-ec2';
import { Credentials, DatabaseClusterEngine, ServerlessCluster, AuroraCapacityUnit, ParameterGroup } from '@aws-cdk/aws-rds';

/**
 * A stack for the RDS Database setup
 */
export class DatabaseStack extends Construct {
  public readonly vpc: Vpc;
  public readonly secretName: CfnOutput;
  public readonly secretArn: CfnOutput;
  public readonly securityGroupOutput: SecurityGroup;
  public readonly defaultDBName: string = "demo";

  constructor(scope: Construct, id: string, stageName: string) {
    super(scope, id);

    // VPC 
    this.vpc = new Vpc(this, 'RdsVpc');

    // Database Security group
    const securityGroup = new SecurityGroup(this, 'LambdaPostgresConnectionSG', {
      vpc: this.vpc,
      description: "Lambda security group to connect to Postgres db.",
      allowAllOutbound: true
    })
    securityGroup.addIngressRule(Peer.ipv4(this.vpc.vpcCidrBlock), Port.tcp(5432), 'Allow Postgres Communication')

    // Database cluster
    const cluster = new ServerlessCluster(this, 'DBCluster', {
      engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
      vpc: this.vpc,
      parameterGroup: ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
      enableDataApi: true,
      securityGroups: [
        securityGroup
      ],
      defaultDatabaseName: this.defaultDBName,
      scaling: {
        minCapacity: AuroraCapacityUnit.ACU_2,
        maxCapacity: AuroraCapacityUnit.ACU_4
      },
      credentials: Credentials.fromGeneratedSecret('syscdk'),
    });

    // Configure automatic secrets rotation
    cluster.addRotationSingleUser({
      automaticallyAfter: Duration.days(7),
      excludeCharacters: '!@#$%^&*',
    });

    // Setup bastion server to connect from local machine - only dev environment.
    if (stageName === 'Development') {
      new BastionHostLinux(this, 'BastionHost', { 
        vpc: this.vpc
      });
    }

    // Outputs
    this.secretName = new CfnOutput(this, 'secretName', {
      value: cluster.secret?.secretName || '',
    });

    this.secretArn = new CfnOutput(this, 'secretArn', {
      value: cluster.secret?.secretArn || '',
    });

    this.securityGroupOutput = securityGroup;
  }
}
