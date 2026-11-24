export interface BlogArticle {
  readonly id: string;
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedDate: string; // DD/MM/YYYY
  readonly readTime: string;
  readonly author: string;
  readonly coverImage: string;
  readonly content: readonly string[];
}

export const BLOG_ARTICLES_MOCK: readonly BlogArticle[] = [
  {
    id: "art-1",
    slug: "lich-bao-duong-o-to-dinh-ky-theo-so-km-tai-viet-nam",
    category: "Kinh nghiệm bảo dưỡng",
    title: "Cẩm nang các mốc bảo dưỡng ô tô định kỳ 5.000 – 40.000 km chủ xe Việt cần nhớ",
    excerpt:
      "Điều kiện khí hậu nóng ẩm, mưa ngập và giao thông đô thị dừng đỗ liên tục tại TP.HCM, Hà Nội khiến chu kỳ thay dầu nhớt và lọc gió cần được chú ý sát sao hơn.",
    publishedDate: "20/11/2026",
    readTime: "5 phút đọc",
    author: "Kỹ sư Trần Quốc Bảo",
    coverImage: "/images/service-maintenance.jpg",
    content: [
      "Tại Việt Nam, vận hành xe trong đô thị đông đúc với tốc độ trung bình thấp khiến động cơ hoạt động nhiều giờ nổ cầm chừng dù quãng đường ODO chưa tăng cao. Vì vậy, các chuyên gia kỹ thuật khuyến nghị chủ xe nên kết hợp theo dõi cả số km (5.000 km) lẫn thời gian (6 tháng) cho mỗi kỳ bảo dưỡng nhỏ.",
      "Ở mốc 20.000 km (bảo dưỡng cấp trung), ngoài việc thay dầu động cơ và lọc dầu chính hãng, kỹ thuật viên cần tháo kiểm tra và vệ sinh mạt phanh 4 bánh, đảo lốp chéo cân bằng động và vệ sinh họng ga để tránh hiện tượng òa ga hoặc hao xăng.",
      "Riêng mốc 40.000 km là kỳ đại bảo dưỡng quan trọng nhất: xe cần được thay mới dầu phanh DOT4 (do đặc tính hút ẩm trong khí hậu nhiệt đới dễ làm giảm hiệu quả phanh), thay nước làm mát động cơ, vệ sinh kim phun buồng đốt và kiểm tra toàn diện hệ thống treo.",
    ],
  },
  {
    id: "art-2",
    slug: "khi-nao-can-can-chinh-goc-dat-banh-xe-3d",
    category: "Kỹ thuật gầm & lốp",
    title: "5 dấu hiệu cảnh báo xe bị lệch thước lái cần căn chỉnh góc đặt bánh xe 3D ngay",
    excerpt:
      "Vô-lăng bị nghiêng khi đi thẳng, xe tự nhao sang một bên trên cao tốc hoặc lốp mòn vẹt mép trong là những tín hiệu không thể bỏ qua.",
    publishedDate: "16/11/2026",
    readTime: "4 phút đọc",
    author: "Cố vấn Lê Hoàng Minh",
    coverImage: "/images/service-tires.jpg",
    content: [
      "Sau khoảng 10.000 km di chuyển qua các đoạn đường gồ ghề, ổ gà hoặc leo lề đỗ xe, các góc đặt bánh xe (Camber, Caster, Toe) rất dễ sai lệch khỏi thông số chuẩn của nhà sản xuất.",
      "Nếu không căn chỉnh kịp thời bằng hệ thống máy quang học 3D, một bộ lốp mới trị giá hàng chục triệu đồng có thể bị mòn vẹt mép chỉ sau vài nghìn km, đồng thời làm tăng lực cản lăn gây tốn nhiên liệu và mất an toàn khi chuyển làn ở tốc độ cao.",
      "Mỗi lần thay lốp mới hoặc đảo lốp định kỳ mỗi 10.000 km, bạn nên thực hiện đồng thời cân bằng động laser và căn chỉnh độ chụm 3D để vô-lăng luôn đầm chắc, trả lái mượt mà.",
    ],
  },
  {
    id: "art-3",
    slug: "phu-ceramic-o-to-co-thuc-su-can-thiet",
    category: "Chăm sóc & Detailing",
    title: "Phủ Ceramic 9H có tác dụng gì? Phân biệt rõ hiệu quả thực tế và hiểu lầm thường gặp",
    excerpt:
      "Hiểu đúng về bản chất lớp phủ gốm bảo vệ sơn xe trước tia UV, nhựa cây, mưa axit và cách chăm sóc để giữ độ bóng gương bền bỉ nhiều năm.",
    publishedDate: "11/11/2026",
    readTime: "6 phút đọc",
    author: "Chuyên gia Detailing Vũ Hải",
    coverImage: "/images/service-detailing.jpg",
    content: [
      "Phủ Ceramic không phải là 'áo giáp chống trầy xước va quẹt vật lý' như nhiều quảng cáo thổi phồng. Giá trị cốt lõi nhất của Ceramic 9H nằm ở khả năng kháng tia cực tím chống bạc màu sơn, ngăn nhựa cây – phân chim – mưa axit ăn mòn lớp bóng (clear coat) và tạo hiệu ứng lá sen chống bám bùn nước.",
      "Yếu tố quyết định 70% vẻ đẹp của một gói phủ Ceramic nằm ở khâu Hiệu chỉnh bề mặt sơn (Paint Correction) trước khi phủ: kỹ thuật viên phải xử lý sạch bụi sơn, nhựa đường và đánh bóng xóa các vết xước xoáy mạng nhện dưới đèn soi chuyên dụng.",
      "Để lớp phủ duy trì độ bóng sâu từ 2 đến 3 năm, chủ xe nên rửa xe bằng dung dịch pH trung tính và bảo dưỡng lớp phủ (top-coat) định kỳ mỗi 6 tháng tại xưởng detailing uy tín.",
    ],
  },
] as const;

export const contentService = {
  getAllArticles(): readonly BlogArticle[] {
    return BLOG_ARTICLES_MOCK;
  },
  getArticleBySlug(slug: string): BlogArticle | undefined {
    return BLOG_ARTICLES_MOCK.find((a) => a.slug === slug);
  },
};

