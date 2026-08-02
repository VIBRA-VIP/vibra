import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CompleteProfileDto,
  SetIdDocumentDto,
  UpdatePayoutDto,
  UpdateSettingsDto,
} from '../dto/profile-setup.dto';
import { ProfilesService } from '../services/profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('health')
  health() {
    return this.profilesService.health();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.profilesService.getMine(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete')
  complete(@CurrentUser() user: { id: string }, @Body() body: CompleteProfileDto) {
    return this.profilesService.completeProfile(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('id-document')
  setIdDocument(@CurrentUser() user: { id: string }, @Body() body: SetIdDocumentDto) {
    return this.profilesService.setIdDocument(
      user.id,
      body.idDocumentUrl,
      body.idDocumentBackUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  settings(@CurrentUser() user: { id: string }, @Body() body: UpdateSettingsDto) {
    return this.profilesService.updateSettings(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('payout')
  payout(@CurrentUser() user: { id: string }, @Body() body: UpdatePayoutDto) {
    return this.profilesService.updatePayout(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('models')
  listModels(
    @CurrentUser() user: { id: string },
    @Query('gender') gender?: string,
    @Query('filter') filter?: string,
    @Query('q') q?: string,
  ) {
    return this.profilesService.listModels(user.id, { gender, filter, q });
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  listFavorites(@CurrentUser() user: { id: string }) {
    return this.profilesService.listFavorites(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('favorites/:modelUserId')
  toggleFavorite(
    @CurrentUser() user: { id: string },
    @Param('modelUserId') modelUserId: string,
  ) {
    return this.profilesService.toggleFavorite(user.id, modelUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('clients')
  listClients(
    @CurrentUser() user: { id: string },
    @Query('gender') gender?: string,
    @Query('filter') filter?: string,
    @Query('q') q?: string,
  ) {
    return this.profilesService.listClients(user.id, { gender, filter, q });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username')
  getByUsername(
    @CurrentUser() user: { id: string },
    @Param('username') username: string,
  ) {
    return this.profilesService.getByUsername(username, user.id);
  }
}
