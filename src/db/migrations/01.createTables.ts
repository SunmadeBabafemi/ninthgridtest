import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema
		.createTable("users", (table) => {
			table.uuid("id").primary().defaultTo(knex.raw("(UUID())"));
			table.string("first_name").notNullable();
			table.string("last_name").notNullable();
			table.string("email").unique().notNullable();
			table.string("phone_number").unique().nullable();
			table.string("password").notNullable();
			table.string("access_token").nullable();
			table.boolean("is_verified").defaultTo(false);
			table.string("profile_image").nullable();
			table.timestamps(true, true);
		})
		.createTable("otps", (table) => {
			table.uuid("id").primary().defaultTo(knex.raw("(UUID())"));
			table.uuid("user_id").nullable();
			table.string("code").notNullable();
			table.string("token").notNullable();
			table.timestamps(true, true);
		})
		.createTable("files", (table) => {
			table.uuid("id").primary().defaultTo(knex.raw("(UUID())"));
			table.string("file_name").nullable();
			table.string("file_type").nullable();
			table
				.uuid("user_id")
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.string("url").notNullable();
			table.boolean("deleted").defaultTo(false);
			table.timestamps(true, true);
		});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema
		.dropTableIfExists("users")
		.dropTableIfExists("otps")
		.dropTableIfExists("files");
}
