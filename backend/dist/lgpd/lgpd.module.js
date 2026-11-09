"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LgpdModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_js_1 = require("../audit/audit.module.js");
const pluggy_module_js_1 = require("../pluggy/pluggy.module.js");
const lgpd_service_js_1 = require("./lgpd.service.js");
let LgpdModule = class LgpdModule {
};
exports.LgpdModule = LgpdModule;
exports.LgpdModule = LgpdModule = __decorate([
    (0, common_1.Module)({
        imports: [pluggy_module_js_1.PluggyModule, audit_module_js_1.AuditModule],
        providers: [lgpd_service_js_1.LgpdService],
        exports: [lgpd_service_js_1.LgpdService],
    })
], LgpdModule);
//# sourceMappingURL=lgpd.module.js.map