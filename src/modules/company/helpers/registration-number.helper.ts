import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';

function generateRccm(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `RCCM-CM-${year}-${random}`;
}

export async function generateUniqueRccm(
  repository: Repository<Company>,
  maxAttempts = 10,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateRccm();
    const existing = await repository.findOne({
      where: { registrationNumber: candidate },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw new Error(
    `Unable to generate a unique registration number after ${maxAttempts} attempts`,
  );
}
