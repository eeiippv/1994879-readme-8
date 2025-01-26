import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDTO } from './dto/create-post.dto';
import { UpdatePostDTO } from './dto/update-post.dto';
import { PostRepository } from './post.repository';
import { plainToClass } from 'class-transformer';
import { PostEntity } from './entities/post.entity';
import { PostFactory } from './post.factory';
import { PostQuery } from './post.query';
import { Nullable, PaginationResult } from '@project/core';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async create(dto: CreatePostDTO): Promise<PostEntity> {
    const newPost = PostFactory.createFromPostDTO(dto);
    await this.postRepository.save(newPost);
    return newPost;
  }

  async findAll(query: PostQuery): Promise<PaginationResult<PostEntity>> {
    return this.postRepository.findAll(query);
  }

  async findOne(id: string): Promise<PostEntity> {
    return this.postRepository.findById(id);
  }

  async update(id: string, dto: UpdatePostDTO): Promise<PostEntity> {
    const existsPost = await this.postRepository.findById(id);
    const updatePost = PostFactory.createFromPostDTO(dto);
    let hasChanges = false;

    for (const [key, value] of Object.entries(updatePost)) {
      if (value !== undefined && existsPost[key] !== value) {
        existsPost[key] = value;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      return existsPost;
    }

    await this.postRepository.update(existsPost);

    return existsPost;
  }

  async remove(id: string): Promise<void> {
    try {
      await this.postRepository.deleteById(id);
    } catch {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
  }
}
