import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  RegisterUserDTO,
  LoginUserDTO,
  UserRDO,
  CreateUserDTO,
  LoggedUserRDO,
  AuthResponseDescription,
  ChangePasswordDTO,
} from '@project/authentication';
import { ApiUnit, AvatarLimit } from '../app.const';
import { AxiosExceptionFilter } from '../filters/axios-exception.filter';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DEFAULT_AVATAR } from '@project/file-uploader';
import { plainToInstance } from 'class-transformer';
import { AppService } from '../app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CheckAuthGuard } from '../guards/check-auth.guard';
import { getAppURL, TokenName } from '@project/helpers';
import { MongoIdValidationPipe } from '@project/pipes';
import { InjectUserIdInterceptor } from '@project/interceptors';
import { ConfigType } from '@nestjs/config';
import { gatewayConfig } from '@project/api-config';

const DEFAULT_AVATAR_PATH = `${ApplicationServiceURL.File}${DEFAULT_AVATAR}`;

@Controller('users')
@ApiTags(ApiUnit.User)
@UseFilters(AxiosExceptionFilter)
export class UsersController {
  constructor(
    @Inject(HttpService) private readonly httpService: HttpService,
    @Inject(AppService) private appService: AppService,
    @Inject(gatewayConfig.KEY) private baseUrl: ConfigType<typeof gatewayConfig>
  ) {}

  private getAuthorizationHeaders(req: Request) {
    return {
      headers: {
        Authorization: req.headers['authorization'],
      },
    };
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: AuthResponseDescription.UserCreated })
  @ApiConflictResponse({ description: AuthResponseDescription.UserExist })
  @ApiBadRequestResponse()
  public async register(
    @Body() dto: RegisterUserDTO,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: AvatarLimit.MaxSize })
        .addFileTypeValidator({ fileType: AvatarLimit.AvailableTypes })
        .build({ fileIsRequired: false })
    )
    avatarFile?: Express.Multer.File
  ) {
    const userDTO = plainToInstance(CreateUserDTO, {
      email: dto.email,
      name: dto.name,
      password: dto.password,
      avatar: avatarFile ? await this.appService.uploadFile(avatarFile) : DEFAULT_AVATAR_PATH,
    });

    const { data } = await this.httpService.axiosRef.post<UserRDO>(
      getAppURL(this.baseUrl.account, 'register'),
      userDTO
    );

    this.appService.notifyNewUser(data);
    return data;
  }

  @Post('login')
  @ApiCreatedResponse({ description: AuthResponseDescription.UserCreated })
  @ApiNotFoundResponse({ description: AuthResponseDescription.UserNotFound })
  @ApiBadRequestResponse()
  @ApiBody({ type: LoginUserDTO })
  public async login(@Body() loginUserDTO: LoginUserDTO) {
    const { data } = await this.httpService.axiosRef.post<LoggedUserRDO>(
      getAppURL(this.baseUrl.account),
      loginUserDTO
    );
    return { data };
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserRDO, description: AuthResponseDescription.Updated })
  @ApiNotFoundResponse({ description: AuthResponseDescription.UserNotFound })
  @ApiUnauthorizedResponse()
  @UseGuards(CheckAuthGuard)
  @ApiBearerAuth(TokenName.Access)
  public async update(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDTO,
    @Req() req: Request
  ) {
    const { data } = await this.httpService.axiosRef.patch<UserRDO>(
      getAppURL(this.baseUrl.account, `${id}`),
      dto,
      this.getAuthorizationHeaders(req)
    );

    return this.appService.getUserDetails(data);
  }

  @Get(':id')
  @UseGuards(CheckAuthGuard)
  @ApiBearerAuth(TokenName.Access)
  @ApiOkResponse({ type: UserRDO, description: AuthResponseDescription.UserFound })
  @ApiNotFoundResponse({ description: AuthResponseDescription.UserNotFound })
  @ApiUnauthorizedResponse()
  public async show(@Param('id') id: string, @Req() req: Request) {
    const { data } = await this.httpService.axiosRef.get<UserRDO>(
      getAppURL(this.baseUrl.account, `${id}`),
      this.getAuthorizationHeaders(req)
    );

    return this.appService.getUserDetails(data);
  }

  @Post('refresh')
  @ApiUnauthorizedResponse()
  @ApiBearerAuth(TokenName.Refresh)
  public async refreshToken(@Req() req: Request) {
    const { data } = await this.httpService.axiosRef.post<LoggedUserRDO>(
      getAppURL(this.baseUrl.account, 'refresh'),
      null,
      this.getAuthorizationHeaders(req)
    );

    return data;
  }

  @Post('check')
  @UseGuards(CheckAuthGuard)
  @ApiUnauthorizedResponse()
  @ApiBearerAuth(TokenName.Access)
  @ApiCreatedResponse({ type: LoggedUserRDO, description: AuthResponseDescription.UserFound })
  public async checkToken(@Req() req: Request) {
    const { data } = await this.httpService.axiosRef.post<LoggedUserRDO>(
      getAppURL(this.baseUrl.account, 'check'),
      null,
      this.getAuthorizationHeaders(req)
    );

    return data;
  }

  @Post('subscribe/:id')
  @UseGuards(CheckAuthGuard)
  @UseInterceptors(InjectUserIdInterceptor)
  @ApiBearerAuth(TokenName.Access)
  @ApiOkResponse()
  @ApiUnauthorizedResponse()
  public async subscribe(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body('userId') userId: string
  ) {
    const { data } = await this.httpService.axiosRef.post(
      getAppURL(this.baseUrl.account, `${userId}/subscribe/${id}`)
    );
    return data;
  }

  @Delete('unsubscribe/:id')
  @UseGuards(CheckAuthGuard)
  @UseInterceptors(InjectUserIdInterceptor)
  @ApiBearerAuth(TokenName.Access)
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  public async unsubscribe(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body('userId') userId: string
  ) {
    const { data } = await this.httpService.axiosRef.delete(
      getAppURL(this.baseUrl.account, `${userId}/unsubscribe/${id}`)
    );
    return data;
  }
}
