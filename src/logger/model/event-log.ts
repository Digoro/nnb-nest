import { Column, Entity } from "typeorm";
import { BasicEntity } from '../../shared/model/basic.entity';

@Entity({ name: 'event-log' })
export class EventLog extends BasicEntity {
  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'client_ip', nullable: true })
  clientIp: string;

  @Column({ name: 'event_type', nullable: true })
  eventType: string;

  @Column({ name: 'event_name', nullable: true })
  eventName: string;

  @Column({ nullable: true })
  url: string;

  @Column({ name: 'target_url', nullable: true })
  targetUrl: string;

  @Column({ name: 'page_name', nullable: true })
  pageName: string;

  @Column({ nullable: true })
  browser: string;

  @Column({ name: 'browser_version', nullable: true })
  browserVersion: string;

  @Column({ nullable: true })
  device: string;

  @Column({ name: 'device_type', nullable: true })
  deviceType: string;

  @Column({ nullable: true })
  orientation: string;

  @Column({ nullable: true })
  os: string;

  @Column({ name: 'os_version', nullable: true })
  osVersion: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'target_info', nullable: true })
  targetInfo: string;
}
