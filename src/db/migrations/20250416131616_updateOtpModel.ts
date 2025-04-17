import type { Knex } from "knex";
import { tableNames } from "../../common/constants";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableNames.otps, function (table) {
		table.string("code").alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableNames.otps, function (table) {
		table.integer("code").alter();
	});
}
