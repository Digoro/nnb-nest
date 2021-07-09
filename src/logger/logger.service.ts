import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class LoggerService {
    constructor(
        private http: HttpService,
    ) { }

    async log(log) {
        await this.http.post('http://localhost:9090', log).toPromise()
    }
}
