"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentimentoModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const pluggy_module_1 = require("../pluggy/pluggy.module");
const consentimento_controller_1 = require("./consentimento.controller");
const consentimento_service_1 = require("./consentimento.service");
let ConsentimentoModule = class ConsentimentoModule {
};
exports.ConsentimentoModule = ConsentimentoModule;
exports.ConsentimentoModule = ConsentimentoModule = __decorate([
    (0, common_1.Module)({
        imports: [pluggy_module_1.PluggyModule, audit_module_1.AuditModule],
        controllers: [consentimento_controller_1.ConsentimentoController],
        providers: [consentimento_service_1.ConsentimentoService],
        exports: [consentimento_service_1.ConsentimentoService],
    })
], ConsentimentoModule);
//# sourceMappingURL=consentimento.module.js.map