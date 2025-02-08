export type UserRowType = {
    id?: string; 
    name: string; 
    email: string;
    role: {
        id: string;
        name:string;
    }; 
    areas: {
        id: string;
        name:string;
    }[]; 
    shifts: {
        id: string;
        name:string;
    }[];
    createdAt?: string; 
    updatedAt?: string; 
    action: string[];
  };