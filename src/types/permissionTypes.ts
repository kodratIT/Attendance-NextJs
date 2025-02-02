export type PermissionRowType = {
  id: number;
  name: string;
  createdAt: string;
  assignedTo: { id: string; name: string }[]; // ✅ Array of objects
  action: string[];
};
