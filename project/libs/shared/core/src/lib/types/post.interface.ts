import { Comment } from "./comment.interface";
import { PostStatus } from "./post-status.enum";
import { PostType } from "./post-type.enum";

type Like = string;

interface BasePost {
  id?: string;
  type: PostType;
  status: PostStatus;
  publicationDate: Date;
  tags?: string[];
  userId: string;
  comments: Comment[];
  likes: Like[];
  isRepost: boolean;
  originalId: string;
  originalUserId: string;
}

export interface VideoPost extends BasePost {
  type: PostType.Video;
  title: string;
  url: string;
  text: string;
}

export interface TextPost extends BasePost {
  type: PostType.Text;
  title: string;
  description: string;
  text: string;
}

export interface PhotoPost extends BasePost {
  type: PostType.Photo;
  url: string;
}

export interface LinkPost extends BasePost {
  type: PostType.Link;
  url: string;
  description?: string;
}

export interface QuotePost extends BasePost {
  type: PostType.Quote;
  author: string;
  text: string;
}

export type Post = TextPost | PhotoPost | LinkPost | QuotePost;
