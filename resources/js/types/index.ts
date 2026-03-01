import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    roles: string[];
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    fill?: boolean;
    permission?: string;
}

export interface UpdateInfo {
    available: boolean;
    current_version: string;
    latest_version: string | null;
    release_notes: string | null;
    release_url: string | null;
    published_at: string | null;
}

export interface LicenseInfo {
    is_licensed: boolean;
    licensee_name: string | null;
    license_type: string | null;
    expires_at: string | null;
    features: string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: {
        status?: string;
        message?: string;
    };
    update?: UpdateInfo;
    license?: LicenseInfo;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: { id: number; name: string }[];
    [key: string]: unknown;
}

export interface StaffData {
    id: number;
    name: string;
    username: string;
    phone: string;
    email?: string;
    password?: string;
    role?: string;
    roles?: { id: number; name: string }[];
}

export interface ItemData {
    uuid?: string;
    name: string;
    description?: string;
    price: number;
    cost_price?: number;
    stock_quantity?: number;
    low_stock_threshold?: number;
    track_stock?: boolean;
    category_id?: number | null;
    category?: CategoryData;
    created_at: string;
}

export interface CategoryData {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color: string;
    sort_order: number;
    items_count?: number;
}

export interface ReceiptAudit {
    id: number;
    receipt_id: number;
    user_id: number;
    user?: { id: number; name: string };
    action: string;
    changes?: Record<string, unknown>;
    created_at: string;
}

export interface Receipt {
    id: number;
    receipt_number?: string;
    customer_name: string;
    customer_id?: number;
    customer?: CustomerData;
    payment_method: string;
    amount_tendered?: number;
    change_due?: number;
    discount_type?: string;
    discount_value?: number;
    subtotal?: number;
    total?: number;
    notes?: string;
    printed_at: string;
    is_finalized?: boolean;
    shift_id?: number;
    user: {
        id: number;
        name: string;
    };
    items?: ReceiptLineItem[];
    audits?: ReceiptAudit[];
    created_at: string;
}

export interface ReceiptLineItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    item_id?: string;
}

export interface CustomerData {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    receipts_count?: number;
}

export interface ShiftData {
    id: number;
    user_id: number;
    user?: { id: number; name: string };
    opening_balance: number;
    closing_balance?: number;
    expected_balance?: number;
    difference?: number;
    notes?: string;
    opened_at: string;
    closed_at?: string;
    receipts_count?: number;
}

export interface ExpenseData {
    id: number;
    title: string;
    description?: string;
    amount: number;
    category: string;
    expense_date: string;
    user?: { id: number; name: string };
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface StockMovementData {
    id: number;
    item_uuid: string;
    quantity: number;
    type: string;
    reference?: string;
    notes?: string;
    user?: { id: number; name: string };
    created_at: string;
}
