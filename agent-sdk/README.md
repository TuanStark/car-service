# @autora/agent-sdk

Framework-agnostic TypeScript SDK & Embeddable React Widget cho nền tảng AI Agent Platform.

## Cài đặt & Tích hợp vào Host Website

1. Implement `NavigationAdapter`:
   - `getCapabilities()`: khai báo các action mà website hỗ trợ (`garage.search`, `service.show`, `booking.fill_draft`...).
   - `getCurrentContext()`: cung cấp trang hiện tại và thông tin xe đang chọn (nếu có).
   - `navigate(action)`: ánh xạ action từ Agent sang router/state nội bộ của website.
2. Render `<AgentWidget apiBaseUrl="http://localhost:4100" tenantId="autora-vn" navigationAdapter={adapter} />`.

