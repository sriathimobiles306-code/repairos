
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class CreatePhoneDto {
    @IsNotEmpty()
    @IsString()
    brand: string;

    @IsNotEmpty()
    @IsString()
    model: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    aliases?: string[];
}

export class CreateScreenDto {
    @IsNotEmpty()
    @IsString()
    type: 'FLAT' | '2.5D' | '3D_CURVED' | 'FOLDABLE_INNER' | 'FOLDABLE_OUTER';

    @IsNotEmpty()
    diagonal: number;

    @IsNotEmpty()
    width: number;

    @IsNotEmpty()
    height: number;

    @IsOptional()
    cornerRadius?: number;

    @IsNotEmpty()
    @IsString()
    cutoutType: 'NONE' | 'NOTCH_WIDE' | 'NOTCH_TEARDROP' | 'PUNCH_HOLE_CENTER' | 'PUNCH_HOLE_LEFT' | 'PUNCH_HOLE_RIGHT' | 'DYNAMIC_ISLAND';

    @IsOptional()
    cutoutWidth?: number;

    @IsOptional()
    cutoutHeight?: number;

    @IsOptional()
    cutoutX?: number;

    @IsOptional()
    cutoutY?: number;
}
