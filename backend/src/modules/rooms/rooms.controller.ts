import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from '../housekeeping/dto/create-room.dto';
import { UpdateRoomDto } from '../housekeeping/dto/update-room.dto';

// Actually, I'll just put them here for Room and RoomType

@ApiTags('rooms')
@ApiBearerAuth()
@Controller('parameters')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @RequirePermission('parameters', 'read')
  @ApiOperation({ summary: 'Liste les types de chambres' })
  @Get('room-types')
  listRoomTypes() {
    return this.roomsService.listRoomTypes();
  }

  @RequirePermission('parameters', 'write')
  @Post('room-types')
  createRoomType(@Body() dto: any) {
    return this.roomsService.createRoomType(dto);
  }

  @RequirePermission('parameters', 'write')
  @Patch('room-types/:id')
  updateRoomType(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.roomsService.updateRoomType(id, dto);
  }

  @RequirePermission('parameters', 'write')
  @Delete('room-types/:id')
  deleteRoomType(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.deleteRoomType(id);
  }

  @RequirePermission('parameters', 'write')
  @Post('rooms')
  createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto);
  }

  @RequirePermission('parameters', 'write')
  @Patch('rooms/:id')
  updateRoom(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, dto);
  }

  @RequirePermission('parameters', 'write')
  @Delete('rooms/:id')
  deleteRoom(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.deleteRoom(id);
  }
}
