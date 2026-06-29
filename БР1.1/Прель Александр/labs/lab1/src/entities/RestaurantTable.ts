import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Reservation } from "./Reservation";
import { Restaurant } from "./Restaurant";

@Entity("tables")
export class RestaurantTable {
  @PrimaryGeneratedColumn({ name: "table_id" })
  tableId!: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, { onDelete: "CASCADE" })
  @JoinColumn({ name: "restaurant_id" })
  restaurant!: Restaurant;

  @Column({ name: "table_number", length: 50 })
  tableNumber!: string;

  @Column()
  capacity!: number;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @OneToMany(() => Reservation, (reservation) => reservation.table)
  reservations!: Reservation[];
}
