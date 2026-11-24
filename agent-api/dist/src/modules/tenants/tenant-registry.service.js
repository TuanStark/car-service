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
exports.TenantRegistryService = void 0;
const common_1 = require("@nestjs/common");
const autora_manifest_1 = require("./manifests/autora.manifest");
let TenantRegistryService = class TenantRegistryService {
    manifests = new Map();
    constructor() {
        this.registerManifest(autora_manifest_1.AUTORA_TENANT_MANIFEST);
    }
    registerManifest(manifest) {
        this.manifests.set(manifest.tenantId, manifest);
    }
    getManifest(tenantId) {
        const found = this.manifests.get(tenantId);
        if (!found) {
            throw new common_1.NotFoundException(`Tenant manifest "${tenantId}" is not registered.`);
        }
        return found;
    }
    listTenants() {
        return Array.from(this.manifests.keys());
    }
};
exports.TenantRegistryService = TenantRegistryService;
exports.TenantRegistryService = TenantRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TenantRegistryService);
//# sourceMappingURL=tenant-registry.service.js.map