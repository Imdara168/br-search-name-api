import { Body, Controller, Delete, Get, Patch, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { BulkCreateRegistrationDto } from './dto/bulk-create-registration.dto';

@Controller('api/v1')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('registrations/create')
  @UseGuards(AuthGuard)
  create(@Body() createRegistrationDto: CreateRegistrationDto) {
    return this.registrationsService.create(createRegistrationDto);
  }

  @Post('registrations/import')
  @UseGuards(AuthGuard)
  bulkImport(@Body() bulkCreateRegistrationDto: BulkCreateRegistrationDto) {
    return this.registrationsService.bulkCreate(bulkCreateRegistrationDto);
  }

  @Patch('registrations/edit/:slug')
  @UseGuards(AuthGuard)
  update(
    @Param('slug') slug: string,
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ) {
    return this.registrationsService.updateBySlug(slug, updateRegistrationDto);
  }

  @Delete('registrations/delete/:slug')
  @UseGuards(AuthGuard)
  remove(@Param('slug') slug: string) {
    return this.registrationsService.deleteBySlug(slug);
  }

  @Get('search-registrations')
  @UseGuards(AuthGuard)
  async search(
    @Query('query') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.registrationsService.search(
      query || '',
      true,
      Number(page || '1'),
      Number(limit || '10'),
      sort || 'asc',
    );
  }
}
