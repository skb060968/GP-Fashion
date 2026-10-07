
export type OrderEmailData = {
  orderCode: string;
  amount: number;
  discount?: number;
  status: string;
  createdAt: Date;
  paymentMethod: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: {
    name: string;
    size: string;
    price: number;
    quantity: number;
    coverThumbnail: string;
  }[];
};
