import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import PaginationDto from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger: Logger = new Logger(ProductsService.name);
  async onModuleInit() {
    this.logger.log('Database connection has been established.');
    await this.$connect();
  }
  create(createProductDto: CreateProductDto) {
    this.logger.log(
      `Creating a new product with the following data: ${JSON.stringify(createProductDto)}`,
    );
    const newProduct = this.product.create({
      data: createProductDto,
    });

    return newProduct;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalPages = this.product.count();
    const lastPage = Math.ceil((await totalPages) / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          available: true,
        },
      }),
      meta: {
        page,
        limit,
        totalPages,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: {
        id,
        available: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: __, ...data } = updateProductDto;

    try {
      const product = await this.product.update({
        where: {
          id,
        },
        data: data,
      });
      return {
        message: `Product with id ${id} has been updated`,
        data: product,
      };
    } catch (error) {
      // product not found
      if (error.code === 'P2025') {
        throw new NotFoundException(`Product with id ${id} not found`);
      }
    }
  }

  async remove(id: number) {
    try {
      const product = await this.product.update({
        where: {
          id,
        },
        data: {
          available: false,
        },
      });
      return {
        message: `Product with id ${id} has been deleted`,
        data: product,
      };
    } catch (error) {
      // product not found
      if (error.code === 'P2025') {
        throw new NotFoundException(`Product with id ${id} not found`);
      }
    }
  }
}
