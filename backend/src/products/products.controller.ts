import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';

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
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(createProductDto, req.user?.userId || req.user?.id);
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
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Req() req: any) {
    return this.productsService.update(+id, updateProductDto, req.user?.userId || req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete (soft delete) a product' })
  @ApiResponse({ status: 200, description: 'Product successfully deleted.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload photos for a product' })
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.addImages(+id, files || []);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a photo from a product' })
  deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.deleteImage(+id, +imageId);
  }

  @Patch(':id/estimate')
  @ApiOperation({ summary: 'Attach or update an estimate copy for a product' })
  updateEstimate(
    @Param('id') id: string,
    @Body()
    body: {
      estimateData: any;
      savedEstimateId?: number;
      updateUnitPrice?: boolean;
      unitPrice?: number;
    },
    @Req() req: any,
  ) {
    return this.productsService.updateEstimate(+id, body, req.user?.userId || req.user?.id);
  }
}
