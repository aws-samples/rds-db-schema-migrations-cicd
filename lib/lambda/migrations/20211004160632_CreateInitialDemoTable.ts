const Knex = require("knex");

export async function up(knex: typeof Knex): Promise<void> {
  return await knex.schema.createTable('demo_table', (table: typeof Knex.TableBuilder) => {
    table.increments('id')
  })
}


export async function down(knex: typeof Knex): Promise<void> {
  await knex.schema.dropTable('demo_table')
}
