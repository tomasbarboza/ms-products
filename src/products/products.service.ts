import {
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import PaginationDto from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger: Logger = new Logger(ProductsService.name);
  async onModuleInit() {
    this.logger.log('Database connection has been established.');
    await this.$connect();
  }
  create(createProductDto: CreateProductDto) {
    try {
      const newProduct = this.product.create({
        data: createProductDto,
      });
  
      return newProduct;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
   
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;

      const totalPages = await this.product.count();
      const lastPage = Math.ceil(totalPages / limit);

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
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.product.findFirst({
        where: {
          id,
          available: true,
        },
      });

      if (!product) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Product with id ${id} not found`,
        });
      }

      return product;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: __, ...data } = updateProductDto;

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
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Product with id ${id} not found`,
        });
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
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Product with id ${id} not found`,
        });
      } else {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
        });
      }
    }
  }

  async validateProducts(ids: number[]) {

    ids = Array.from(new Set(ids));

    try {
      const products = await this.product.findMany({
        where: {
          id: {
            in: ids,
          },
          available: true,
        },
      });

      if (products.length !== ids.length) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Some products are not available',
        });
      }

      return products;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      });
    }
  }
}
