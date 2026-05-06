-- CreateTable
CREATE TABLE `proprietarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `apelido` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `proprietarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `veiculos` (
    `id` VARCHAR(191) NOT NULL,
    `placa` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `cor` VARCHAR(191) NULL,
    `quilometragem` INTEGER NULL,
    `combustivel` ENUM('GASOLINA', 'ALCOOL', 'FLEX', 'DIESEL', 'ELETRICO', 'HIBRIDO', 'GNV') NOT NULL DEFAULT 'GASOLINA',
    `tipo` ENUM('CARRO', 'MOTO', 'CAMINHONETE', 'CAMINHAO', 'ONIBUS', 'OUTRO') NOT NULL DEFAULT 'CARRO',
    `fotoUrl` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `proprietarioId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `veiculos_placa_proprietarioId_key`(`placa`, `proprietarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manutencoes` (
    `id` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `tipo` ENUM('PREVENTIVA', 'CORRETIVA', 'EMERGENCIAL') NOT NULL DEFAULT 'PREVENTIVA',
    `descricao` VARCHAR(191) NULL,
    `localNome` VARCHAR(191) NULL,
    `localEndereco` VARCHAR(191) NULL,
    `profissional` VARCHAR(191) NULL,
    `valorTotal` DECIMAL(10, 2) NULL,
    `quilometragem` INTEGER NULL,
    `observacoes` VARCHAR(191) NULL,
    `status` ENUM('CONCLUIDA', 'EM_ANDAMENTO', 'AGENDADA', 'CANCELADA') NOT NULL DEFAULT 'CONCLUIDA',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `veiculoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicos` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `valor` DECIMAL(10, 2) NULL,
    `registradoPorVoz` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `manutencaoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pecas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `marca` VARCHAR(191) NULL,
    `referencia` VARCHAR(191) NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,
    `valorUnitario` DECIMAL(10, 2) NULL,
    `registradoPorVoz` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `manutencaoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anexos` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('FOTO_SERVICO', 'NOTA_FISCAL', 'GARANTIA', 'OUTRO') NOT NULL DEFAULT 'FOTO_SERVICO',
    `url` VARCHAR(191) NOT NULL,
    `nomeArquivo` VARCHAR(191) NOT NULL,
    `tamanhoBytes` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `legenda` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `manutencaoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `motivoVoz` BOOLEAN NOT NULL DEFAULT false,
    `dataAlerta` DATETIME(3) NOT NULL,
    `kmAlerta` INTEGER NULL,
    `status` ENUM('PENDENTE', 'ENVIADA', 'VISUALIZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `veiculoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessoes` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `dispositivo` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiraEm` DATETIME(3) NOT NULL,
    `proprietarioId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sessoes_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `veiculos` ADD CONSTRAINT `veiculos_proprietarioId_fkey` FOREIGN KEY (`proprietarioId`) REFERENCES `proprietarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manutencoes` ADD CONSTRAINT `manutencoes_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `veiculos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicos` ADD CONSTRAINT `servicos_manutencaoId_fkey` FOREIGN KEY (`manutencaoId`) REFERENCES `manutencoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pecas` ADD CONSTRAINT `pecas_manutencaoId_fkey` FOREIGN KEY (`manutencaoId`) REFERENCES `manutencoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexos` ADD CONSTRAINT `anexos_manutencaoId_fkey` FOREIGN KEY (`manutencaoId`) REFERENCES `manutencoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_veiculoId_fkey` FOREIGN KEY (`veiculoId`) REFERENCES `veiculos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_proprietarioId_fkey` FOREIGN KEY (`proprietarioId`) REFERENCES `proprietarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
