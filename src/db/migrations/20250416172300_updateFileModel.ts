import type { Knex } from "knex";
import { tableNames } from "../../common/constants";
import { CloudUploadOption } from "../../common/enums";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableNames.files, function (table) {
		table.string("file_description").nullable();
		table.string("file_format").nullable();
		table.integer("file_size").nullable();
		table
			.enum("storage_cloud", [
				CloudUploadOption.AWS,
				CloudUploadOption.CLOUDINARY,
				CloudUploadOption.GCP,
			])
			.defaultTo(CloudUploadOption.CLOUDINARY);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableNames.files, function (table) {
		table.dropColumn("file_description");
		table.dropColumn("file_format");
		table.dropColumn("file_size");
		table.dropColumn("storage_cloud");
	});
}
