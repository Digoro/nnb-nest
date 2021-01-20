import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { AnalysisHashtagEntity, ProductEntity } from 'src/product/model/product.entity';
import { Repository } from 'typeorm';
import { ProductCreateDto, ProductUpdateDto } from './model/product.dto';
import { CategoryEntity, HashtagEntity, ProductOptionEntity, ProductRepresentationPhotoEntity } from './model/product.entity';

@Injectable()
export class ProductService {
  productRelations = ['host', 'representationPhotos', 'categories', 'options', 'hashtags', 'analysisTags'];

  constructor(
    private authService: AuthService,
    @InjectRepository(ProductEntity) private productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductRepresentationPhotoEntity) private representationPhotoRepository: Repository<ProductRepresentationPhotoEntity>,
    @InjectRepository(ProductOptionEntity) private optionRepository: Repository<ProductOptionEntity>,
    @InjectRepository(CategoryEntity) private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(HashtagEntity) private hashtagRepository: Repository<HashtagEntity>,
    @InjectRepository(AnalysisHashtagEntity) private analysisHashtagRepository: Repository<AnalysisHashtagEntity>
  ) { }

  async create(userId: number, productDto: ProductCreateDto): Promise<ProductEntity> {
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
      let hashtag: HashtagEntity;
      hashtag = await this.hashtagRepository.findOne({ name: productDto.hashtags[i].name });
      if (!hashtag) {
        hashtag = await this.hashtagRepository.save(productDto.hashtags[i]);
      }
      if (hashtag) {
        hashtags.push(hashtag);
      }
    }

    let analysisHashtags = [];
    if (productDto.analysisHashtags) {
      for (let i = 0; i < productDto.analysisHashtags.length; i++) {
        let analysisHashtag: AnalysisHashtagEntity;
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

  async paginateAll(options: IPaginationOptions): Promise<Pagination<ProductEntity>> {
    return await paginate<ProductEntity>(this.productRepository, options, { relations: this.productRelations })
  }

  async paginateByHost(options: IPaginationOptions, hostId: number): Promise<Pagination<ProductEntity>> {
    return await paginate<ProductEntity>(this.productRepository, options, { where: [{ host: hostId }], relations: this.productRelations })
  }

  async findById(id: number): Promise<ProductEntity> {
    return await (this.productRepository.findOne({ id }, { relations: this.productRelations }));
  }

  async update<T>(id: number, productForUpdate: T): Promise<any> {
    const user = await this.findById(id);
    return await this.productRepository.save(Object.assign(user, productForUpdate))
  }

  async updateOne(id: number, product: ProductUpdateDto): Promise<any> {
    return await this.update(id, product);
  }

  async deleteOne(id: number): Promise<any> {
    return await this.productRepository.delete(id);
  }
}
