import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all products' })
  @ApiResponse({ status: 200, description: 'List of all products.' })
  findAll(
    @Query('query') query: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('categoryId') categoryId: string,
  ) {
    return this.productsService.findAll(
      query,
      +page || 1,
      +limit || 20,
      categoryId ? +categoryId : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific product by ID' })
  @ApiResponse({ status: 200, description: 'The product details.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'The updated product.' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft delete) a product' })
  @ApiResponse({ status: 200, description: 'Product successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
