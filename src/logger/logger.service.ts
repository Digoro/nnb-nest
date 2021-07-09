import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
    constructor(
        private http: HttpService,
    ) { }

    async log(log) {
        await this.http.post('http://3.36.180.230:9090', log).toPromise()
    }
}
