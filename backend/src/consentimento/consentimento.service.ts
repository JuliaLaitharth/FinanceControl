import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PluggyAdapter } from '../pluggy/pluggy.adapter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentimentoDto } from './dto/create-consentimento.dto';

@Injectable()
export class ConsentimentoService {
  private readonly logger = new Logger(ConsentimentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pluggy: PluggyAdapter,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
  ) {}

  /** Gera connect token para abrir o Pluggy Connect Widget. */
  async gerarConnectToken(usuarioId: number): Promise<{ connectToken: string }> {
    await this.audit.registrar(usuarioId, 'CONNECT_TOKEN_GERADO', 'consentimento');
    const connectToken = await this.pluggy.criarConnectToken();
    return { connectToken };
  }

  /**
   * Registra um consentimento após o usuário autorizar no widget.
   * Busca as contas do item e persiste tudo.
   */
  async criar(dto: CreateConsentimentoDto, usuarioId: number, ip?: string) {
    const itemIdDecriptado = dto.itemId;

    // Verifica duplicidade: o mesmo itemId já foi conectado por este usuário?
    const itemIdCriptografado = this.encryption.encrypt(itemIdDecriptado);
    const duplicado = await this.prisma.consentimento.findFirst({
      where: { usuarioId, itemIdPluggy: itemIdCriptografado },
    });
    if (duplicado) throw new ConflictException('Conta já conectada');

    // Busca detalhes do item para obter a instituição
    const item = await this.pluggy.buscarItem(itemIdDecriptado);
    const connectorId = String(item.connector.id);
    const nomeInstituicao = item.connector.name;

    // Upsert da instituição
    const instituicao = await this.prisma.instituicao.upsert({
      where: { codigoPluggy: connectorId },
      update: { nome: nomeInstituicao },
      create: {
        nome: nomeInstituicao,
        codigoPluggy: connectorId,
        logoUrl: item.connector.imageUrl ?? null,
      },
    });

    // Cria o consentimento
    const consentimento = await this.prisma.consentimento.create({
      data: {
        usuarioId,
        instituicaoId: instituicao.id,
        itemIdPluggy: itemIdCriptografado,
        status: 'ATIVO',
        dataExpiracao: new Date(Date.now() + 365 * 86_400_000), // 1 ano
      },
    });

    // Busca e persiste as contas bancárias do item
    const contasPluggy = await this.pluggy.buscarContas(itemIdDecriptado);
    await this.prisma.contaBancaria.createMany({
      data: contasPluggy.map((c) => ({
        consentimentoId: consentimento.id,
        idExternoPluggy: c.id,
        tipo: c.type,
        numeroMascarado: c.number ?? null,
        saldoAtual: c.balance,
        moeda: c.currencyCode ?? 'BRL',
        ultimaSincronizacao: new Date(),
      })),
      skipDuplicates: true,
    });

    await this.audit.registrar(usuarioId, 'CONSENTIMENTO_CRIADO', 'consentimento', ip);
    this.logger.log(`Consentimento criado: usuário ${usuarioId}, instituição ${nomeInstituicao}`);

    return this.buscarPorId(consentimento.id, usuarioId);
  }

  /** Lista todos os consentimentos ativos do usuário com suas contas. */
  async listar(usuarioId: number) {
    return this.prisma.consentimento.findMany({
      where: { usuarioId, status: 'ATIVO' },
      include: {
        instituicao: { select: { nome: true, logoUrl: true } },
        contas: {
          select: {
            id: true,
            tipo: true,
            numeroMascarado: true,
            saldoAtual: true,
            moeda: true,
            ultimaSincronizacao: true,
          },
        },
      },
      orderBy: { dataConsentimento: 'desc' },
    });
  }

  /**
   * Revoga um consentimento: revoga no Pluggy e apaga todos os dados locais.
   * Exigência LGPD / UC02.
   */
  async revogar(consentimentoId: number, usuarioId: number, ip?: string): Promise<void> {
    const consentimento = await this.buscarPorId(consentimentoId, usuarioId);

    // Descriptografa para chamar a API do Pluggy
    const itemId = this.encryption.decrypt(consentimento.itemIdPluggy);
    await this.pluggy.revogarItem(itemId);

    // Cascata: contas → transações → notificações são excluídas via onDelete: Cascade no schema
    await this.prisma.consentimento.delete({ where: { id: consentimentoId } });

    await this.audit.registrar(usuarioId, 'CONSENTIMENTO_REVOGADO', 'consentimento', ip);
    this.logger.log(`Consentimento ${consentimentoId} revogado: usuário ${usuarioId}`);
  }

  private async buscarPorId(id: number, usuarioId: number) {
    const c = await this.prisma.consentimento.findFirst({
      where: { id, usuarioId },
      include: {
        instituicao: { select: { nome: true, logoUrl: true } },
        contas: true,
      },
    });
    if (!c) throw new NotFoundException('Consentimento não encontrado');
    return c;
  }
}
