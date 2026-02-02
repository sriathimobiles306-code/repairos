
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PartsService {
    constructor(private dataSource: DataSource) { }

    async searchParts(query: string) {
        // Find parts matching the code (e.g. "PM8953")
        return this.dataSource.query(`
            SELECT * FROM electronic_parts 
            WHERE part_code ILIKE $1 OR description ILIKE $1
            LIMIT 20
        `, [`%${query}%`]);
    }

    async getPartCompatibility(partId: number) {
        // Get all models that use this part
        return this.dataSource.query(`
            SELECT brand, model, notes 
            FROM part_compatibility 
            WHERE part_id = $1
            ORDER BY brand, model
        `, [partId]);
    }

    async createPart(code: string, desc: string, category: string) {
        const res = await this.dataSource.query(`
            INSERT INTO electronic_parts (part_code, description, category)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [code, desc, category]);
        return res[0];
    }

    async addCompatibility(partId: number, brand: string, model: string, notes?: string) {
        return this.dataSource.query(`
            INSERT INTO part_compatibility (part_id, brand, model, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [partId, brand, model, notes]);
    }

    async getPartsByModel(query: string) {
        // Find parts used in a specific model (e.g. "Note 4")
        return this.dataSource.query(`
            SELECT p.*, pc.notes
            FROM part_compatibility pc
            JOIN electronic_parts p ON p.id = pc.part_id
            WHERE pc.model ILIKE $1 OR pc.brand ILIKE $1
            LIMIT 50
        `, [`%${query}%`]);
    }
}
