"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
let EncryptionService = class EncryptionService {
    key;
    constructor(config) {
        const hex = config.getOrThrow('ENCRYPTION_KEY');
        if (hex.length !== 64) {
            throw new common_1.InternalServerErrorException('ENCRYPTION_KEY deve ter exatamente 64 caracteres hexadecimais (32 bytes)');
        }
        this.key = Buffer.from(hex, 'hex');
    }
    encrypt(plaintext) {
        const iv = (0, crypto_1.randomBytes)(IV_BYTES);
        const cipher = (0, crypto_1.createCipheriv)(ALGO, this.key, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
    }
    decrypt(ciphertext) {
        const parts = ciphertext.split(':');
        if (parts.length !== 3)
            throw new common_1.InternalServerErrorException('Formato de ciphertext inválido');
        const [ivHex, dataHex, tagHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const data = Buffer.from(dataHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = (0, crypto_1.createDecipheriv)(ALGO, this.key, iv);
        decipher.setAuthTag(tag);
        return decipher.update(data).toString('utf8') + decipher.final('utf8');
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map