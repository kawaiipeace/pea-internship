import { api } from "./client";

// ประเภทข้อมูล DocType (ประเภทเอกสาร)
export interface DocType {
  id: number;
  name: string;
  description: string | null;
  isRequired: boolean | null;
}

// DocType API functions
export const docTypeApi = {
  // ดึงรายการประเภทเอกสารทั้งหมด
  getDocTypes: async (): Promise<DocType[]> => {
    const response = await api.get<DocType[]>("/doc-types");
    return response.data;
  },
};
