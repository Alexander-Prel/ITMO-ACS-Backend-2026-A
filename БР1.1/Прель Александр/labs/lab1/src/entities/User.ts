import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Reservation } from "./Reservation";
import { Review } from "./Review";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ name: "user_id" })
  userId!: number;

  @Column({ name: "first_name", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", length: 100 })
  lastName!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 32 })
  phone!: string;

  @Column({ name: "password_hash", length: 255 })
  passwordHash!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations!: Reservation[];

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];
}
