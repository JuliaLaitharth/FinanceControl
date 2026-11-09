"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegraCategorizacaoModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_js_1 = require("../audit/audit.module.js");
const regra_categorizacao_controller_js_1 = require("./regra-categorizacao.controller.js");
const regra_categorizacao_service_js_1 = require("./regra-categorizacao.service.js");
let RegraCategorizacaoModule = class RegraCategorizacaoModule {
};
exports.RegraCategorizacaoModule = RegraCategorizacaoModule;
exports.RegraCategorizacaoModule = RegraCategorizacaoModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_js_1.AuditModule],
        controllers: [regra_categorizacao_controller_js_1.RegraCategorizacaoController],
        providers: [regra_categorizacao_service_js_1.RegraCategorizacaoService],
        exports: [regra_categorizacao_service_js_1.RegraCategorizacaoService],
    })
], RegraCategorizacaoModule);
//# sourceMappingURL=regra-categorizacao.module.js.map