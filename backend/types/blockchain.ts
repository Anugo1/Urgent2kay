export type BillStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface Bill {
  id: number;
  beneficiary: string;
  paymentDestination: string;
  sponsor: string;
  amount: string;
  description: string;
  status: BillStatus;
  createdAt: Date;
  paidAt: Date | null;
}

export interface ABI {
  abi: any[];
  [key: string]: any;
} 