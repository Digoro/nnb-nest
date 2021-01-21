import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { AnalysisHashtag, Product } from 'src/product/model/product.entity';
import { Repository } from 'typeorm';
import { ProductCreateDto, ProductUpdateDto } from './model/product.dto';
import { Category, Hashtag, ProductOption, ProductRepresentationPhoto } from './model/product.entity';

@Injectable()
export class ProductService {
  productRelations = ['host', 'representationPhotos', 'categories', 'options', 'hashtags'];

  constructor(
    private authService: AuthService,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductRepresentationPhoto) private representationPhotoRepository: Repository<ProductRepresentationPhoto>,
    @InjectRepository(ProductOption) private optionRepository: Repository<ProductOption>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(Hashtag) private hashtagRepository: Repository<Hashtag>,
    @InjectRepository(AnalysisHashtag) private analysisHashtagRepository: Repository<AnalysisHashtag>
  ) { }

  async create(userId: number, productDto: ProductCreateDto): Promise<Product> {
    const user = await this.authService.findById(userId);

    const categories = [];
    for (let i = 0; i < productDto.categoryIds.length; i++) {
      const category = await this.categoryRepository.findOne({ id: productDto.categoryIds[i] });
      if (category) {
        categories.push(category);
      }
    }

    const hashtags = [];
    for (let i = 0; i < productDto.hashtags.length; i++) {
      let hashtag: Hashtag;
      hashtag = await this.hashtagRepository.findOne({ name: productDto.hashtags[i].name });
      if (!hashtag) {
        hashtag = await this.hashtagRepository.save(productDto.hashtags[i]);
      }
      if (hashtag) {
        hashtags.push(hashtag);
      }
    }

    const analysisHashtags = [];
    if (productDto.analysisHashtags) {
      for (let i = 0; i < productDto.analysisHashtags.length; i++) {
        let analysisHashtag: AnalysisHashtag;
        analysisHashtag = await this.analysisHashtagRepository.findOne({ name: productDto.analysisHashtags[i].name });
        if (!analysisHashtag) {
          analysisHashtag = await this.analysisHashtagRepository.save(productDto.analysisHashtags[i]);
        }
        if (analysisHashtag) {
          analysisHashtags.push(analysisHashtag);
        }
      }
    }

    const product = productDto.toEntity(user, categories, hashtags, analysisHashtags);
    const newProduct = await this.productRepository.save(product);

    productDto.representationPhotos.forEach(async (photo) => {
      photo.product = newProduct;
      await this.representationPhotoRepository.save(photo);
    });

    productDto.options.forEach(async (option) => {
      option.product = newProduct;
      await this.optionRepository.save(option);
    });

    return newProduct;
  }

  async paginateAll(options: IPaginationOptions): Promise<Pagination<Product>> {
    return await paginate<Product>(this.productRepository, options, { relations: this.productRelations })
  }

  async paginateByHost(options: IPaginationOptions, hostId: number): Promise<Pagination<Product>> {
    return await paginate<Product>(this.productRepository, options, { where: [{ host: hostId }], relations: this.productRelations })
  }

  async findById(id: number): Promise<Product> {
    return await this.productRepository.findOne({ id }, { relations: this.productRelations });
  }

  private async update<T>(id: number, productForUpdate: T): Promise<any> {
    const product = await this.findById(id);
    return await this.productRepository.save(Object.assign(product, productForUpdate))
  }

  async updateOne(id: number, productDto: ProductUpdateDto): Promise<any> {
    //TODO: ManyToMany relations(category, hashtag, analysistag)
    return await this.update(id, productDto);
  }

  async deleteOne(id: number): Promise<any> {
    return await this.productRepository.delete(id);
  }
}
