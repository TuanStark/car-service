"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { ApiError } from "@/infrastructure/api/api-client";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  EmptyState,
  ErrorState,
  Pagination,
  TableSkeleton,
} from "@/shared/ui/feedback";
import { ImageUploadField } from "@/shared/ui/image-upload";
import { Input, Select, Textarea } from "@/shared/ui/input";
import { StatusPill } from "@/shared/ui/status-badge";
import { useToast } from "@/shared/ui/toast-provider";
import { formatViDate } from "@/shared/utils/format";
import {
  type ArticleStatus,
  createAdminArticle,
  deleteAdminArticle,
  fetchAdminArticles,
  updateAdminArticle,
} from "../api";

export function ArticlesView() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin", "content", "articles", { page }],
    queryFn: () => fetchAdminArticles({ page, limit: 20 }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ArticleStatus }) =>
      updateAdminArticle(id, { status }),
    onSuccess: (a) => {
      notifySuccess(
        a.status === "PUBLISHED"
          ? `Đã xuất bản "${a.title}"`
          : `Đã chuyển về Nháp "${a.title}"`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "content", "articles"] });
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Thao tác thất bại.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminArticle(id),
    onSuccess: () => {
      notifySuccess("Đã xóa bài viết");
      void queryClient.invalidateQueries({ queryKey: ["admin", "content", "articles"] });
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Bài viết Cẩm nang Ô tô (CMS)
          </h1>
          <p className="text-xs text-ink-secondary">
            Quản trị nội dung kiến thức bảo dưỡng đồng bộ trực tiếp với API `/public/articles` cho autora-web
          </p>
        </div>

        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Viết bài mới
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof ApiError
                ? error.message
                : "Không thể tải danh sách bài viết."
            }
            onRetry={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có bài viết nào"
            description="Bấm 'Viết bài mới' để đăng tải nội dung cẩm nang lên website."
          />
        ) : (
          <>
            <div className="divide-y divide-line">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.coverImageUrl}
                      alt={a.title}
                      className="h-16 w-24 shrink-0 rounded-lg border border-line object-cover"
                    />
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          label={a.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                          tone={a.status === "PUBLISHED" ? "success" : "neutral"}
                        />
                        <span className="font-semibold text-brand">{a.category}</span>
                      </div>
                      <h3 className="text-sm font-bold text-ink">{a.title}</h3>
                      <p className="text-ink-secondary line-clamp-2">{a.excerpt}</p>
                      <div className="text-[11px] text-ink-muted">
                        Slug: <span className="font-mono">{a.slug}</span> •{" "}
                        {formatViDate(a.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({
                          id: a.id,
                          status: a.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                        })
                      }
                    >
                      {a.status === "PUBLISHED" ? "Chuyển nháp" : "Xuất bản"}
                    </Button>
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(a.id)}
                      className="text-danger hover:opacity-80"
                      title="Xóa bài viết"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {data?.meta && (
              <div className="border-t border-line px-4 py-3">
                <Pagination meta={data.meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>

      {createOpen && (
        <CreateArticleModal onClose={() => setCreateOpen(false)} />
      )}
    </div>
  );
}

function CreateArticleModal({ onClose }: { readonly onClose: () => void }) {
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bảo dưỡng định kỳ");
  const [status, setStatus] = useState<ArticleStatus>("PUBLISHED");
  const [excerpt, setExcerpt] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80"
  );

  const mutation = useMutation({
    mutationFn: () =>
      createAdminArticle({
        title: title.trim(),
        category: category.trim(),
        status,
        excerpt: excerpt.trim(),
        contentMarkdown: contentMarkdown.trim(),
        coverImageUrl: coverImageUrl.trim(),
      }),
    onSuccess: (a) => {
      notifySuccess(`Đã tạo bài viết "${a.title}"`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "content", "articles"] });
      onClose();
    },
    onError: (err) => {
      notifyError(err instanceof ApiError ? err.message : "Tạo bài viết thất bại.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-surface-elevated p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="text-base font-bold text-ink">Viết bài Cẩm nang mới</h3>
          <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-4 space-y-3"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Tiêu đề bài viết *</label>
            <Input
              required
              placeholder="VD: Cách kiểm tra bình ắc quy trước mùa mưa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Chuyên mục *</label>
              <Input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Trạng thái *</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
              >
                <option value="PUBLISHED">Xuất bản ngay</option>
                <option value="DRAFT">Lưu bản nháp</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Tóm tắt (Excerpt) *</label>
            <Textarea
              required
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Nội dung chi tiết *</label>
            <Textarea
              required
              rows={5}
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
            />
          </div>
          <ImageUploadField
            label="Ảnh bìa bài viết"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Lưu bài viết"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

