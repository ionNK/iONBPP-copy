export class CreatePromotionDto {
    name: string;
    description?: string;
    type: string;
    status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';
    config: Record<string, any>;
    startDate?: string | Date;
    endDate?: string | Date;
}
