import { ConfigService } from '@nestjs/config';
export declare class FcmService {
    private readonly logger;
    private messaging;
    constructor(config: ConfigService);
    enviar(fcmToken: string, titulo: string, corpo: string): Promise<boolean>;
}
