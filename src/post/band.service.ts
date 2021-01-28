import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BandService {
    private band_key: string;
    private band_access_token: string;
    limit = 10;

    constructor(
        private http: HttpService,
        private configService: ConfigService
    ) {
        this.band_key = configService.get("BAND_KEY");
        this.band_access_token = configService.get("BAND_ACCESS_TOKEN");
    }

    async list(after?: string): Promise<any> {
        let url = '';
        if (!after) {
            url = `https://openapi.band.us/v2/band/posts?band_key=${this.band_key}&access_token=${this.band_access_token}`;
        } else {
            url = `https://openapi.band.us/v2/band/posts?band_key=${this.band_key}&access_token=${this.band_access_token}&after=${after}&limit=${this.limit}`;
        }
        const result = await this.http.get(url).toPromise();
        return result.data;
    }

    async findByPostId(postKey: string): Promise<any> {
        const result = await this.http.get(`https://openapi.band.us/v2.1/band/post?band_key=${this.band_key}&access_token=${this.band_access_token}&post_key=${postKey}`).toPromise();
        return result.data;
    }

    async getComments(postKey: string): Promise<any> {
        const result = await this.http.get(`https://openapi.band.us/v2/band/post/comments?band_key=${this.band_key}&access_token=${this.band_access_token}&post_key=${postKey}`).toPromise();
        return result.data;
    }
}
