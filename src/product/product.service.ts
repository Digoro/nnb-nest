import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { AuthService } from 'src/auth/service/auth.service';
import { AnalysisHashtag, Product, ProductRequest, ProductReview } from 'src/product/model/product.entity';
import { Repository } from 'typeorm';
import { ProductCreateDto, ProductRequestCreateDto, ProductReviewCreateDto, ProductReviewSearchDto, ProductReviewUpdateDto, ProductUpdateDto } from './model/product.dto';
import { Category, Hashtag, ProductOption, ProductRepresentationPhoto } from './model/product.entity';

@Injectable()
export class ProductService {
  productRelations = ['host', 'representationPhotos', 'categories', 'options', 'hashtags'];
  productReviewRelations = ['user', 'product'];

  constructor(
    private authService: AuthService,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductRepresentationPhoto) private representationPhotoRepository: Repository<ProductRepresentationPhoto>,
    @InjectRepository(ProductOption) private optionRepository: Repository<ProductOption>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(Hashtag) private hashtagRepository: Repository<Hashtag>,
    @InjectRepository(AnalysisHashtag) private analysisHashtagRepository: Repository<AnalysisHashtag>,
    @InjectRepository(ProductRequest) private productRequestRepository: Repository<ProductRequest>,
    @InjectRepository(ProductReview) private productReviewRepository: Repository<ProductReview>
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

  async updateOne(id: number, productDto: ProductUpdateDto): Promise<any> {
    //TODO: ManyToMany relations(category, hashtag, analysistag)
    const product = await this.findById(id);
    return await this.productRepository.save(Object.assign(product, productDto))
  }

  async deleteOne(id: number): Promise<any> {
    return await this.productRepository.delete(id);
  }

  async productRequest(userId: number, productRequestDto: ProductRequestCreateDto): Promise<ProductRequest> {
    const user = await this.authService.findById(userId);
    const product = await this.productRepository.findOne(productRequestDto.productId);
    if (user && product) {
      const productRequest = productRequestDto.toEntity(user, product);
      const newRequest = await this.productRequestRepository.save(productRequest)
      return newRequest;
    } else {
      throw new BadRequestException()
    }
  }

  async findProductRequestById(id: number): Promise<ProductRequest> {
    return await this.productRequestRepository.findOne({ id });
  }

  async checkProductRequest(id: number, isChecked: boolean): Promise<any> {
    const productRequest = await this.findProductRequestById(id);
    if (!productRequest) throw new BadRequestException();
    productRequest.isChecked = isChecked;
    if (isChecked) productRequest.checkedAt = new Date();
    const original = await this.findProductRequestById(id);
    return await this.productRequestRepository.save(Object.assign(original, productRequest))
  }

  async createReview(userId: number, reviewDto: ProductReviewCreateDto): Promise<ProductReview> {
    const user = await this.authService.findById(userId);
    const product = await this.findById(reviewDto.productId);
    const parent = reviewDto.parentId ? await this.findProductReviewById(reviewDto.parentId) : undefined;
    const review = reviewDto.toEntity(user, product, parent);
    const newReview = await this.productReviewRepository.save(review);
    return newReview;
  }

  async paginateProductReview(search: ProductReviewSearchDto): Promise<Pagination<ProductReview>> {
    const options = { page: search.page, limit: search.limit }
    return await paginate<ProductReview>(this.productReviewRepository, options, { where: [{ product: search.productId }], relations: this.productReviewRelations })
  }

  async findProductReviewById(id: number): Promise<ProductReview> {
    return await this.productReviewRepository.findOne({ id }, { relations: this.productReviewRelations });
  }

  async updateProductReview(id: number, reviewDto: ProductReviewUpdateDto): Promise<any> {
    const review = await this.findProductReviewById(id);
    return await this.productReviewRepository.save(Object.assign(review, reviewDto))
  }

  async deleteProductReview(id: number): Promise<any> {
    const review = await this.productReviewRepository.findOne({ id }, { relations: ['children'] });
    if (review.children.length > 0) {
      const dto = new ProductReviewUpdateDto();
      dto.comment = '삭제된 댓글입니다.';
      return await this.updateProductReview(id, dto);
    } else {
      return await this.productReviewRepository.delete(id);
    }
  }
}
