import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RestaurantTable } from "./RestaurantTable";
import { User } from "./User";

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

@Entity("reservations")
export class Reservation {
  @PrimaryGeneratedColumn({ name: "reservation_id" })
  reservationId!: number;

  @ManyToOne(() => User, (user) => user.reservations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => RestaurantTable, (table) => table.reservations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "table_id" })
  table!: RestaurantTable;

  @Column({ name: "reservation_date", length: 10 })
  reservationDate!: string;

  @Column({ name: "start_time", length: 8 })
  startTime!: string;

  @Column({ name: "end_time", length: 8 })
  endTime!: string;

  @Column({ name: "guests_count" })
  guestsCount!: number;

  @Column({ length: 20, default: "confirmed" })
  status!: ReservationStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
