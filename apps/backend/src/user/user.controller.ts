import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser('userId') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() body: { name?: string; avatarUrl?: string }
  ) {
    return this.userService.updateProfile(userId, body);
  }

  @Get('profiles')
  listProfiles(@CurrentUser('userId') userId: string) {
    return this.userService.listProfiles(userId);
  }

  @Post('profiles')
  createProfile(
    @CurrentUser('userId') userId: string,
    @Body() body: { name: string; avatarColor?: string; isKids?: boolean; pin?: string }
  ) {
    return this.userService.createProfile(userId, body);
  }

  @Delete('profiles/:id')
  deleteProfile(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string
  ) {
    return this.userService.deleteProfile(userId, id);
  }

  @Get('devices')
  listDevices(@CurrentUser('userId') userId: string) {
    return this.userService.listDevices(userId);
  }

  @Delete('devices/:id')
  deleteDevice(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string
  ) {
    return this.userService.deleteDevice(userId, id);
  }
}
