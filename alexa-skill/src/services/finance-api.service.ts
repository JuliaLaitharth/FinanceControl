import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

export class FinanceApiService {
  private readonly headers: Record<string, string>;

  constructor(accessToken: string) {
    this.headers = { Authorization: `Bearer ${accessToken}` };
  }

  async getSaldoConsolidado(): Promise<{ total: number; porInstituicao: Array<{ nome: string; saldo: number }> }> {
    const { data } = await axios.get(`${API_BASE_URL}/contas/saldo`, {
      headers: this.headers,
      timeout: 8000,
    });
    return data;
  }

  async getResumoCategorias(): Promise<{ categorias: Array<{ nome: string; total: number }> }> {
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
    const { data } = await axios.get(`${API_BASE_URL}/transacoes/resumo-categorias`, {
      headers: this.headers,
      params: { dataInicio: inicio },
      timeout: 8000,
    });
    return data;
  }

  async registrarAlexaId(alexaUserId: string): Promise<void> {
    await axios.patch(
      `${API_BASE_URL}/auth/alexa-id`,
      { alexaUserId },
      { headers: this.headers, timeout: 5000 },
    );
  }
}
