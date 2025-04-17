export interface UserEntity {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone_number?: string;
	password: string;
	access_token: string;
	is_verified: boolean;
	profile_image?: string;
	created_at?: Date;
	updated_at?: Date;
}
