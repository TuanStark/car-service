import { Injectable } from "@nestjs/common";
import type { ActorRole } from "@/common/contracts/agent.contract";
import { RbacService } from "@/modules/rbac/rbac.service";

export interface RagDocumentChunk {
  readonly id: string;
  readonly tenantId: string;
  readonly sourceId: string;
  readonly title: string;
  readonly content: string;
  readonly accessRole: ActorRole;
  readonly tags: readonly string[];
}

export interface RagSearchResult {
  readonly chunk: RagDocumentChunk;
  readonly score: number;
}

const DEFAULT_AUTORA_KNOWLEDGE: readonly RagDocumentChunk[] = [
  {
    id: "kb-1",
    tenantId: "autora-vn",
    sourceId: "blog-bao-duong-km",
    title: "Lịch bảo dưỡng ô tô định kỳ 5.000 – 40.000 km tại Việt Nam",
    content:
      "Tại Việt Nam, xe chạy đô thị kẹt xe nên bảo dưỡng mỗi 5.000 km hoặc 6 tháng (thay dầu động cơ, vệ sinh lọc gió). Mốc 20.000 km cần vệ sinh cụm phanh 4 bánh, đảo lốp cân bằng động và quét lỗi OBD-II. Mốc 40.000 km là kỳ bảo dưỡng cấp lớn cần thay dầu phanh DOT4, nước làm mát, lọc gió và súc rửa kim phun.",
    accessRole: "guest",
    tags: ["bao duong", "5000km", "20000km", "40000km", "thay dau", "nhot"],
  },
  {
    id: "kb-2",
    tenantId: "autora-vn",
    sourceId: "policy-pricing-transparency",
    title: "Nguyên tắc minh bạch giá VNĐ & xác nhận sửa chữa của AUTORA",
    content:
      "Mọi gói dịch vụ trên AUTORA đều hiển thị giá tham khảo rõ ràng bằng VNĐ. Khách hàng không cần đặt cọc khi đặt lịch hẹn. Nếu khi kiểm tra thực tế có phát sinh hạng mục ngoài gói (ví dụ má phanh mòn hết, bình ắc quy yếu), gara bắt buộc gửi ảnh và báo giá để khách hàng đồng ý trước khi thay thế.",
    accessRole: "guest",
    tags: ["gia", "minh bach", "chinh sach", "dat coc", "phat sinh", "vnd"],
  },
  {
    id: "kb-3",
    tenantId: "autora-vn",
    sourceId: "guide-ceramic-detailing",
    title: "Phân biệt hiệu chỉnh sơn, vệ sinh nội thất và phủ Ceramic 9H",
    content:
      "Vệ sinh nội thất hơi nước nóng giúp khử mùi cabin và dưỡng ghế da an toàn (từ 800.000đ). Phủ Ceramic 9H bảo vệ lớp sơn trước tia UV, mưa axit và tạo hiệu ứng lá sen trượt nước (từ 3.500.000đ, gồm đánh bóng hiệu chỉnh sơn 2 bước).",
    accessRole: "guest",
    tags: ["ceramic", "detailing", "noi that", "danh bong", "rua xe"],
  },
  {
    id: "kb-4",
    tenantId: "autora-vn",
    sourceId: "guide-tires-alignment",
    title: "Dấu hiệu lệch thước lái cần căn chỉnh góc đặt bánh xe 3D",
    content:
      "Nếu vô-lăng bị lệch khi đi thẳng, xe nhao sang một bên trên cao tốc hoặc lốp mòn vẹt mép trong, chủ xe nên cân bằng động và căn chỉnh thước lái 3D (từ 550.000đ) để tránh hỏng lốp và đảm bảo an toàn.",
    accessRole: "guest",
    tags: ["lop", "thuoc lai", "can bang dong", "rung vo lang", "3d"],
  },
  {
    id: "kb-5",
    tenantId: "autora-vn",
    sourceId: "member-warranty-ebook",
    title: "Quyền lợi Sổ bảo dưỡng điện tử dành cho thành viên đăng nhập",
    content:
      "Khách hàng đã đăng nhập tài khoản AUTORA được tự động lưu lịch sử bảo dưỡng theo từng biển số xe, nhắc mốc ODO thay dầu và hưởng ưu đãi mã thành viên AUTORA10 giảm 10% (tối đa 300.000đ) khi đặt lịch trực tuyến.",
    accessRole: "customer",
    tags: ["tai khoan", "so bao duong", "lich su", "uu dai", "thanh vien"],
  },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

@Injectable()
export class RagService {
  private readonly chunks: RagDocumentChunk[] = [...DEFAULT_AUTORA_KNOWLEDGE];

  constructor(private readonly rbacService: RbacService) {}

  ingestChunk(chunk: RagDocumentChunk): void {
    this.chunks.push(chunk);
  }

  /**
   * RBAC-aware Multi-Tenant Hybrid Retrieval.
   * Filters strictly by tenantId AND readable accessRoles for the actor.
   * (In production with Postgres + pgvector, this executes SQL WHERE tenant_id = $1 AND access_role = ANY($2)).
   */
  searchKnowledge(params: {
    tenantId: string;
    actorRole: ActorRole;
    query: string;
    limit?: number;
  }): readonly RagSearchResult[] {
    const readableRoles = this.rbacService.getReadableKnowledgeRoles(
      params.actorRole
    );
    const normalizedQuery = normalizeText(params.query);
    const queryTokens = normalizedQuery
      .split(" ")
      .filter((t) => t.length >= 2);

    const scored: RagSearchResult[] = [];

    for (const chunk of this.chunks) {
      if (chunk.tenantId !== params.tenantId) continue;
      if (!readableRoles.includes(chunk.accessRole)) continue;

      const corpus = normalizeText(
        `${chunk.title} ${chunk.content} ${chunk.tags.join(" ")}`
      );

      let score = 0;
      for (const token of queryTokens) {
        if (corpus.includes(token)) {
          score += chunk.tags.some((tag) => normalizeText(tag).includes(token))
            ? 2
            : 1;
        }
      }

      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, params.limit ?? 3);
  }
}
