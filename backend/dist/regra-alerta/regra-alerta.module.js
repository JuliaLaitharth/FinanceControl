"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegraAlertaModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_js_1 = require("../audit/audit.module.js");
const regra_alerta_controller_js_1 = require("./regra-alerta.controller.js");
const regra_alerta_service_js_1 = require("./regra-alerta.service.js");
let RegraAlertaModule = class RegraAlertaModule {
};
exports.RegraAlertaModule = RegraAlertaModule;
exports.RegraAlertaModule = RegraAlertaModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_js_1.AuditModule],
        controllers: [regra_alerta_controller_js_1.RegraAlertaController],
        providers: [regra_alerta_service_js_1.RegraAlertaService],
        exports: [regra_alerta_service_js_1.RegraAlertaService],
    })
], RegraAlertaModule);
//# sourceMappingURL=regra-alerta.module.js.map