'use strict'

import Knex from 'knex';

import { SecretsManager } from 'aws-sdk';

const RDS_DB_PASS_SECRET_ID = process.env.RDS_DB_PASS_SECRET_ID || ''
const RDS_DB_NAME = process.env.RDS_DB_NAME || ''
const RDS_DB_SCHEMA = process.env.RDS_DB_SCHEMA || ''

const secretsManagerClient = new SecretsManager()

export class KnexClient {
  dbClient: any

  async dbSetup() {
    if (typeof this.dbClient === 'undefined' && !this.dbClient) {
      this.dbClient = Knex({
        client: 'pg',
        connection: await this.getConnection(RDS_DB_PASS_SECRET_ID, RDS_DB_NAME),
        migrations: {
          directory: 'migrations',
          schemaName: RDS_DB_SCHEMA
        },
      })
    }
    return this.dbClient
  }

  async getConnection(secretId: string, dbName: string) {
    const dbSecret = JSON.parse(await this.getSecretValue(secretId) || '');
    const config = {
      host: dbSecret.host,
      port: dbSecret.port,
      user: dbSecret.username,
      password: dbSecret.password,
      database: dbName,
      idleTimeoutMillis: 12000,
      connectionTimeoutMillis: 180000
    }
    return config
  }

  async getSecretValue(secretId: string) {
    const data = await secretsManagerClient.getSecretValue({ SecretId: secretId }).promise()
    if ('SecretString' in data) {
      return data.SecretString
    } else {
      const buff = Buffer.from(data.SecretBinary as string, 'base64')
      return  buff.toString('ascii')
    }
  }

  async migrate() {
    if (!this.dbClient) {
      await this.dbSetup()
    }
    const response = await this.dbClient.migrate.latest()
    console.info(response)
  }
}
