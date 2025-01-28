import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SwaggerResponse } from '@project/core';

export function ApiCustomResponse() {
  return applyDecorators(
    ApiBadRequestResponse({ description: SwaggerResponse.BadRequest }),
    ApiUnauthorizedResponse({ description: SwaggerResponse.Unauthorized })
  );
}
