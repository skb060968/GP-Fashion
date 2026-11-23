
export type OrderEmailData = {
  orderCode: string;
  amount: number;
  discount?: number;
  gst?: number;
  invoiceNumber?: string | null;
  creditNote?: { number: string; slug: string; amount: number } | null;
  returnRequest?: { reason: string; resolution: string; items: string[]; note: string | null; photos: boolean } | null;
  paymentReference?: string | null;
  accessToken?: string;
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
  billing?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: {
    name: string;
    size: string;
    color?: string | null;
    price: number;
    quantity: number;
    coverThumbnail: string;
    madeToMeasureFor?: string | null;
  }[];
};
