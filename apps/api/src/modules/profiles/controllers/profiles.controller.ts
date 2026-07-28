import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProfilesService } from '../services/profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('health')
  health() {
    return this.profilesService.health();
  }

  @UseGuards(JwtAuthGuard)
  @Get('models')
  listModels(
    @Query('gender') gender?: string,
    @Query('filter') filter?: string,
    @Query('q') q?: string,
  ) {
    return this.profilesService.listModels({ gender, filter, q });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username')
  getByUsername(@Param('username') username: string) {
    return this.profilesService.getByUsername(username);
  }
}
