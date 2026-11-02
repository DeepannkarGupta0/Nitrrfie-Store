import { ActiveView, HandoverType } from '../types/store';

export interface CheckoutFormData {
  customerName: string;
  rollNumber: string;
  email: string;
  phone: string;
  handoverType: HandoverType;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  paymentMethod: 'upi_razorpay' | 'cash_at_desk';
  utrNumber: string;
  receiptImage: string | null;
}

export type CheckoutErrors = Record<string, string>;

export interface DepartmentInfo {
  branch: string;
  batch: string;
  degree: string;
}

export interface CheckoutPageProps {
  onNavigate: (view: ActiveView) => void;
}
