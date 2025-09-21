import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNegative, IsString, IsNotEmpty } from "class-validator";

export class WatchListDto {
@ApiProperty({ 
    description: 'stock symbols', 
    example: 'VCB',
    type: String
  })
  @IsNotEmpty()
  @IsString({ each: true })
  ticker: string;
}