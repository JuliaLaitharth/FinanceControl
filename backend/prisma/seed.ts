import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoriasPadrao = [
  { nome: 'Alimentação', tipo: 'DESPESA', icone: '🍽️' },
  { nome: 'Transporte', tipo: 'DESPESA', icone: '🚌' },
  { nome: 'Moradia', tipo: 'DESPESA', icone: '🏠' },
  { nome: 'Saúde', tipo: 'DESPESA', icone: '💊' },
  { nome: 'Educação', tipo: 'DESPESA', icone: '📚' },
  { nome: 'Lazer', tipo: 'DESPESA', icone: '🎮' },
  { nome: 'Vestuário', tipo: 'DESPESA', icone: '👕' },
  { nome: 'Serviços', tipo: 'DESPESA', icone: '📱' },
  { nome: 'Pix enviado', tipo: 'DESPESA', icone: '📤' },
  { nome: 'Pix recebido', tipo: 'RECEITA', icone: '📥' },
  { nome: 'Transferência', tipo: 'DESPESA', icone: '↔️' },
  { nome: 'Renda', tipo: 'RECEITA', icone: '💰' },
  { nome: 'Investimentos', tipo: 'RECEITA', icone: '📈' },
  { nome: 'Outros', tipo: 'DESPESA', icone: '📦' },
];

async function main() {
  console.log('Seed: criando categorias padrão do sistema...');

  for (const cat of categoriasPadrao) {
    await prisma.categoria.upsert({
      where: {
        // Upsert por nome + padraoSistema via campo calculado não é direto no Prisma,
        // então usamos findFirst + create/update manual
        id: (
          await prisma.categoria.findFirst({
            where: { nome: cat.nome, padraoSistema: true, usuarioId: null },
          })
        )?.id ?? -1,
      },
      update: { icone: cat.icone, tipo: cat.tipo },
      create: {
        nome: cat.nome,
        tipo: cat.tipo,
        icone: cat.icone,
        padraoSistema: true,
        usuarioId: null,
      },
    });
  }

  console.log(`Seed concluído: ${categoriasPadrao.length} categorias criadas/atualizadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
