import { Injectable } from '@nestjs/common';

import { EntityFactory, Comment } from '@project/core';
import { CreateCommentDTO } from './dto/create-comment.dto';
import { CommentEntity } from './entities/comment.entity';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CommentFactory implements EntityFactory<CommentEntity> {
  public create(entityPlainData: Comment): CommentEntity {
    return new CommentEntity(entityPlainData);
  }

  public createFromDTO(dto: CreateCommentDTO, postId: string): CommentEntity {
    const entity = plainToClass(CommentEntity, dto);
    entity.postId = postId;
    return entity;
  }
}
