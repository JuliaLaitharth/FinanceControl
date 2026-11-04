import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  // Lazy-loaded firebase-admin instance to avoid crashing on missing credentials
  private messaging: ((token: string, title: string, body: string) => Promise<void>) | null = null;

  constructor(config: ConfigService) {
    const rawKey = config.get<string>('FCM_SERVER_KEY');
    if (!rawKey) {
      this.logger.warn('FCM_SERVER_KEY não configurado — push notifications desativadas');
      return;
    }
    try {
      // FCM_SERVER_KEY deve ser o JSON do service account em base64 ou JSON puro
      const json = rawKey.startsWith('{') ? rawKey : Buffer.from(rawKey, 'base64').toString();
      const serviceAccount = JSON.parse(json) as Record<string, unknown>;

      // Importação dinâmica para evitar falha de módulo quando firebase-admin não está configurado
      import('firebase-admin').then((admin) => {
        const app = admin.default.initializeApp({
          credential: admin.default.credential.cert(
            serviceAccount as Parameters<typeof admin.default.credential.cert>[0],
          ),
        });
        this.messaging = async (token, title, body) => {
          await admin.default.messaging(app).send({ token, notification: { title, body } });
        };
        this.logger.log('Firebase Admin SDK inicializado com sucesso');
      }).catch((err) => {
        this.logger.warn(`Falha ao inicializar Firebase Admin SDK: ${String(err)}`);
      });
    } catch (err) {
      this.logger.warn(`Credenciais FCM inválidas: ${String(err)}`);
    }
  }

  /**
   * Envia push notification para um dispositivo.
   * No-op se o Firebase não estiver configurado.
   */
  async enviar(fcmToken: string, titulo: string, corpo: string): Promise<boolean> {
    if (!this.messaging) return false;
    try {
      await this.messaging(fcmToken, titulo, corpo);
      return true;
    } catch (err) {
      this.logger.warn(`Falha ao enviar push para token ...${fcmToken.slice(-8)}: ${String(err)}`);
      return false;
    }
  }
}
