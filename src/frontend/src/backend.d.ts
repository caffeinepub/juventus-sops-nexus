import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: bigint;
    name: string;
    isAvailable: boolean;
    description: string;
    imageUrl: string;
    isFeatured: boolean;
    category: string;
    price: bigint;
}
export interface OrderType {
    id: bigint;
    status: Status;
    createdAt: Time;
    user: Principal;
    totalAmount: bigint;
    items: Array<CartItem>;
}
export type Time = bigint;
export interface ServiceInquiry {
    id: bigint;
    createdAt: Time;
    user: Principal;
    message: string;
    contactEmail: string;
    serviceId: bigint;
}
export interface Service {
    id: bigint;
    name: string;
    description: string;
    imageUrl: string;
    isFeatured: boolean;
    category: string;
    priceLabel: string;
}
export interface CartItem {
    quantity: number;
    product: Product;
}
export interface UserRecord {
    principal: Principal;
    joinedAt: Time;
    role: UserRole;
    profileName?: string;
}
export interface UserProfile {
    name: string;
}
export interface PaymentMethod {
    id: bigint;
    methodName: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    instructions: string;
}
export interface PaymentConfirmation {
    id: bigint;
    orderId: bigint;
    user: Principal;
    receiptNote: string;
    contactEmail: string;
    createdAt: Time;
}
export enum Status {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    processing = "processing"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    addPaymentMethod(method: PaymentMethod): Promise<void>;
    addService(service: Service): Promise<void>;
    addToCart(productId: bigint, quantity: number): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getInquiries(): Promise<Array<ServiceInquiry>>;
    getOrders(): Promise<Array<OrderType>>;
    getPaymentConfirmations(): Promise<Array<PaymentConfirmation>>;
    getPaymentMethods(): Promise<Array<PaymentMethod>>;
    getProducts(category: string | null): Promise<Array<Product>>;
    getServices(): Promise<Array<Service>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUsers(): Promise<Array<UserRecord>>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(): Promise<bigint>;
    registerUser(): Promise<void>;
    removeFromCart(productId: bigint): Promise<void>;
    removePaymentMethod(id: bigint): Promise<void>;
    removeProduct(id: bigint): Promise<void>;
    removeService(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitInquiry(serviceId: bigint, message: string, contactEmail: string): Promise<void>;
    submitPaymentConfirmation(orderId: bigint, receiptNote: string, contactEmail: string): Promise<void>;
    updateCartItem(productId: bigint, quantity: number): Promise<void>;
    updateOrderStatus(orderId: bigint, status: Status): Promise<void>;
    updatePaymentMethod(id: bigint, method: PaymentMethod): Promise<void>;
    updateProduct(id: bigint, updatedProduct: Product): Promise<void>;
    updateService(id: bigint, updatedService: Service): Promise<void>;
}
