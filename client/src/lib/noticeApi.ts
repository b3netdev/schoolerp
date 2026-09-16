import api from "@/lib/api";

export type NoticeFor = "student" | "teacher" | "admin";

export type Notice = {
  id: number;
  notice_for: NoticeFor[];
  title: string;
  description: string;
  class_ids: number[];
  class_names?: string[];
  posted_by_name?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type NoticePayload = {
  notice_for: NoticeFor[];
  title: string;
  description: string;
  class_ids: number[];
};

export const noticeApi = {
  getAll: (params?: {
    status?: "all" | "active" | "trash";
    date?: string;
    class_id?: number;
    notice_for?: NoticeFor;
  }) => api.get("/notice/get-notices", { params }),

  create: (payload: NoticePayload) =>
    api.post("/notice/add-notice", payload),

  update: (id: number, payload: Partial<NoticePayload>) =>
    api.post(`/notice/update-notice/${id}`, payload),

  remove: (id: number) =>
    api.delete(`/notice/delete-notice/${id}`),
};
