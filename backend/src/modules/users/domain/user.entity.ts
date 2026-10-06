import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Nome reservado do único usuário que pode cadastrar e remover usuários. */
export const ADMIN_USERNAME = 'admin';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Sempre gravado em minúsculas; unicidade garantida por índice na migration.
  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

export interface NewUser {
  username: string;
  passwordHash: string;
}

export function isAdmin(user: Pick<User, 'username'>): boolean {
  return user.username === ADMIN_USERNAME;
}
