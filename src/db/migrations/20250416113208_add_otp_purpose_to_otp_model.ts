import type { Knex } from "knex";
import { tableNames } from "../../common/constants";
import { OtpPurposeOptions } from "../../common/enums";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableNames.otps, function (table) {
		table
			.string("otp_purpose")
			.nullable()
			.defaultTo(OtpPurposeOptions.ACCOUNT_VALIDATION);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableNames.otps, function (table) {
		table.dropColumn("otp_purpose");
	});
}
