import { getAccessToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

export interface PartyDetails {
    companyName: string;
    businessCode?: string;
    address: string;
    legalRepresentative: string;
    position?: string;
    idCardNumber?: string;
    phone?: string;
    fax?: string;
    email?: string;
    entityId?: number;
}

export interface ContractItem {
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
}

export interface DeliveryDetail {
    itemName: string;
    unit: string;
    quantity: number;
    deliveryDate: Date;
    deliveryLocation: string;
    notes?: string;
}

export interface GenerateContractRequest {
    documentDate: Date;
    seller: PartyDetails;
    buyer: PartyDetails;
    items: ContractItem[];
    deliveryDetails: DeliveryDetail[];
    paymentTerms?: string;
    notes?: string;
}

export async function generateContractFromTemplate(contractData: GenerateContractRequest) {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/contracts/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contractData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate contract. Please check the details and try again.' }));
        throw new Error(errorData.message || 'An unknown error occurred.');
    }

    return await response.json();
} 