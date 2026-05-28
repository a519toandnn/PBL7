import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import {
  MedicineListItemDto,
  PaginationMetadataDto,
} from './medicine-listing.dto';

/**
 * Match type for search results
 */
export enum SearchMatchType {
  EXACT = 'exact',
  PREFIX = 'prefix',
  PARTIAL = 'partial',
  SEMANTIC = 'semantic',
}

/**
 * DTO for a single medicine in search results
 * Extends listing item with match relevance
 */
export class MedicineSearchItemDto extends MedicineListItemDto {
  @IsEnum(SearchMatchType)
  match_type: SearchMatchType;

  @IsOptional()
  @IsNumber()
  score?: number;
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
