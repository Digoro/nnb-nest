import { IsJSON, IsNumber, IsString } from 'class-validator';
import { Dto } from '../../shared/model/dto';
import { EventLog } from './event-log';

export class EventLogCreateDto implements Dto<EventLog>{
    @IsNumber()
    userId: number;

    @IsString()
    clientIp: string;

    @IsString()
    eventType: string;

    @IsString()
    eventName: string;

    @IsString()
    url: string;

    @IsString()
    targetUrl: string;

    @IsString()
    pageName: string;

    @IsString()
    browser: string;

    @IsString()
    browserVersion: string;

    @IsString()
    device: string;

    @IsString()
    deviceType: string;

    @IsString()
    orientation: string;

    @IsString()
    os: string;

    @IsString()
    osVersion: string;

    @IsString()
    userAgent: string;

    @IsJSON()
    targetInfo: string;

    toEntity(): EventLog {
        const eventLog = new EventLog();
        eventLog.userId = this.userId;
        eventLog.clientIp = this.clientIp;
        eventLog.eventType = this.eventType;
        eventLog.eventName = this.eventName;
        eventLog.url = this.url;
        eventLog.targetUrl = this.targetUrl;
        eventLog.pageName = this.pageName;
        eventLog.browser = this.browser;
        eventLog.browserVersion = this.browserVersion;
        eventLog.device = this.device;
        eventLog.deviceType = this.deviceType;
        eventLog.orientation = this.orientation;
        eventLog.os = this.os;
        eventLog.osVersion = this.osVersion;
        eventLog.userAgent = this.userAgent;
        eventLog.targetInfo = this.targetInfo;
        return eventLog;
    }
}