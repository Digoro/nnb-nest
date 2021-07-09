import { Column, Entity } from "typeorm";
import { BasicEntity } from '../../shared/model/basic.entity';

@Entity({ name: 'event-log' })
export class EventLog extends BasicEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'event_name' })
  eventName: string;

  @Column()
  url: string;

  @Column({ name: 'target_url' })
  targetUrl: string;

  @Column({ name: 'page_name' })
  pageName: string;

  @Column()
  browser: string;

  @Column({ name: 'browser_version' })
  browserVersion: string;

  @Column()
  device: string;

  @Column({ name: 'device_type' })
  deviceType: string;

  @Column()
  orientation: string;

  @Column()
  os: string;

  @Column({ name: 'os_version' })
  osVersion: string;

  @Column({ name: 'user_agent' })
  userAgent: string;

  @Column({ name: 'target_info' })
  targetInfo: string;
}
