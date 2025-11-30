export interface CLO {
  id: number;
  code: string;
  description: string;
  courseId: number;
  bloomLevel?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  course?: {
    id: number;
    name: string;
    code: string;
  };
}
