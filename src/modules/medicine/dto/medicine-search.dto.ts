import { IsString, IsEnum } from 'class-validator';
import { MedicineListItemDto, PaginatedMedicineListDto, PaginationMetadataDto } from './medicine-listing.dto';

/**
 * Match type for search results
 */
export enum SearchMatchType {
  EXACT = 'exact',
  PREFIX = 'prefix',
  PARTIAL = 'partial',
}

/**
 * DTO for a single medicine in search results
 * Extends listing item with match relevance
 */
export class MedicineSearchItemDto extends MedicineListItemDto {
  @IsEnum(SearchMatchType)
  match_type: SearchMatchType;
}

/**
 * Search results response DTO
 */
export class MedicineSearchResultDto {
  @IsString()
  query: string;

  data: MedicineSearchItemDto[];
  pagination: PaginationMetadataDto;
}
