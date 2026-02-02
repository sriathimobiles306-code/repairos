
export class RegisterTenantDto {
    businessName!: string;
    email!: string;
    password!: string;
    fullName!: string;
}

export class LoginDto {
    email!: string;
    password!: string;
}
